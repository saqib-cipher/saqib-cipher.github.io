/**
 * SketchX - Pro Member Web Post Viewer Controller
 * Enforces authentication and verified Pro subscription before unlocking code payloads.
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

let currentPostId = null;
let currentPost = null;
let currentUser = null;
let currentUserProfile = null;
let currentViewMode = 'visual'; // 'visual' or 'code'

document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initProViewer();
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
   PRO VIEWER INITIALIZATION & AUTH PIPELINE
   ========================================================== */
function getPostIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    let id = params.get('id') || params.get('postId') || params.get('post');
    if (!id) {
        const pathSegments = window.location.pathname.split('/').filter(Boolean);
        if (pathSegments.length > 0) {
            const last = pathSegments[pathSegments.length - 1];
            if (last && !last.includes('pro-post.html') && !last.includes('pro-post')) {
                id = last;
            }
        }
    }
    return id;
}

function initProViewer() {
    currentPostId = getPostIdFromUrl();
    if (!currentPostId) {
        showError("No Post ID specified in URL. Please check your link.", "Invalid Post Link", "ti-link-off");
        return;
    }

    // Monitor Firebase Auth State
    auth.onAuthStateChanged(async user => {
        currentUser = user;
        if (!user || user.isAnonymous) {
            hideAllViews();
            updateUserStrip(null);
            document.getElementById('proAuthGateContainer').style.display = 'block';
        } else {
            updateUserStrip(user);
            await verifyProEntitlement(user);
        }
    });
}

function updateUserStrip(user) {
    const strip = document.getElementById('userAccountStrip');
    if (!user) {
        if (strip) strip.style.display = 'none';
        return;
    }

    if (strip) strip.style.display = 'flex';
    const nameElem = document.getElementById('userAccountName');
    const avatarElem = document.getElementById('userAvatarContainer');

    const name = user.displayName || user.email || 'User';
    if (nameElem) nameElem.textContent = name;
    if (avatarElem) {
        if (user.photoURL) {
            avatarElem.innerHTML = `<img src="${user.photoURL}" alt="avatar" style="width:100%;height:100%;border-radius:9999px;object-fit:cover;">`;
        } else {
            avatarElem.textContent = name.charAt(0).toUpperCase();
        }
    }
}

async function verifyProEntitlement(user) {
    setLoadingState("Verifying Pro subscription...");

    try {
        // Fetch User Profile from RTDB
        const profileSnap = await db.ref('users').child(user.uid).child('profile').once('value');
        currentUserProfile = profileSnap.exists() ? profileSnap.val() : {};

        const badge = (currentUserProfile.badge || '').toLowerCase();
        const isBadgePro = (badge === 'pro' || badge === 'admin' || badge === 'maintainer' || badge === 'developer' || badge === 'special' || badge === 'contributor' || badge === 'tester' || badge === 'vip');
        const isProfilePro = currentUserProfile.isPro === true || currentUserProfile.isPro === 'true';

        // Also check entitlement node if present
        let isEntitlementPro = false;
        try {
            const entSnap = await db.ref('users').child(user.uid).child('entitlement').once('value');
            if (entSnap.exists()) {
                const ent = entSnap.val() || {};
                isEntitlementPro = ent.isPro === true || ent.status === 'ACTIVE';
            }
        } catch (ignored) {}

        const isPro = isBadgePro || isProfilePro || isEntitlementPro;

        if (isPro) {
            let roleTitle = 'PRO';
            if (currentUserProfile.badge && currentUserProfile.badge.toLowerCase() !== 'none') {
                roleTitle = currentUserProfile.badge.toUpperCase();
            } else if (isProfilePro || isEntitlementPro) {
                roleTitle = 'PRO';
            }
            updateRoleBadges(roleTitle, badge);
            loadFullPost(currentPostId);
        } else {
            // Not a Pro member: Render Access Denied Gate
            hideAllViews();
            const deniedMsg = document.getElementById('tvDeniedMessage');
            if (deniedMsg) {
                const username = currentUserProfile.username ? `@${currentUserProfile.username}` : (user.displayName || user.email);
                deniedMsg.innerHTML = `Your account (<strong>${escapeHtml(username)}</strong>) is currently on the Free tier. Full web access to custom block definitions and source code is an exclusive feature for SketchX Pro subscribers, contributors, and team members.`;
            }
            document.getElementById('proDeniedGateContainer').style.display = 'block';
        }
    } catch (err) {
        console.error("Pro verification error:", err);
        showError("Failed to verify user entitlement: " + err.message, "Verification Error", "ti-shield-x");
    }
}

function updateRoleBadges(roleTitle, badgeClass) {
    const navBadge = document.getElementById('navRoleBadge');
    if (navBadge) {
        navBadge.textContent = roleTitle;
        navBadge.className = `nav-pro-badge ${badgeClass || 'pro'}`;
    }
    const unlockedLabel = document.getElementById('unlockedRoleLabel');
    if (unlockedLabel) {
        unlockedLabel.textContent = `${roleTitle} ACCESS UNLOCKED`;
    }
}

/* ==========================================================
   LOAD UNLOCKED POST DATA
   ========================================================== */
function loadFullPost(postId) {
    setLoadingState("Loading unlocked post content...");

    db.ref('community_posts').child(postId).on('value', async snapshot => {
        if (!snapshot.exists()) {
            showError("The requested community post does not exist or has been removed by its author.", "Post Not Found", "ti-file-off");
            return;
        }

        currentPost = snapshot.val();
        currentPost.id = snapshot.key;

        // Check if author's account is restricted/banned
        if (currentPost.authorUid) {
            try {
                const authorSnap = await db.ref('users').child(currentPost.authorUid).child('profile').once('value');
                if (authorSnap.exists()) {
                    const authorProfile = authorSnap.val() || {};
                    if (authorProfile.restricted === true || authorProfile.banned === true) {
                        showError("This community post is currently unavailable because the author's account is restricted.", "Account Restricted", "ti-lock");
                        return;
                    }
                    if (authorProfile.deletionScheduled === true) {
                        showError("This community post is currently unavailable because the author's account is scheduled for deletion.", "Account Scheduled for Deletion", "ti-user-x");
                        return;
                    }
                }
            } catch (err) {
                console.warn("Author profile notice:", err);
            }
        }

        renderUnlockedPost(currentPost);
        loadAuthorProfile(currentPost.authorUid);
    }, err => {
        showError("Failed to load post data: " + err.message, "Connection Error", "ti-wifi-off");
    });
}

function renderUnlockedPost(post) {
    hideAllViews();
    document.getElementById('proContentContainer').style.display = 'flex';

    document.title = `${post.title || 'Community Post'} - SketchX`;
    document.getElementById('tvPostTitle').textContent = post.title || 'Untitled Post';

    const isBlock = (post.type === 'block' || post.type === 'blocks');
    const typePill = document.getElementById('chipPostType');
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

    // Render Source Code / Block JSON
    const codeBody = document.getElementById('tvCodeBody');
    const codeTitle = document.getElementById('lblCodeTitle');
    const codeIcon = document.getElementById('codeHeaderIcon');
    const btnDownload = document.getElementById('btnDownloadJson');
    const blockModeToggle = document.getElementById('blockModeToggle');

    if (isBlock) {
        codeTitle.textContent = "Block Definition JSON (block.json)";
        codeIcon.className = "ti ti-puzzle";
        btnDownload.style.display = "inline-flex";

        let rawCode = post.blocksJson || post.code || '';
        let parsedBlocks = null;
        try {
            parsedBlocks = JSON.parse(rawCode);
            codeBody.textContent = JSON.stringify(parsedBlocks, null, 2);
        } catch (e) {
            codeBody.textContent = rawCode;
        }

        if (parsedBlocks) {
            const count = Array.isArray(parsedBlocks) ? parsedBlocks.length : 1;
            const countBadge = document.getElementById('tvBlockCountBadge');
            if (countBadge) countBadge.textContent = count;
            renderVisualBlocks(parsedBlocks);
            blockModeToggle.style.display = 'inline-flex';
            switchViewMode('visual');
        } else {
            blockModeToggle.style.display = 'none';
            switchViewMode('code');
        }
    } else {
        codeTitle.textContent = "Source Code";
        codeIcon.className = "ti ti-code";
        btnDownload.style.display = "none";
        blockModeToggle.style.display = "none";
        codeBody.textContent = post.code || '// No source code provided in post.';
        switchViewMode('code');
    }

    // Render Tags with Hash #
    const tagsContainer = document.getElementById('tagsContainer');
    tagsContainer.innerHTML = '';
    if (post.category) {
        const tags = post.category.split(',').map(t => t.trim()).filter(Boolean);
        tags.forEach(tag => {
            const span = document.createElement('span');
            span.className = 'tag-chip';
            span.textContent = `#${tag}`;
            tagsContainer.appendChild(span);
        });
    }

    document.getElementById('tvLikesCount').textContent = post.likesCount || 0;
    const commentsElem = document.getElementById('tvCommentsCount');
    if (commentsElem) {
        commentsElem.textContent = post.commentsCount || 0;
        if (post.id) {
            db.ref('community_comments').child(post.id).on('value', cSnap => {
                commentsElem.textContent = cSnap.exists() ? cSnap.numChildren() : (post.commentsCount || 0);
            });
        }
    }
}

/* ==========================================================
   VIEW MODE SWITCHER (VISUAL BLOCKS vs RAW JSON/CODE)
   ========================================================== */
function switchViewMode(mode) {
    currentViewMode = mode;
    const btnVisual = document.getElementById('btnModeVisual');
    const btnCode = document.getElementById('btnModeCode');
    const containerVisual = document.getElementById('containerVisualBlocks');
    const containerCode = document.getElementById('containerCodeCard');

    if (mode === 'visual') {
        if (btnVisual) btnVisual.classList.add('active');
        if (btnCode) btnCode.classList.remove('active');
        if (containerVisual) containerVisual.style.display = 'block';
        if (containerCode) containerCode.style.display = 'none';
    } else {
        if (btnVisual) btnVisual.classList.remove('active');
        if (btnCode) btnCode.classList.add('active');
        if (containerVisual) containerVisual.style.display = 'none';
        if (containerCode) containerCode.style.display = 'block';
    }
}

function renderVisualBlocks(blocksData) {
    const list = document.getElementById('visualBlocksList');
    list.innerHTML = '';

    const blocksArray = Array.isArray(blocksData) ? blocksData : [blocksData];
    if (blocksArray.length === 0) {
        document.getElementById('containerVisualBlocks').style.display = 'none';
        return;
    }

    blocksArray.forEach((b, idx) => {
        const item = document.createElement('div');
        item.className = 'visual-block-item';

        const color = b.color || '#E91E63';
        const name = b.name || `Custom Block #${idx + 1}`;
        const spec = b.spec || '';
        const type = b.type || ' ';
        const code = (b.code || '').trim();

        item.innerHTML = `
            <div class="visual-block-header">
                <div class="visual-block-color-tag" style="background-color: ${escapeHtml(color)};"></div>
                <div class="visual-block-name">${escapeHtml(name)}</div>
                <span class="visual-block-type-chip">Type: ${escapeHtml(type)}</span>
            </div>
            ${spec ? `
                <div class="visual-block-spec-box">
                    <div class="visual-block-spec-code">${escapeHtml(spec)}</div>
                </div>` : ''}
            ${code ? `
                <div class="visual-block-code-preview" title="${escapeHtml(code)}">
                    <code>${escapeHtml(code)}</code>
                </div>` : ''}
        `;
        list.appendChild(item);
    });
}

/* ==========================================================
   AUTH ACTIONS
   ========================================================== */
function handleGoogleSignIn() {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider).catch(err => {
        alert("Google Sign-In failed: " + err.message);
    });
}

function handleSignOut() {
    auth.signOut().then(() => {
        window.location.reload();
    });
}

/* ==========================================================
   ACTIONS: COPY & DOWNLOAD
   ========================================================== */
function copySourceCode() {
    const code = document.getElementById('tvCodeBody').textContent;
    if (code) {
        navigator.clipboard.writeText(code).then(() => {
            alert("Code copied to clipboard!");
        });
    }
}

function downloadBlockJson() {
    const code = document.getElementById('tvCodeBody').textContent;
    if (!code) return;

    // Use post title as file name with spaces replaced with underscores
    let baseName = (currentPost && currentPost.title) ? currentPost.title.trim() : 'sketchx_block';
    let safeName = baseName.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_\-]/g, '');
    if (!safeName) safeName = 'sketchx_block';
    const fileName = `${safeName}.json`;

    const blob = new Blob([code], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function sharePost() {
    if (navigator.share) {
        navigator.share({
            title: currentPost ? currentPost.title : 'SketchX Pro Post',
            url: window.location.href
        }).catch(() => {});
    } else {
        navigator.clipboard.writeText(window.location.href).then(() => {
            alert("Pro post link copied to clipboard!");
        });
    }
}

/* ==========================================================
   HELPERS & AUTHOR PROFILE
   ========================================================== */
function loadAuthorProfile(uid) {
    if (!uid) return;
    db.ref('users').child(uid).child('profile').once('value', snapshot => {
        if (snapshot.exists()) {
            const profile = snapshot.val();
            if (profile.displayName) document.getElementById('tvAuthorName').textContent = profile.displayName;
            if (profile.username) document.getElementById('tvAuthorUsername').textContent = `@${profile.username}`;
            if (profile.photoUrl) setAvatar('imgAuthorAvatar', 'tvAuthorAvatarInitial', profile.photoUrl, profile.displayName || 'U');

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

function hideAllViews() {
    document.getElementById('proLoadingContainer').style.display = 'none';
    document.getElementById('proErrorContainer').style.display = 'none';
    document.getElementById('proAuthGateContainer').style.display = 'none';
    document.getElementById('proDeniedGateContainer').style.display = 'none';
    document.getElementById('proContentContainer').style.display = 'none';
}

function setLoadingState(label) {
    hideAllViews();
    const loadingElem = document.getElementById('proLoadingContainer');
    const labelElem = document.getElementById('loadingText');
    if (labelElem) labelElem.textContent = label;
    if (loadingElem) loadingElem.style.display = 'flex';
}

function showError(message, title = "Post Unavailable", icon = "ti-alert-circle") {
    hideAllViews();
    const err = document.getElementById('proErrorContainer');
    err.style.display = 'flex';

    const msgElem = document.getElementById('tvErrorMessage');
    const titleElem = document.getElementById('tvErrorTitle');
    const iconElem = document.getElementById('errorIcon');

    if (msgElem) msgElem.textContent = message;
    if (titleElem) titleElem.textContent = title;
    if (iconElem) iconElem.className = `ti ${icon}`;
}

function formatTimeAgo(timestamp) {
    if (!timestamp) return 'Recently';
    const now = Date.now();
    const diff = Math.max(0, now - timestamp);
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 30) {
        return new Date(timestamp).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    }
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
}

function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/[&<>'"]/g, tag => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        "'": '&#39;',
        '"': '&quot;'
    }[tag] || tag));
}
