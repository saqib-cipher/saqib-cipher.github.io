/**
 * SketchX Web Post Viewer & Smart Deep Link Controller
 */

// Production Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyBiyDhOw6prURPXzUqONbW4JhCwEZqkXBE",
    authDomain: "sketchx-88b8e.firebaseapp.com",
    databaseURL: "https://sketchx-88b8e-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "sketchx-88b8e",
    storageBucket: "sketchx-88b8e.firebasestorage.app",
    messagingSenderId: "305217175374",
    appId: "1:305217175374:android:85193f44ed3b39ea78a81f"
};

// Initialize Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const auth = firebase.auth();
const db = firebase.database();

const PLAYSTORE_URL = "https://play.google.com/store/apps/details?id=glab.sketchx";

let currentPost = null;
let currentPostId = null;

document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initPostViewer();
});

/* ==========================================================
   THEME TOGGLER
   ========================================================== */
function initTheme() {
    const savedTheme = localStorage.getItem('sketchx_theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);

    const toggleBtn = document.getElementById('themeToggleBtn');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            const current = document.documentElement.getAttribute('data-theme') || 'dark';
            const next = current === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', next);
            localStorage.setItem('sketchx_theme', next);
            updateThemeIcon(next);
        });
    }
}

function updateThemeIcon(theme) {
    const icon = document.getElementById('themeIcon');
    if (icon) {
        icon.className = theme === 'dark' ? 'ti ti-sun' : 'ti ti-moon';
    }
}

/* ==========================================================
   POST VIEWER & DEEP LINK CONTROLLER
   ========================================================== */
function getPostIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    let id = params.get('id') || params.get('postId') || params.get('post');
    if (!id) {
        const pathSegments = window.location.pathname.split('/').filter(Boolean);
        if (pathSegments.length > 0) {
            const last = pathSegments[pathSegments.length - 1];
            if (last && !last.includes('post.html') && !last.includes('post')) {
                id = last;
            }
        }
    }
    return id;
}

function initPostViewer() {
    currentPostId = getPostIdFromUrl();
    if (!currentPostId) {
        showError("No Post ID specified in URL. Please check your link.");
        return;
    }

    // Auto-launch on Android devices if not requested web view explicitly
    tryAutoLaunchApp(currentPostId);

    // Ensure client is authenticated (anonymous sign-in allows any web visitor to read posts)
    auth.onAuthStateChanged(user => {
        if (!user) {
            auth.signInAnonymously()
                .then(() => {
                    loadPostData(currentPostId);
                })
                .catch(err => {
                    console.warn("Anonymous auth notice:", err.message);
                    loadPostData(currentPostId);
                });
        } else {
            loadPostData(currentPostId);
        }
    });
}

function isAndroidDevice() {
    return /Android/i.test(navigator.userAgent);
}

function tryAutoLaunchApp(postId) {
    if (!isAndroidDevice()) return;

    const params = new URLSearchParams(window.location.search);
    if (params.get('web') === '1') return;

    const appIntentUrl = `intent://post?id=${encodeURIComponent(postId)}#Intent;scheme=sketchx;package=glab.sketchx;end;`;
    
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = appIntentUrl;
    document.body.appendChild(iframe);

    setTimeout(() => {
        if (document.body.contains(iframe)) {
            document.body.removeChild(iframe);
        }
    }, 2000);
}

function openInSketchXApp() {
    if (!currentPostId) {
        window.open(PLAYSTORE_URL, '_blank');
        return;
    }

    if (isAndroidDevice()) {
        const appIntentUrl = `intent://post?id=${encodeURIComponent(currentPostId)}#Intent;scheme=sketchx;package=glab.sketchx;end;`;
        
        const fallbackTimer = setTimeout(() => {
            window.location.href = PLAYSTORE_URL;
        }, 1500);

        window.addEventListener('blur', () => {
            clearTimeout(fallbackTimer);
        }, { once: true });

        window.location.href = appIntentUrl;
    } else {
        window.open(PLAYSTORE_URL, '_blank');
    }
}

/* ==========================================================
   LOAD POST DATA
   ========================================================== */
function loadPostData(postId) {
    showLoading(true);

    const timer = setTimeout(() => {
        if (document.getElementById('postLoadingContainer').style.display !== 'none') {
            showError("Connection timed out loading post. Please refresh.");
        }
    }, 8000);

    db.ref('community_posts').child(postId).on('value', async snapshot => {
        clearTimeout(timer);
        if (!snapshot.exists()) {
            showLoading(false);
            showError("The requested community post does not exist, has been deleted by its author, or the link is invalid.", "Post Not Found", "ti-file-off");
            return;
        }

        currentPost = snapshot.val();
        currentPost.id = snapshot.key;

        // 1. Check if post itself is hidden
        if (currentPost.hidden === true || currentPost.hidden === 'true') {
            showLoading(false);
            showError("This community post has been hidden by moderators or is currently undergoing review.", "Post Unavailable", "ti-eye-off");
            return;
        }

        // 2. Check if author's account is restricted, banned, or under deletion
        if (currentPost.authorUid) {
            try {
                const authorSnap = await db.ref('users').child(currentPost.authorUid).child('profile').once('value');
                if (authorSnap.exists()) {
                    const authorProfile = authorSnap.val() || {};
                    if (authorProfile.restricted === true || authorProfile.banned === true) {
                        showLoading(false);
                        showError("This community post is currently unavailable because the author's account is restricted.", "Account Restricted", "ti-lock");
                        return;
                    }
                    if (authorProfile.deletionScheduled === true) {
                        showLoading(false);
                        showError("This community post is currently unavailable because the author's account is scheduled for deletion.", "Account Scheduled for Deletion", "ti-user-x");
                        return;
                    }
                }
            } catch (err) {
                console.warn("Author profile check notice:", err);
            }
        }

        showLoading(false);
        renderPost(currentPost);
        loadAuthorProfile(currentPost.authorUid);
    }, error => {
        clearTimeout(timer);
        showLoading(false);
        showError("Failed to load post: " + error.message, "Connection Error", "ti-wifi-off");
    });
}

function renderPost(post) {
    document.getElementById('postLoadingContainer').style.display = 'none';
    document.getElementById('postErrorContainer').style.display = 'none';
    document.getElementById('postContentContainer').style.display = 'flex';

    document.title = `${post.title || 'Community Post'} - SketchX`;
    document.getElementById('tvPostTitle').textContent = post.title || 'Untitled Post';

    const typePill = document.getElementById('chipPostType');
    const isBlock = (post.type === 'block' || post.type === 'blocks');
    typePill.className = `post-type-pill ${isBlock ? 'block' : 'code'}`;
    typePill.innerHTML = isBlock ? '<i class="ti ti-puzzle"></i> Custom Block' : '<i class="ti ti-code"></i> Code Snippet';

    const verifiedBadge = document.getElementById('chipPostVerified');
    if (post.verified) {
        verifiedBadge.style.display = 'inline-flex';
    } else {
        verifiedBadge.style.display = 'none';
    }

    document.getElementById('tvAuthorName').textContent = post.authorName || 'Community Member';
    document.getElementById('tvAuthorUsername').textContent = post.authorUsername ? `@${post.authorUsername}` : '';
    setAvatar('imgAuthorAvatar', 'tvAuthorAvatarInitial', post.authorPhotoUrl, post.authorName || 'U');

    document.getElementById('tvPostDate').textContent = formatTimeAgo(post.timestamp || post.createdAt);

    const tagsContainer = document.getElementById('tagsContainer');
    tagsContainer.innerHTML = '';
    if (post.category) {
        const tags = post.category.split(',').map(t => t.trim()).filter(Boolean);
        tags.forEach(tag => {
            const span = document.createElement('span');
            span.className = 'tag-chip';
            span.innerHTML = `<i class="ti ti-tag"></i> ${escapeHtml(tag)}`;
            tagsContainer.appendChild(span);
        });
    }

    document.getElementById('tvLikesCount').textContent = post.likesCount || 0;
}

function loadAuthorProfile(uid) {
    if (!uid) return;
    db.ref('users').child(uid).child('profile').once('value', snapshot => {
        if (snapshot.exists()) {
            const profile = snapshot.val();
            if (profile.displayName) {
                document.getElementById('tvAuthorName').textContent = profile.displayName;
            }
            if (profile.username) {
                document.getElementById('tvAuthorUsername').textContent = `@${profile.username}`;
            }
            if (profile.photoUrl) {
                setAvatar('imgAuthorAvatar', 'tvAuthorAvatarInitial', profile.photoUrl, profile.displayName || 'U');
            }
            
            const badgeElement = document.getElementById('authorRoleBadge');
            if (profile.badge && profile.badge !== 'none') {
                badgeElement.className = `role-badge ${profile.badge.toLowerCase()}`;
                badgeElement.textContent = profile.badge.toUpperCase();
                badgeElement.style.display = 'inline-flex';
            } else {
                badgeElement.style.display = 'none';
            }
        }
    });
}

function sharePost() {
    const shareData = {
        title: currentPost ? currentPost.title : 'SketchX Community Post',
        text: currentPost ? `Check out "${currentPost.title}" on SketchX!` : 'Check out this SketchX post!',
        url: window.location.href
    };

    if (navigator.share) {
        navigator.share(shareData).catch(() => {});
    } else {
        navigator.clipboard.writeText(window.location.href).then(() => {
            alert("Post link copied to clipboard!");
        });
    }
}

function setAvatar(imgId, initialId, photoUrl, name) {
    const img = document.getElementById(imgId);
    const initial = document.getElementById(initialId);
    if (photoUrl && photoUrl.trim() !== '') {
        img.src = photoUrl;
        img.style.display = 'block';
        if (initial) initial.style.display = 'none';
    } else {
        img.style.display = 'none';
        if (initial) {
            initial.style.display = 'flex';
            initial.textContent = (name || 'U').charAt(0).toUpperCase();
        }
    }
}

function formatTimeAgo(timestamp) {
    if (!timestamp || isNaN(timestamp)) return 'Recently';
    const now = Date.now();
    const diff = Math.max(0, now - Number(timestamp));
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 30) return `${days}d ago`;
    return new Date(Number(timestamp)).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function escapeHtml(text) {
    if (!text) return '';
    return text.toString()
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function renderMarkdown(md) {
    if (!md) return '';
    let escaped = escapeHtml(md);

    escaped = escaped.replace(/^>\s*(.+)$/gm, '<blockquote>$1</blockquote>');
    escaped = escaped.replace(/^### (.*$)/gim, '<h3>$1</h3>');
    escaped = escaped.replace(/^## (.*$)/gim, '<h2>$1</h2>');
    escaped = escaped.replace(/^# (.*$)/gim, '<h1>$1</h1>');
    escaped = escaped.replace(/`([^`]+)`/g, '<code>$1</code>');
    escaped = escaped.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    escaped = escaped.replace(/\*(.*?)\*/g, '<em>$1</em>');
    escaped = escaped.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
    escaped = escaped.replace(/@([a-zA-Z0-9_]+)/g, '<span style="color: var(--md-sys-color-primary); font-weight:700;">@$1</span>');
    escaped = escaped.replace(/\n/g, '<br>');

    return escaped;
}

function showLoading(show) {
    document.getElementById('postLoadingContainer').style.display = show ? 'block' : 'none';
}

function showError(message, title = "Post Unavailable", icon = "ti-alert-circle") {
    document.getElementById('postLoadingContainer').style.display = 'none';
    document.getElementById('postContentContainer').style.display = 'none';
    const err = document.getElementById('postErrorContainer');
    err.style.display = 'block';

    const msgElem = document.getElementById('tvErrorMessage');
    const titleElem = document.getElementById('tvErrorTitle');
    const iconElem = document.getElementById('errorIcon');

    if (msgElem) msgElem.textContent = message;
    if (titleElem) titleElem.textContent = title;
    if (iconElem) iconElem.className = `ti ${icon}`;
}

/* ==========================================================
   ADMIN POST MODERATION CONTROLS
   ========================================================== */
let isAdminUser = false;

auth.onAuthStateChanged(user => {
    if (user) {
        db.ref('users').child(user.uid).child('profile').once('value', snap => {
            if (snap.exists()) {
                const profile = snap.val() || {};
                const badge = (profile.badge || '').toLowerCase();
                if (badge === 'admin' || badge === 'maintainer') {
                    isAdminUser = true;
                    setupAdminBar();
                }
            }
        });
    }
});

function setupAdminBar() {
    const bar = document.getElementById('adminModerationBar');
    if (!bar || !currentPost) return;

    const isHidden = !!currentPost.hidden;
    const isVerified = !!currentPost.verified;

    bar.style.display = 'block';

    const btnVerify = document.getElementById('btnAdminVerify');
    const lblVerify = document.getElementById('lblAdminVerify');
    if (btnVerify && lblVerify) {
        if (isVerified) {
            btnVerify.className = 'admin-control-btn active-verified';
            lblVerify.textContent = 'Verified ✓';
        } else {
            btnVerify.className = 'admin-control-btn';
            lblVerify.textContent = 'Verify Post';
        }
    }

    const btnHide = document.getElementById('btnAdminHide');
    const lblHide = document.getElementById('lblAdminHide');
    if (btnHide && lblHide) {
        if (isHidden) {
            btnHide.className = 'admin-control-btn active-hidden';
            lblHide.textContent = 'Hidden (Unhide)';
        } else {
            btnHide.className = 'admin-control-btn';
            lblHide.textContent = 'Hide Post';
        }
    }
}

async function adminToggleVerify() {
    if (!currentPost || !currentPost.id) return;
    const newVerified = !currentPost.verified;
    try {
        await db.ref(`community_posts/${currentPost.id}/verified`).set(newVerified);
        currentPost.verified = newVerified;
        setupAdminBar();
        const badge = document.getElementById('chipPostVerified');
        if (badge) badge.style.display = newVerified ? 'inline-flex' : 'none';
        alert(newVerified ? "Post verified!" : "Post unverified.");
    } catch (e) {
        alert("Failed to update verify status: " + e.message);
    }
}

async function adminToggleHide() {
    if (!currentPost || !currentPost.id) return;
    const newHidden = !currentPost.hidden;
    try {
        await db.ref(`community_posts/${currentPost.id}/hidden`).set(newHidden);
        currentPost.hidden = newHidden;
        setupAdminBar();
        alert(newHidden ? "Post hidden from public view." : "Post unhidden and visible to public.");
    } catch (e) {
        alert("Failed to update hide status: " + e.message);
    }
}

async function adminDeletePost() {
    if (!currentPost || !currentPost.id) return;
    if (!confirm(`Are you sure you want to permanently delete post "${currentPost.title}"?`)) return;

    try {
        const postId = currentPost.id;
        const authorUid = currentPost.authorUid;

        await db.ref(`community_posts/${postId}`).remove();
        await db.ref(`community_comments/${postId}`).remove();
        await db.ref(`community_likes/${postId}`).remove();

        if (authorUid) {
            await db.ref(`users/${authorUid}/uploads/${postId}`).remove();
        }

        alert("Post deleted successfully.");
        window.location.href = "admin-portal.html";
    } catch (e) {
        alert("Failed to delete post: " + e.message);
    }
}