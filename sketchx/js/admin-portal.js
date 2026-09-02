/**
 * SketchX Master Admin Control Suite Controller
 */

/* ==========================================================
   1. PRODUCTION FIREBASE & SERVICE ACCOUNT CONFIGURATION
   ========================================================== */
const firebaseConfig = {
    apiKey: "AIzaSyBiyDhOw6prURPXzUqONbW4JhCwEZqkXBE",
    authDomain: "sketchx-88b8e.firebaseapp.com",
    databaseURL: "https://sketchx-88b8e-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "sketchx-88b8e",
    storageBucket: "sketchx-88b8e.firebasestorage.app",
    messagingSenderId: "305217175374",
    appId: "1:305217175374:android:85193f44ed3b39ea78a81f"
};

// FCM HTTP v1 Service Account Configuration
const SERVICE_ACCOUNT = {
    project_id: "sketchx-88b8e",
    client_email: "firebase-adminsdk-fbsvc@sketchx-88b8e.iam.gserviceaccount.com",
    private_key: "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCqJja7tWgEisCs\nWz+mmZvO271m8c3CdqhvkxJLKcXNMqLIahzsqJa1y7gixh+VVkT76ygUO4VzTvrq\ndmNc+hkaJeHcKuCo8MqfqD99rCKymK84u+DVtjGyT2b5yklXZUatFT9xtXmQiWKG\n5bFViHn5I8XJmr02UAbwjK++yVhP/O2BfGC4tEhkesvyki+2pxS0vDTeNwsTBUBm\nkk2ZZj2VmxX9aPOZDZ96+V4YvJ54etpUSLLG9K6tuln508Z9IQP6dmSGOQ34Pede\n9tpk0oirog5npcC/eZeRLRah6FDjY6vgCBSvlFZwIHDZxMWWQA6/SgjI/DqzbZoI\nioHLUXlDAgMBAAECggEAKNxdd42Uicayh5GwQvePqckufnriQWmSgJzunztMY79d\nxUhqYtEHxGfEdCFlM01Q6rip2tYCcdMNQeIlcY4kGhnv2Bo58ohE+LuEZ88/U+mD\n5tmDoH8NBze3UJRqMYFCTE2We12r8HB1x1SA1jwcop6bIJO3DcSBLiJzEBu1SBve\nwpwoOJWh6bOQ4r6WZRYi4cTHXVDAysU2lU6LI68T4rgsZ56Cc1WRNuLMhF1zPvww\nto4BNoaYg9DT3MPJL78Wg8EeMvlRPEhZhXpJqHk7AolUsCMLfitmSNLkZm2IVQfT\nFbIRrnQt0f1cdgqT7du7zw7HXOSy5yJ6udTuEoivCQKBgQDUAD6nc9iD7c9CUgco\nz35B108MlIxnQPjEPLavyOeg4O3TleIgt13KcvM68u75X75A/gHvEL80OnH9vNGh\n5TCo+OKmMLcsVNRmSCfhIX18tZvMy6lXBQIoMfelOqkFgU4AksnhqU+PzBw7rEJv\nY6Vw5yLIvxdG7yUk5D94Yh/5KwKBgQDNdlxQewBwVtzQRdQyVHcnAnxKYzfh9KVp\nJf4gFXl4kxIStUuImyyS+fyAWSnKA1T3TxdtMXdpSH1iUfsTg4uRbRWFc2uDMGcw\nhvTayOJ+qdZ611o/oP74kAL1Un49MsPG4VELmIA5IAY3pMUJCJYucWaKtlwvJd0f\nHWK+7AxESQKBgELnGN6rdmacA85AKLY+VO/eTLoBnxVusZLsPhLXahGhKiydnlEI\nzPZ4tD2kMLpN9rJ39pBFTrHix9p1XgqjU2nfsVcVBJle4/CrULqBYSKcBWDp3LTz\nhay9qBNiobh1B/KyYDdwwQT2Ouqx//07CxjIOHf1phjim2w7A7Sv8rslAoGBAKwL\ntpV1yhJHyjNkpaFXdUbnH+iyWHMPBwubUsbO9J5wmKutwAgt2A9i4XsgLowIajeE\ntRssVs+EcenIuDPI7S/jZigPVDHQcDgEajhiCrcBxKWsetfZGmhNPwzp/OeGAMYi\nmljZZFVxaYNip9M+q3NMZg81UM/yJs0NMEirJEJxAoGASikF0qwvx0m5EjC5YM4M\nCD9DCNliQdisiLxamwYFR/hfSKE8QMRqrq0elcS/GsejVOfv+SwX4GL5h4Ck5Vcc\nvUHcKNDCr0G2p3tUYRSGDIHt8lI5xCQcM+LC50iSHD4AwVuxp55+aOeI1FKDPoo7\nmLlJnEh1Nm6lANRsUUDaSvM=\n-----END PRIVATE KEY-----\n"
};

// Initialize Firebase App
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const auth = firebase.auth();
const db = firebase.database();

// State
let currentUser = null;
let currentAdminProfile = null;
let activeTab = 'tabNotifications';

let allUsers = [];
let allTickets = [];
let allAccessKeys = {};
let masterAccessKey = "";
let allPosts = [];
let allScheduledDeletions = {};

let sentLogs = [];
let userFilter = 'all';
let userSearchQuery = '';
let ticketFilter = 'all';
let ticketSearchQuery = '';
let postFilter = 'all';
let postSearchQuery = '';

let targetMode = 'topic'; // 'topic' or 'token'
let cachedOAuthToken = null;
let oauthTokenExpiry = 0;

let loadingTimeoutHandle = null;

document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initAuthListener();
});

/* ==========================================================
   2. THEME TOGGLER
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
   3. AUTHENTICATION & ACCESS VERIFICATION (WITH TIMEOUT SAFETY)
   ========================================================== */
function initAuthListener() {
    auth.onAuthStateChanged(user => {
        currentUser = user;
        if (!user) {
            showGlobalLoading(false);
            showView('viewAuth');
            updateNavUser(null);
        } else {
            verifyAdminAccess(user);
        }
    });
}

async function verifyAdminAccess(user) {
    showGlobalLoading(true, "Verifying Admin Authorization...");

    try {
        const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error("Database connection timed out.")), 6000)
        );
        const dataPromise = db.ref(`users/${user.uid}/profile`).once('value');
        const snapshot = await Promise.race([dataPromise, timeoutPromise]);

        const profile = (snapshot && snapshot.exists()) ? snapshot.val() : {};
        currentAdminProfile = profile;
        currentAdminProfile.uid = user.uid;

        const badge = (profile.badge || '').trim().toLowerCase();
        const isAuthorized = badge === 'admin' || badge === 'maintainer';

        showGlobalLoading(false);
        if (isAuthorized) {
            updateNavUser(profile);
            showView('viewDashboard');
            initDatabaseListeners();
        } else {
            showAccessDenied(user.email || user.uid, badge || 'none');
        }
    } catch (err) {
        console.error("Authorization check failed:", err);
        showGlobalLoading(false);
        showToast("Auth check error: " + err.message, "error");
        showAccessDenied(user.email || user.uid, 'none');
    }
}

function updateNavUser(profile) {
    const chip = document.getElementById('userNavChip');
    if (!profile) {
        chip.style.display = 'none';
        return;
    }

    chip.style.display = 'flex';
    document.getElementById('userNavName').textContent = profile.displayName || profile.username || 'Admin';
    document.getElementById('userNavAvatar').textContent = ((profile.displayName || profile.username || 'A').charAt(0)).toUpperCase();
    
    const roleBadge = document.getElementById('userNavRoleBadge');
    roleBadge.textContent = (profile.badge || 'ADMIN').toUpperCase();
    roleBadge.className = `role-badge ${profile.badge || 'admin'}`;
}

async function handleGoogleSignIn() {
    const provider = new firebase.auth.GoogleAuthProvider();
    provider.addScope('email');
    provider.addScope('profile');
    try {
        showGlobalLoading(true, "Signing in with Google...");
        await auth.signInWithPopup(provider);
    } catch (err) {
        showGlobalLoading(false);
        showToast("Google Sign-In failed: " + err.message, "error");
    }
}

async function handleEmailSignIn(e) {
    if (e) e.preventDefault();
    const email = document.getElementById('loginEmail').value.trim();
    const pass = document.getElementById('loginPassword').value;

    if (!email || !pass) {
        showToast("Please enter email and password.", "error");
        return;
    }

    showGlobalLoading(true, "Signing in to Admin Console...");
    try {
        const cred = await auth.signInWithEmailAndPassword(email, pass);
        if (cred && cred.user) {
            await verifyAdminAccess(cred.user);
        }
    } catch (err) {
        console.error("Email sign-in failed:", err);
        showGlobalLoading(false);
        showToast(err.message || "Failed to sign in.", "error");
    }
}

async function handleSignOut() {
    try {
        showGlobalLoading(true, "Signing out...");
        await auth.signOut();
        showGlobalLoading(false);
        showToast("Signed out successfully.");
    } catch (err) {
        showGlobalLoading(false);
        showToast("Sign out error: " + err.message, "error");
    }
}

function showAccessDenied(email, badge) {
    document.getElementById('deniedUserEmail').textContent = email;
    const badgeEl = document.getElementById('deniedUserBadge');
    badgeEl.textContent = (badge || 'USER').toUpperCase();
    badgeEl.className = `role-badge ${badge}`;
    showView('viewAccessDenied');
}

function showView(viewId) {
    ['viewAuth', 'viewAccessDenied', 'viewDashboard'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.style.display = (id === viewId) ? (id === 'viewDashboard' ? 'flex' : 'block') : 'none';
        }
    });
}

function switchTab(tabId) {
    activeTab = tabId;
    document.querySelectorAll('.tab-nav-btn').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-tab') === tabId);
    });

    document.querySelectorAll('.dashboard-tab-content').forEach(section => {
        section.style.display = (section.id === tabId) ? 'block' : 'none';
    });

    // Automatically render the active tab content when user switches tabs
    if (tabId === 'tabUsers') {
        renderUsersTable();
    } else if (tabId === 'tabTickets') {
        renderTicketsTable();
    } else if (tabId === 'tabAccessKeys') {
        renderAccessKeysTable();
    } else if (tabId === 'tabPosts') {
        renderPostsTable();
    } else if (tabId === 'tabDeletions') {
        renderScheduledDeletionsTable();
    }
}

/* ==========================================================
   4. DATABASE REALTIME LISTENERS
   ========================================================== */
function initDatabaseListeners() {
    // 1. Users Directory
    db.ref('users').on('value', snap => {
        allUsers = [];
        let tokensCount = 0;
        let staffCount = 0;

        if (snap.exists()) {
            snap.forEach(child => {
                const u = child.val() || {};
                const profile = u.profile || {};
                const uid = child.key;
                const token = u.fcmToken || profile.fcmToken || null;
                const badge = (profile.badge || 'none').toLowerCase();

                if (token) tokensCount++;
                if (badge === 'admin' || badge === 'maintainer') staffCount++;

                allUsers.push({
                    uid,
                    profile,
                    fcmToken: token,
                    notifications: u.notifications || {},
                    likes: u.likes || {},
                    uploads: u.uploads || {}
                });
            });

            // Sort: users with tokens first, then newest registered
            allUsers.sort((a, b) => {
                if (a.fcmToken && !b.fcmToken) return -1;
                if (!a.fcmToken && b.fcmToken) return 1;
                return (b.profile?.createdAt || 0) - (a.profile?.createdAt || 0);
            });
        }

        const totalEl = document.getElementById('statTotalUsers');
        if (totalEl) totalEl.textContent = allUsers.length;
        const tokensEl = document.getElementById('statActiveTokens');
        if (tokensEl) tokensEl.textContent = tokensCount;
        const adminEl = document.getElementById('statAdminCount');
        if (adminEl) adminEl.textContent = staffCount;
        const coverage = allUsers.length > 0 ? Math.round((tokensCount / allUsers.length) * 100) : 0;
        const percentEl = document.getElementById('statTokenPercent');
        if (percentEl) percentEl.textContent = `${coverage}% device coverage`;

        renderUsersTable();
    }, err => {
        console.warn("Users sync notice:", err.message);
    });

    // 2. Help Tickets (Check help_tickets, help_ticket, tickets, support_tickets)
    const ticketSources = ['help_tickets', 'help_ticket', 'tickets', 'support_tickets'];
    const ticketsBySource = {};

    ticketSources.forEach(source => {
        db.ref(source).on('value', snap => {
            ticketsBySource[source] = [];
            if (snap.exists()) {
                snap.forEach(child => {
                    const val = child.val();
                    if (val && typeof val === 'object') {
                        const t = { ...val };
                        t.ticketId = child.key;
                        t._sourcePath = source;
                        ticketsBySource[source].push(t);
                    }
                });
            }

            allTickets = [];
            let openCount = 0;
            ticketSources.forEach(s => {
                (ticketsBySource[s] || []).forEach(item => {
                    allTickets.push(item);
                    const status = (item.status || 'open').toLowerCase();
                    if (status === 'open') openCount++;
                });
            });

            allTickets.sort((a, b) => {
                const timeA = Number(a.createdAt || a.timestamp || a.date || a.time || 0);
                const timeB = Number(b.createdAt || b.timestamp || b.date || b.time || 0);
                return timeB - timeA;
            });

            const countEl = document.getElementById('statOpenTickets');
            if (countEl) countEl.textContent = openCount;

            renderTicketsTable();
        }, err => {
            console.warn(`Help tickets (${source}) sync notice:`, err.message);
        });
    });

    // 3. Access Keys
    db.ref('access_keys').on('value', snap => {
        allAccessKeys = snap.exists() ? snap.val() : {};
        renderAccessKeysTable();
    }, err => {
        console.warn("Access keys sync notice:", err.message);
    });
    db.ref('access_key').on('value', snap => {
        masterAccessKey = snap.exists() ? String(snap.val()) : "";
        document.getElementById('inputMasterKey').value = masterAccessKey;
    }, err => {
        console.warn("Master key sync notice:", err.message);
    });

    // 4. Community Posts
    db.ref('community_posts').on('value', snap => {
        allPosts = [];
        let verifiedCount = 0;
        let hiddenCount = 0;

        if (snap.exists()) {
            snap.forEach(child => {
                const p = child.val() || {};
                p.id = child.key;
                allPosts.push(p);
                if (p.verified) verifiedCount++;
                if (p.hidden) hiddenCount++;
            });
        }

        allPosts.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        document.getElementById('statTotalPosts').textContent = allPosts.length;
        document.getElementById('statVerifiedPosts').textContent = verifiedCount;
        document.getElementById('statHiddenPosts').textContent = hiddenCount;
        renderPostsTable();
    }, err => {
        console.warn("Posts sync notice:", err.message);
    });

    // 5. Scheduled Deletions
    db.ref('scheduled_deletions').on('value', snap => {
        allScheduledDeletions = snap.exists() ? snap.val() : {};
        document.getElementById('statDeletionsCount').textContent = Object.keys(allScheduledDeletions).length;
        renderScheduledDeletionsTable();
    }, err => {
        console.warn("Scheduled deletions sync notice:", err.message);
    });
}

/* ==========================================================
   5. TAB 1: FCM & PUSH NOTIFICATIONS (WITH FCM HTTP V1 OAUTH2)
   ========================================================== */
function setTargetMode(mode) {
    targetMode = mode;
    document.querySelectorAll('.segment-btn').forEach(b => {
        b.classList.toggle('active', b.getAttribute('data-mode') === mode);
    });

    document.getElementById('groupTargetTopic').style.display = (mode === 'topic') ? 'block' : 'none';
    document.getElementById('groupTargetToken').style.display = (mode === 'token') ? 'block' : 'none';
    updatePreview();
}

function selectTopicPreset(topic) {
    document.getElementById('inputTopicName').value = topic;
    document.querySelectorAll('.topic-chip').forEach(c => {
        c.classList.toggle('selected', c.getAttribute('data-topic') === topic);
    });
    updatePreview();
}

function updatePreview() {
    const title = document.getElementById('notifTitle').value || 'SketchX Notification';
    const body = document.getElementById('notifBody').value || 'Notification content preview will appear here...';
    const type = document.getElementById('notifType').value;
    const imgUrl = document.getElementById('notifImageUrl').value;
    const topic = document.getElementById('inputTopicName').value;
    const token = document.getElementById('inputRecipientToken').value;

    document.getElementById('previewTitle').textContent = title;
    document.getElementById('previewBody').textContent = body;
    document.getElementById('previewTypeBadge').textContent = `Type: ${type}`;
    document.getElementById('titleCharCount').textContent = `${title.length}/80`;
    document.getElementById('bodyCharCount').textContent = `${body.length}/300`;

    const imgEl = document.getElementById('previewImage');
    if (imgUrl && imgUrl.trim() !== '') {
        imgEl.src = imgUrl;
        imgEl.style.display = 'block';
    } else {
        imgEl.style.display = 'none';
    }

    const targetBadge = document.getElementById('previewTargetBadge');
    if (targetMode === 'topic') {
        targetBadge.textContent = `Target: /topics/${topic || 'all'}`;
    } else {
        targetBadge.textContent = token ? `Target: Direct Token (${token.substring(0, 10)}...)` : 'Target: No device selected';
    }
}

async function getOAuth2AccessToken() {
    const nowSec = Math.floor(Date.now() / 1000);
    if (cachedOAuthToken && oauthTokenExpiry > nowSec + 60) {
        return cachedOAuthToken;
    }

    if (typeof KJUR === 'undefined') {
        throw new Error("Crypto library (jsrsasign) not loaded. Please refresh.");
    }

    const header = JSON.stringify({ alg: "RS256", typ: "JWT" });
    const claimSet = JSON.stringify({
        iss: SERVICE_ACCOUNT.client_email,
        scope: "https://www.googleapis.com/auth/firebase.messaging",
        aud: "https://oauth2.googleapis.com/token",
        exp: nowSec + 3600,
        iat: nowSec
    });

    const jwt = KJUR.jws.JWS.sign(null, header, claimSet, SERVICE_ACCOUNT.private_key);

    const res = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
            grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
            assertion: jwt
        })
    });

    const data = await res.json();
    if (!res.ok || !data.access_token) {
        throw new Error(data.error_description || data.error || "Failed to generate Google OAuth2 token");
    }

    cachedOAuthToken = data.access_token;
    oauthTokenExpiry = nowSec + (data.expires_in || 3600);
    return cachedOAuthToken;
}

async function fetchAdminNodeRest(nodePath) {
    try {
        const accessToken = await getOAuth2AccessToken();
        const url = `https://sketchx-88b8e-default-rtdb.asia-southeast1.firebasedatabase.app/${nodePath}.json?access_token=${encodeURIComponent(accessToken)}`;
        const res = await fetch(url);
        if (res.ok) {
            return await res.json();
        }
    } catch (err) {
        console.warn(`REST fetch notice for ${nodePath}:`, err.message);
    }
    return null;
}

async function syncHelpTickets() {
    try {
        let data = await fetchAdminNodeRest('help_tickets');
        if (!data) {
            const snap = await db.ref('help_tickets').once('value').catch(() => null);
            data = snap && snap.exists() ? snap.val() : {};
        }

        allTickets = [];
        let openCount = 0;
        if (data && typeof data === 'object') {
            Object.keys(data).forEach(key => {
                const t = data[key] || {};
                t.ticketId = key;
                t._sourcePath = 'help_tickets';
                allTickets.push(t);
                const status = (t.status || 'open').toLowerCase();
                if (status === 'open') openCount++;
            });
        }

        allTickets.sort((a, b) => {
            const timeA = Number(a.createdAt || a.timestamp || a.date || a.time || 0);
            const timeB = Number(b.createdAt || b.timestamp || b.date || b.time || 0);
            return timeB - timeA;
        });

        const countEl = document.getElementById('statOpenTickets');
        if (countEl) countEl.textContent = openCount;

        renderTicketsTable();
    } catch (err) {
        console.error("syncHelpTickets error:", err);
    }
}

async function syncScheduledDeletions() {
    try {
        let data = await fetchAdminNodeRest('scheduled_deletions');
        if (!data) {
            const snap = await db.ref('scheduled_deletions').once('value').catch(() => null);
            data = snap && snap.exists() ? snap.val() : {};
        }

        allScheduledDeletions = data || {};
        const countEl = document.getElementById('statDeletionsCount');
        if (countEl) countEl.textContent = Object.keys(allScheduledDeletions).length;

        renderScheduledDeletionsTable();
    } catch (err) {
        console.error("syncScheduledDeletions error:", err);
    }
}

async function handleSendNotification(e) {
    if (e) e.preventDefault();

    const title = document.getElementById('notifTitle').value.trim();
    const body = document.getElementById('notifBody').value.trim();
    const type = document.getElementById('notifType').value;
    const imgUrl = document.getElementById('notifImageUrl').value.trim();
    const postId = document.getElementById('notifPostId').value.trim();
    const commentId = document.getElementById('notifCommentId').value.trim();

    if (!title || !body) {
        showToast("Please enter title and body.", "error");
        return;
    }

    const notifItem = {
        id: `${Date.now()}_${Math.floor(Math.random() * 10000)}`,
        title,
        body,
        type,
        postId: postId || null,
        commentId: commentId || null,
        imageUrl: imgUrl || null,
        timestamp: Date.now(),
        isRead: false
    };

    showGlobalLoading(true, "Dispatching Push via FCM v1 HTTP API...");

    try {
        const accessToken = await getOAuth2AccessToken();

        const messagePayload = {
            data: {
                id: notifItem.id,
                notification_id: notifItem.id,
                title: title,
                body: body,
                type: type,
                postId: postId || "",
                commentId: commentId || "",
                imageUrl: imgUrl || "",
                timestamp: String(notifItem.timestamp)
            },
            android: {
                priority: "high"
            }
        };

        if (targetMode === 'topic') {
            const topic = document.getElementById('inputTopicName').value.trim() || 'all';
            messagePayload.topic = topic;

            const fcmRes = await fetch(`https://fcm.googleapis.com/v1/projects/${SERVICE_ACCOUNT.project_id}/messages:send`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${accessToken}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ message: messagePayload })
            });

            const fcmData = await fcmRes.json();
            if (!fcmRes.ok) {
                throw new Error(fcmData.error?.message || "FCM Delivery Failed");
            }

            addLogItem("success", `Broadcast to /topics/${topic}: "${title}"`);
            showToast(`Broadcast notification sent to /topics/${topic}!`);
        } else {
            const tokenInput = document.getElementById('inputRecipientToken');
            const token = tokenInput ? tokenInput.value.trim() : '';
            let targetUid = tokenInput ? tokenInput.getAttribute('data-target-uid') : null;

            if (!targetUid && token) {
                const match = allUsers.find(u => u.fcmToken === token);
                if (match) targetUid = match.uid;
            }

            if (!token && !targetUid) {
                throw new Error("Please enter or select a recipient device token.");
            }

            if (token) {
                messagePayload.token = token;
                const fcmRes = await fetch(`https://fcm.googleapis.com/v1/projects/${SERVICE_ACCOUNT.project_id}/messages:send`, {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${accessToken}`,
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ message: messagePayload })
                });

                const fcmData = await fcmRes.json();
                if (!fcmRes.ok) {
                    throw new Error(fcmData.error?.message || "FCM Token Delivery Failed");
                }
            }

            if (targetUid) {
                db.ref('users').child(targetUid).child('notifications').child(notifItem.id).set(notifItem);
            }

            addLogItem("success", `Direct Push: "${title}"`);
            showToast("Direct notification dispatched successfully!");
        }
    } catch (err) {
        console.error("Notification dispatch failed:", err);
        addLogItem("error", `Failed: ${err.message}`);
        showToast("Delivery failed: " + err.message, "error");
    } finally {
        showGlobalLoading(false);
    }
}

function addLogItem(status, message) {
    sentLogs.unshift({
        time: new Date().toLocaleTimeString(),
        status,
        message
    });
    renderLogsList();
}

function renderLogsList() {
    const list = document.getElementById('sentLogsList');
    if (sentLogs.length === 0) {
        list.innerHTML = '<div style="text-align: center; padding: 30px 10px; color: var(--md-sys-color-outline); font-size: 0.85rem;">No notifications dispatched in this session yet.</div>';
        return;
    }

    list.innerHTML = sentLogs.map(log => `
        <div style="padding: 10px 14px; background: var(--md-sys-color-surface-container-high); border-radius: var(--shape-small); border: 1px solid var(--md-sys-color-outline-variant); font-size: 0.82rem; display: flex; align-items: center; justify-content: space-between; gap: 10px;">
            <div style="display: flex; align-items: center; gap: 8px;">
                <i class="ti ti-${log.status === 'success' ? 'check' : 'alert-circle'}" style="color: ${log.status === 'success' ? '#69F0AE' : '#FF8A80'};"></i>
                <span>${escapeHtml(log.message)}</span>
            </div>
            <span style="font-family: var(--font-mono); font-size: 0.74rem; color: var(--md-sys-color-outline);">${log.time}</span>
        </div>
    `).join('');
}

/* ==========================================================
   6. TAB 2: USERS DIRECTORY & ROLE MANAGEMENT
   ========================================================== */
function handleSearchUsers(query) {
    userSearchQuery = (query || '').trim().toLowerCase();
    renderUsersTable();
}

function setDirectoryFilter(filter) {
    userFilter = filter || 'all';
    document.querySelectorAll('#tabUsers .filter-chip-btn').forEach(b => {
        b.classList.toggle('active', b.getAttribute('data-filter') === userFilter);
    });
    renderUsersTable();
}

function renderUsersTable() {
    const tbody = document.getElementById('usersTableBody');
    const emptyState = document.getElementById('usersEmptyState');
    if (!tbody) return;

    const filtered = allUsers.filter(u => {
        const p = u.profile || {};
        const name = (p.displayName || '').toLowerCase();
        const username = (p.username || '').toLowerCase();
        const email = (p.email || '').toLowerCase();
        const uid = (u.uid || '').toLowerCase();
        const badge = (p.badge || 'none').toLowerCase();

        const matchQuery = !userSearchQuery || 
            name.includes(userSearchQuery) || 
            username.includes(userSearchQuery) || 
            email.includes(userSearchQuery) || 
            uid.includes(userSearchQuery) ||
            badge.includes(userSearchQuery);

        if (!matchQuery) return false;

        if (userFilter === 'with_token') return !!u.fcmToken;
        if (userFilter === 'staff') return badge === 'admin' || badge === 'maintainer';
        if (userFilter === 'pro') return badge === 'pro';
        if (userFilter === 'restricted') return !!(p.restricted || p.banned);
        if (userFilter === 'deletion') return !!p.deletionScheduled;
        return true;
    });

    const countBadge = document.getElementById('userCountBadge');
    if (countBadge) {
        countBadge.textContent = `${filtered.length} Users`;
    }

    if (filtered.length === 0) {
        tbody.innerHTML = '';
        if (emptyState) emptyState.style.display = 'block';
        return;
    }

    if (emptyState) emptyState.style.display = 'none';
    tbody.innerHTML = filtered.map(u => {
        const p = u.profile || {};
        const name = p.displayName || p.username || 'User';
        const username = p.username ? `@${p.username}` : '';
        const email = p.email || 'No Email';
        const badge = (p.badge || 'none').toLowerCase();
        const hasToken = !!u.fcmToken;
        const joinedDate = p.createdAt ? new Date(Number(p.createdAt)).toLocaleDateString() : 'Unknown';
        const photoUrl = p.photoUrl;
        const isRestricted = !!(p.restricted || p.banned);

        // Detect Logged In By provider
        let providerHtml = '';
        if (photoUrl && (photoUrl.includes('google') || photoUrl.includes('googleusercontent'))) {
            providerHtml = '<span class="auth-provider-badge google"><i class="ti ti-brand-google"></i> Google</span>';
        } else if (p.isAnonymous) {
            providerHtml = '<span class="auth-provider-badge anon"><i class="ti ti-ghost"></i> Anonymous</span>';
        } else if (email && email.includes('@')) {
            providerHtml = '<span class="auth-provider-badge email"><i class="ti ti-mail"></i> Email & Pass</span>';
        } else {
            providerHtml = '<span class="auth-provider-badge pass"><i class="ti ti-key"></i> Password</span>';
        }

        const avatarHtml = photoUrl ? 
            `<img src="${escapeHtml(photoUrl)}" class="user-table-avatar-img" alt="Avatar">` : 
            `<div class="user-table-avatar-initial">${escapeHtml(name.charAt(0).toUpperCase())}</div>`;

        return `
            <tr>
                <td>
                    <div class="user-table-profile-cell">
                        ${avatarHtml}
                        <div>
                            <div style="font-weight: 700; color: var(--md-sys-color-on-surface);">
                                ${escapeHtml(name)} 
                                ${p.deletionScheduled ? '<span style="color:#FF8A80; font-size:0.75rem;">(Deletion Pending)</span>' : ''}
                                ${isRestricted ? '<span class="badge" style="background:rgba(255,82,82,0.2); color:#FF8A80; font-size:0.72rem; font-weight:700; padding:2px 6px; border-radius:4px; border:1px solid rgba(255,82,82,0.4); margin-left:6px;"><i class="ti ti-lock"></i> RESTRICTED</span>' : ''}
                            </div>
                            <div style="font-size: 0.78rem; color: var(--md-sys-color-outline); font-family: var(--font-mono);">${escapeHtml(username)} &bull; ${escapeHtml(email)}</div>
                        </div>
                    </div>
                </td>
                <td>
                    <span class="role-badge ${badge}">${badge.toUpperCase()}</span>
                </td>
                <td>${providerHtml}</td>
                <td>
                    <span style="font-family: var(--font-mono); font-size: 0.78rem; color: var(--md-sys-color-outline);">${u.uid.substring(0, 8)}...</span>
                </td>
                <td>
                    ${hasToken ? '<span style="color:#69F0AE; font-size:0.8rem; font-weight:700;"><i class="ti ti-check"></i> Registered</span>' : '<span style="color:var(--md-sys-color-outline); font-size:0.8rem;">None</span>'}
                </td>
                <td>
                    <span style="font-size: 0.8rem; color: var(--md-sys-color-outline);">${joinedDate}</span>
                </td>
                <td style="text-align: right;">
                    <div style="display: flex; align-items: center; justify-content: flex-end; gap: 6px;">
                        <button type="button" class="table-btn-action" onclick="openEditUserModal('${u.uid}')" title="Edit user profile & role">
                            <i class="ti ti-edit"></i> Edit
                        </button>
                        <button type="button" class="table-btn-action" onclick="openUserNotificationsModal('${u.uid}')" title="View & manage notifications">
                            <i class="ti ti-bell"></i> Alerts
                        </button>
                        <button type="button" class="table-btn-action" onclick="targetUserPush('${u.uid}', '${escapeHtml(u.fcmToken || '')}', '${escapeHtml(name)}')" title="Send direct push notification">
                            <i class="ti ti-send"></i>
                        </button>
                        <button type="button" class="table-btn-action" style="color: var(--md-sys-color-error);" onclick="confirmDeleteUser('${u.uid}', '${escapeHtml(p.username || '')}')" title="Delete account">
                            <i class="ti ti-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function targetUserPush(uid, token, name) {
    switchTab('tabNotifications');
    setTargetMode('token');
    const input = document.getElementById('inputRecipientToken');
    input.value = token || '';
    input.setAttribute('data-target-uid', uid);
    
    document.getElementById('selectedUserBadge').innerHTML = `
        <div style="display: flex; align-items: center; gap: 8px; font-weight:700; color: var(--md-sys-color-primary);">
            <i class="ti ti-user-check"></i> Targeted to: ${name} (${uid.substring(0, 8)}...)
        </div>
    `;
    updatePreview();
    document.getElementById('composerSection').scrollIntoView({ behavior: 'smooth' });
}

function openEditUserModal(uid) {
    const user = allUsers.find(u => u.uid === uid);
    if (!user) return;

    const p = user.profile || {};
    document.getElementById('editUserUid').value = uid;
    document.getElementById('editUserDisplayName').value = p.displayName || '';
    document.getElementById('editUserUsername').value = p.username || '';
    document.getElementById('editUserBio').value = p.bio || '';
    document.getElementById('editUserBadge').value = (p.badge || 'none').toLowerCase();
    document.getElementById('editUserEmailVerified').checked = !!p.isEmailVerified;
    const restrictedCheckbox = document.getElementById('editUserRestricted');
    if (restrictedCheckbox) restrictedCheckbox.checked = !!(p.restricted || p.banned);
    const reasonInput = document.getElementById('editUserRestrictionReason');
    if (reasonInput) reasonInput.value = p.restrictionReason || '';

    document.getElementById('modalEditUser').style.display = 'flex';
}

function closeEditUserModal() {
    document.getElementById('modalEditUser').style.display = 'none';
}

async function handleSaveUserEdit(e) {
    if (e) e.preventDefault();
    const uid = document.getElementById('editUserUid').value;
    if (!uid) return;

    const displayName = document.getElementById('editUserDisplayName').value.trim();
    const bio = document.getElementById('editUserBio').value.trim();
    const badge = document.getElementById('editUserBadge').value;
    const isEmailVerified = document.getElementById('editUserEmailVerified').checked;
    const restrictedCheckbox = document.getElementById('editUserRestricted');
    const isRestricted = restrictedCheckbox ? restrictedCheckbox.checked : false;
    const reasonInput = document.getElementById('editUserRestrictionReason');
    const restrictionReason = reasonInput ? reasonInput.value.trim() : '';

    showGlobalLoading(true, "Saving Profile Changes...");

    try {
        await db.ref(`users/${uid}/profile`).update({
            displayName,
            bio,
            badge: badge === 'none' ? null : badge,
            isEmailVerified,
            restricted: isRestricted,
            banned: isRestricted,
            restrictionReason: isRestricted ? (restrictionReason || 'Administrative restriction') : null
        });

        showGlobalLoading(false);
        closeEditUserModal();
        showToast("User profile and restriction status updated successfully!");
    } catch (err) {
        showGlobalLoading(false);
        showToast("Update error: " + err.message, "error");
    }
}

async function confirmDeleteUser(uid, username) {
    if (!confirm(`Place user account ${uid} into 7-day deletion grace period and set restricted status?`)) return;

    showGlobalLoading(true, "Scheduling Deletion & Restricting Account...");

    try {
        const now = Date.now();
        const deleteAt = now + (7 * 24 * 60 * 60 * 1000);
        const user = allUsers.find(u => u.uid === uid);
        const profile = user ? (user.profile || {}) : {};
        const email = profile.email || '';
        const userUsername = profile.username || username || '';

        // 1. Update profile with deletionScheduled and restricted
        await db.ref(`users/${uid}/profile`).update({
            deletionScheduled: true,
            scheduledDeletionTimestamp: deleteAt,
            restricted: true
        });

        // 2. Add entry to scheduled_deletions
        await db.ref(`scheduled_deletions/${uid}`).set({
            uid: uid,
            username: userUsername,
            email: email,
            scheduledAt: now,
            deleteAt: deleteAt,
            reason: 'Admin Initiated Deletion',
            feedback: 'Account restricted by Admin'
        });

        showGlobalLoading(false);
        showToast("User account sent to deletion period and restricted.");
    } catch (err) {
        showGlobalLoading(false);
        showToast("Action failed: " + err.message, "error");
    }
}

async function purgeUserAccountCascade(uid, username) {
    // 1. Delete all posts created by user + post comments + post likes
    const postsSnap = await db.ref('community_posts').orderByChild('authorUid').equalTo(uid).once('value');
    if (postsSnap.exists()) {
        const postUpdates = {};
        postsSnap.forEach(child => {
            const postId = child.key;
            postUpdates[`community_posts/${postId}`] = null;
            postUpdates[`community_comments/${postId}`] = null;
            postUpdates[`community_likes/${postId}`] = null;
        });
        await db.ref().update(postUpdates);
    }

    // 2. Delete all comments authored by user across all posts
    const commentsSnap = await db.ref('community_comments').once('value');
    if (commentsSnap.exists()) {
        const commentUpdates = {};
        commentsSnap.forEach(postChild => {
            const postId = postChild.key;
            postChild.forEach(commentChild => {
                const comment = commentChild.val() || {};
                if (comment.authorUid === uid) {
                    commentUpdates[`community_comments/${postId}/${commentChild.key}`] = null;
                }
            });
        });
        if (Object.keys(commentUpdates).length > 0) {
            await db.ref().update(commentUpdates);
        }
    }

    // 3. Delete all likes by user
    const likesSnap = await db.ref('community_likes').once('value');
    if (likesSnap.exists()) {
        const likeUpdates = {};
        likesSnap.forEach(postChild => {
            const postId = postChild.key;
            if (postChild.hasChild(uid)) {
                likeUpdates[`community_likes/${postId}/${uid}`] = null;
            }
        });
        if (Object.keys(likeUpdates).length > 0) {
            await db.ref().update(likeUpdates);
        }
    }

    // 4. Delete user profile & username mapping & scheduled deletion
    await db.ref(`users/${uid}`).remove();
    if (username) {
        await db.ref(`usernames/${username.toLowerCase()}`).remove();
    }
    await db.ref(`scheduled_deletions/${uid}`).remove();
}

/* User Notifications Inspector Modal */
let activeInspectUid = null;

function openUserNotificationsModal(uid) {
    activeInspectUid = uid;
    const user = allUsers.find(u => u.uid === uid);
    if (!user) return;

    document.getElementById('modalUserName').textContent = `${user.profile.displayName || 'User'}'s Notifications`;
    document.getElementById('modalUserUid').textContent = uid;

    db.ref(`users/${uid}/notifications`).on('value', snap => {
        const notifs = [];
        let unread = 0;

        if (snap.exists()) {
            snap.forEach(child => {
                const n = child.val();
                n.id = child.key;
                notifs.push(n);
                if (!n.isRead) unread++;
            });
        }

        notifs.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

        document.getElementById('modalTotalNotifs').textContent = notifs.length;
        document.getElementById('modalUnreadNotifs').textContent = unread;

        const listEl = document.getElementById('modalNotifsList');
        if (notifs.length === 0) {
            listEl.innerHTML = '<div style="text-align:center; padding:30px; color:var(--md-sys-color-outline);">No notification history recorded for this user.</div>';
            return;
        }

        listEl.innerHTML = notifs.map(n => `
            <div style="padding:12px 16px; background:var(--md-sys-color-surface-container-high); border-radius:var(--shape-medium); border:1px solid var(--md-sys-color-outline-variant); display:flex; align-items:center; justify-content:space-between; gap:12px;">
                <div>
                    <div style="font-weight:700; color:var(--md-sys-color-on-surface); font-size:0.9rem;">
                        ${n.isRead ? '' : '<span style="color:#FFB4AB;">● </span>'}${escapeHtml(n.title || 'Notification')}
                    </div>
                    <div style="font-size:0.82rem; color:var(--md-sys-color-on-surface-variant);">${escapeHtml(n.body || '')}</div>
                    <div style="font-size:0.74rem; color:var(--md-sys-color-outline); font-family:var(--font-mono); margin-top:4px;">
                        ${new Date(n.timestamp || Date.now()).toLocaleString()} &bull; Type: ${escapeHtml(n.type || 'general')}
                    </div>
                </div>
                <div style="display:flex; align-items:center; gap:6px;">
                    <button type="button" class="table-btn-action" onclick="toggleUserNotifRead('${uid}', '${n.id}', ${!n.isRead})">
                        ${n.isRead ? '<i class="ti ti-mail"></i>' : '<i class="ti ti-check"></i>'}
                    </button>
                    <button type="button" class="table-btn-action" style="color:var(--md-sys-color-error);" onclick="deleteUserNotif('${uid}', '${n.id}')">
                        <i class="ti ti-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
    });

    document.getElementById('modalUserNotifications').style.display = 'flex';
}

function closeUserNotificationsModal() {
    if (activeInspectUid) {
        db.ref(`users/${activeInspectUid}/notifications`).off();
        activeInspectUid = null;
    }
    document.getElementById('modalUserNotifications').style.display = 'none';
}

function toggleUserNotifRead(uid, notifId, makeRead) {
    db.ref(`users/${uid}/notifications/${notifId}/isRead`).set(makeRead);
}

function deleteUserNotif(uid, notifId) {
    db.ref(`users/${uid}/notifications/${notifId}`).remove();
}

function modalMarkAllRead() {
    if (!activeInspectUid) return;
    db.ref(`users/${activeInspectUid}/notifications`).once('value', snap => {
        if (snap.exists()) {
            snap.forEach(c => {
                c.ref.child('isRead').set(true);
            });
        }
    });
}

function modalClearAll() {
    if (!activeInspectUid) return;
    if (!confirm("Are you sure you want to clear all notifications for this user?")) return;
    db.ref(`users/${activeInspectUid}/notifications`).remove();
}

/* ==========================================================
   7. TAB 3: HELP DESK & SUPPORT TICKETS
   ========================================================== */
function handleSearchTickets(query) {
    ticketSearchQuery = (query || '').trim().toLowerCase();
    renderTicketsTable();
}

function setTicketFilter(filter) {
    ticketFilter = filter || 'all';
    document.querySelectorAll('#tabTickets .filter-chip-btn').forEach(b => {
        b.classList.toggle('active', b.getAttribute('data-filter') === ticketFilter);
    });
    renderTicketsTable();
}

function renderTicketsTable() {
    const tbody = document.getElementById('ticketsTableBody');
    const emptyState = document.getElementById('ticketsEmptyState');
    if (!tbody) return;

    const filtered = allTickets.filter(t => {
        const msg = (t.message || t.description || t.text || t.details || t.issue || t.body || '').toLowerCase();
        const cat = (t.category || t.type || t.subject || t.title || '').toLowerCase();
        const contact = (t.contactInfo || t.email || t.userEmail || t.contact || '').toLowerCase();
        const id = (t.ticketId || '').toLowerCase();
        const status = (t.status || 'open').toLowerCase();

        const matchQuery = !ticketSearchQuery || 
            msg.includes(ticketSearchQuery) || 
            cat.includes(ticketSearchQuery) || 
            contact.includes(ticketSearchQuery) || 
            id.includes(ticketSearchQuery);

        if (!matchQuery) return false;

        if (ticketFilter !== 'all' && status !== ticketFilter) return false;
        return true;
    });

    if (filtered.length === 0) {
        tbody.innerHTML = '';
        if (emptyState) emptyState.style.display = 'block';
        return;
    }

    if (emptyState) emptyState.style.display = 'none';
    tbody.innerHTML = filtered.map(t => {
        const status = (t.status || 'open').toLowerCase();
        const msg = t.message || t.description || t.text || t.details || t.issue || t.body || 'No description provided';
        const cat = t.category || t.type || t.subject || t.title || 'General Support';
        const contact = t.contactInfo || t.email || t.userEmail || t.contact || 'None';
        const rawTime = t.createdAt || t.timestamp || t.date || t.time;
        const dateStr = rawTime ? new Date(Number(rawTime) || rawTime).toLocaleString() : 'Recent';
        const uid = t.uid || t.userId || t.user_id || '';
        const deviceInfo = t.deviceInfo || t.device || t.device_info || t.model || t.appVersion || '';
        const sourcePath = t._sourcePath || 'help_tickets';

        return `
            <tr>
                <td>
                    <div style="font-weight: 700; color: var(--md-sys-color-on-surface);">${escapeHtml(cat)}</div>
                    <div style="font-size: 0.85rem; color: var(--md-sys-color-on-surface-variant); margin-top: 4px; max-width: 340px; line-height: 1.4;">${escapeHtml(msg)}</div>
                    <div style="font-size: 0.74rem; color: var(--md-sys-color-outline); font-family: var(--font-mono); margin-top: 4px;">
                        ${deviceInfo ? `${escapeHtml(deviceInfo)} &bull; ` : ''}Contact: ${escapeHtml(contact)}
                    </div>
                </td>
                <td>
                    <select class="m3-select" style="padding: 4px 10px; font-size: 0.8rem; width: auto;" onchange="updateTicketStatus('${t.ticketId}', this.value, '${sourcePath}')">
                        <option value="open" ${status === 'open' ? 'selected' : ''}>OPEN</option>
                        <option value="in-progress" ${status === 'in-progress' ? 'selected' : ''}>IN PROGRESS</option>
                        <option value="resolved" ${status === 'resolved' ? 'selected' : ''}>RESOLVED</option>
                        <option value="closed" ${status === 'closed' ? 'selected' : ''}>CLOSED</option>
                    </select>
                </td>
                <td>
                    <span style="font-family: var(--font-mono); font-size: 0.78rem; color: var(--md-sys-color-outline);">${uid ? `${escapeHtml(uid.substring(0, 10))}...` : 'Anonymous'}</span>
                </td>
                <td>
                    <span style="font-size: 0.8rem; color: var(--md-sys-color-outline);">${dateStr}</span>
                </td>
                <td style="text-align: right;">
                    <div style="display: flex; align-items: center; justify-content: flex-end; gap: 6px;">
                        ${uid ? `<button type="button" class="table-btn-action" onclick="replyToTicketUser('${uid}', '${escapeHtml(contact)}')" title="Reply to user via FCM push"><i class="ti ti-send"></i> Reply</button>` : ''}
                        <button type="button" class="table-btn-action" style="color: var(--md-sys-color-error);" onclick="deleteTicket('${t.ticketId}', '${sourcePath}')" title="Delete ticket">
                            <i class="ti ti-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function replyToTicketUser(uid, hintName = 'User') {
    if (!uid) {
        showToast("Ticket author is anonymous.", "error");
        return;
    }

    const userMatch = allUsers.find(u => u.uid === uid);
    const fcmToken = userMatch ? userMatch.fcmToken : null;
    const name = userMatch ? (userMatch.profile?.displayName || userMatch.profile?.username || hintName) : hintName;

    switchTab('tabNotifications');
    setTargetMode('token');

    const tokenInput = document.getElementById('inputRecipientToken');
    if (tokenInput) {
        tokenInput.value = fcmToken || '';
        tokenInput.setAttribute('data-target-uid', uid || '');
    }

    const titleInput = document.getElementById('notifTitle');
    if (titleInput) titleInput.value = `Response regarding your support ticket`;

    const bodyInput = document.getElementById('notifBody');
    if (bodyInput && !bodyInput.value) {
        bodyInput.value = `Hello ${name}, regarding your recent support request: `;
    }

    if (fcmToken) {
        showToast(`Matched FCM device token for ${name}!`);
    } else {
        showToast(`Matched user ${name}, but no device FCM token found.`, "warning");
    }

    const composerSection = document.getElementById('composerSection');
    if (composerSection) composerSection.scrollIntoView({ behavior: 'smooth' });
}

function targetUserPush(uid, token, name = 'User') {
    const userMatch = allUsers.find(u => u.uid === uid);
    const fcmToken = token || (userMatch ? userMatch.fcmToken : null);
    const userName = name || (userMatch ? (userMatch.profile?.displayName || userMatch.profile?.username) : 'User');

    switchTab('tabNotifications');
    setTargetMode('token');

    const tokenInput = document.getElementById('inputRecipientToken');
    if (tokenInput) {
        tokenInput.value = fcmToken || '';
        tokenInput.setAttribute('data-target-uid', uid || '');
    }

    if (fcmToken) {
        showToast(`Selected FCM token for ${userName}`);
    } else {
        showToast(`No active FCM token for ${userName}`, "warning");
    }

    const composerSection = document.getElementById('composerSection');
    if (composerSection) composerSection.scrollIntoView({ behavior: 'smooth' });
}

function updateTicketStatus(ticketId, newStatus, sourcePath = 'help_tickets') {
    db.ref(`${sourcePath}/${ticketId}/status`).set(newStatus).then(() => {
        showToast(`Ticket status updated to ${newStatus.toUpperCase()}`);
    }).catch(err => {
        showToast(`Error: ${err.message}`);
    });
}

function deleteTicket(ticketId, sourcePath = 'help_tickets') {
    if (!confirm("Delete this support ticket permanently?")) return;
    db.ref(`${sourcePath}/${ticketId}`).remove().then(() => {
        showToast("Support ticket deleted.");
    }).catch(err => {
        showToast(`Error: ${err.message}`);
    });
}

/* ==========================================================
   8. TAB 4: ACCESS KEYS & VIP PASSES
   ========================================================== */
function renderAccessKeysTable() {
    const tbody = document.getElementById('accessKeysTableBody');
    const keys = Object.keys(allAccessKeys);

    if (keys.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: var(--md-sys-color-outline); padding: 30px;">No VIP access passes created yet.</td></tr>';
        return;
    }

    tbody.innerHTML = keys.map(key => {
        const item = allAccessKeys[key];
        const active = item.active !== false;
        
        let expiryFormatted = "Never";
        let isExpired = false;
        if (item.expires_at) {
            if (typeof item.expires_at === 'number') {
                isExpired = Date.now() > item.expires_at;
                expiryFormatted = new Date(item.expires_at).toLocaleDateString();
            } else {
                expiryFormatted = String(item.expires_at);
            }
        }

        return `
            <tr>
                <td>
                    <span style="font-family: var(--font-mono); font-weight: 700; color: var(--md-sys-color-primary);">${escapeHtml(key)}</span>
                </td>
                <td>
                    <div style="font-weight: 700; color: var(--md-sys-color-on-surface);">${escapeHtml(item.title || 'VIP Pass')}</div>
                    <div style="font-size: 0.8rem; color: var(--md-sys-color-outline);">${escapeHtml(item.note || '')}</div>
                </td>
                <td>
                    <span style="font-size: 0.82rem; color: ${isExpired ? '#FF8A80' : 'var(--md-sys-color-on-surface)'};">
                        ${expiryFormatted} ${isExpired ? '(Expired)' : ''}
                    </span>
                </td>
                <td>
                    <label style="display: flex; align-items: center; gap: 6px; cursor: pointer;">
                        <input type="checkbox" ${active ? 'checked' : ''} onchange="toggleAccessKeyActive('${key}', this.checked)">
                        <span style="font-size: 0.8rem; font-weight: 700; color: ${active ? '#69F0AE' : '#FF8A80'};">${active ? 'ACTIVE' : 'DISABLED'}</span>
                    </label>
                </td>
                <td style="text-align: right;">
                    <button type="button" class="table-btn-action" style="color: var(--md-sys-color-error);" onclick="deleteAccessKey('${key}')" title="Delete pass">
                        <i class="ti ti-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

function updateMasterKey() {
    const val = document.getElementById('inputMasterKey').value.trim();
    if (!val) {
        showToast("Master key cannot be empty.", "error");
        return;
    }
    db.ref('access_key').set(val).then(() => {
        showToast("Master access key updated successfully!");
    });
}

function toggleAccessKeyActive(key, active) {
    db.ref(`access_keys/${key}/active`).set(active).then(() => {
        showToast(`Pass ${key} ${active ? 'activated' : 'deactivated'}.`);
    });
}

function deleteAccessKey(key) {
    if (!confirm(`Delete access pass "${key}"?`)) return;
    db.ref(`access_keys/${key}`).remove().then(() => {
        showToast("Access pass removed.");
    });
}

function openCreateKeyModal() {
    document.getElementById('newKeyCode').value = "SKETCHX-" + Math.random().toString(36).substring(2, 8).toUpperCase() + "-2026";
    document.getElementById('newKeyTitle').value = "";
    document.getElementById('newKeyNote').value = "";
    document.getElementById('modalCreateKey').style.display = 'flex';
}

function closeCreateKeyModal() {
    document.getElementById('modalCreateKey').style.display = 'none';
}

function handleCreateKey(e) {
    if (e) e.preventDefault();
    const key = document.getElementById('newKeyCode').value.trim().toUpperCase();
    const title = document.getElementById('newKeyTitle').value.trim();
    const note = document.getElementById('newKeyNote').value.trim();
    const expiryType = document.getElementById('newKeyExpiry').value;

    if (!key) return;

    let expiresAt = null;
    if (expiryType === '1m') expiresAt = Date.now() + (30 * 86400000);
    else if (expiryType === '6m') expiresAt = Date.now() + (180 * 86400000);
    else if (expiryType === '1y') expiresAt = Date.now() + (365 * 86400000);
    else if (expiryType === 'permanent') expiresAt = "Permanent";

    db.ref(`access_keys/${key}`).set({
        active: true,
        title: title || 'VIP Supporter Pass',
        note: note || '',
        expires_at: expiresAt
    }).then(() => {
        closeCreateKeyModal();
        showToast(`Access key "${key}" created successfully!`);
    });
}

/* ==========================================================
   9. TAB 5: COMMUNITY POSTS & MODERATION
   ========================================================== */
function handleSearchPosts(query) {
    postSearchQuery = query.toLowerCase();
    renderPostsTable();
}

function setPostFilter(filter) {
    postFilter = filter;
    document.querySelectorAll('.filter-chips-posts .filter-chip-btn').forEach(b => {
        b.classList.toggle('active', b.getAttribute('data-filter') === filter);
    });
    renderPostsTable();
}

function renderPostsTable() {
    const tbody = document.getElementById('postsTableBody');
    const emptyState = document.getElementById('postsEmptyState');

    const filtered = allPosts.filter(p => {
        const title = (p.title || '').toLowerCase();
        const author = (p.authorName || '').toLowerCase();
        const cat = (p.category || '').toLowerCase();
        const id = (p.id || '').toLowerCase();

        const matchQuery = !postSearchQuery || title.includes(postSearchQuery) || author.includes(postSearchQuery) || cat.includes(postSearchQuery) || id.includes(postSearchQuery);
        if (!matchQuery) return false;

        const authorUser = allUsers.find(u => u.uid === p.authorUid);
        const isAuthorRestricted = !!(authorUser && (authorUser.profile?.restricted || authorUser.profile?.banned));
        const isAuthorDeletion = !!(authorUser && authorUser.profile?.deletionScheduled);

        if (postFilter === 'code') return p.type !== 'block';
        if (postFilter === 'block') return p.type === 'block';
        if (postFilter === 'verified') return !!p.verified;
        if (postFilter === 'hidden') return !!p.hidden;
        if (postFilter === 'restricted') return isAuthorRestricted;
        return true;
    });

    if (filtered.length === 0) {
        tbody.innerHTML = '';
        emptyState.style.display = 'block';
        return;
    }

    emptyState.style.display = 'none';
    tbody.innerHTML = filtered.map(p => {
        const isBlock = p.type === 'block';
        const isHidden = !!p.hidden;
        const isVerified = !!p.verified;
        const isLocked = !!p.commentsDisabled;
        const authorUser = allUsers.find(u => u.uid === p.authorUid);
        const isAuthorRestricted = !!(authorUser && (authorUser.profile?.restricted || authorUser.profile?.banned));
        const isAuthorDeletion = !!(authorUser && authorUser.profile?.deletionScheduled);

        return `
            <tr>
                <td>
                    <div style="font-weight: 700; color: var(--md-sys-color-on-surface); font-size: 0.95rem;">
                        ${escapeHtml(p.title || 'Untitled')}
                        ${isAuthorRestricted ? '<span class="badge" style="background:rgba(255,82,82,0.2); color:#FF8A80; font-size:0.72rem; font-weight:700; padding:2px 6px; border-radius:4px; border:1px solid rgba(255,82,82,0.4); margin-left:6px;"><i class="ti ti-lock"></i> AUTHOR RESTRICTED</span>' : ''}
                        ${isAuthorDeletion ? '<span class="badge" style="background:rgba(255,171,0,0.2); color:#FFD54F; font-size:0.72rem; font-weight:700; padding:2px 6px; border-radius:4px; border:1px solid rgba(255,171,0,0.4); margin-left:6px;"><i class="ti ti-trash"></i> DELETION PENDING</span>' : ''}
                    </div>
                    <div style="font-size: 0.78rem; color: var(--md-sys-color-outline); margin-top: 2px;">
                        By ${escapeHtml(p.authorName || 'User')} &bull; ${new Date(p.timestamp || 0).toLocaleDateString()}
                    </div>
                </td>
                <td>
                    <span class="post-type-pill ${isBlock ? 'block' : 'code'}" style="font-size: 0.7rem; padding: 2px 8px;">
                        ${isBlock ? 'BLOCK' : 'CODE'}
                    </span>
                </td>
                <td>
                    <button type="button" class="post-toggle-btn ${isVerified ? 'verified' : ''}" onclick="togglePostVerified('${p.id}', ${!isVerified})" title="Click to toggle Verified status">
                        <i class="ti ti-discount-check${isVerified ? '-filled' : ''}"></i>
                        <span>${isVerified ? 'VERIFIED' : 'UNVERIFIED'}</span>
                    </button>
                </td>
                <td>
                    <button type="button" class="post-toggle-btn ${isHidden ? 'hidden' : 'visible'}" onclick="togglePostHidden('${p.id}', ${!isHidden})" title="Click to toggle Visibility status">
                        <i class="ti ti-eye${isHidden ? '-off' : ''}"></i>
                        <span>${isHidden ? 'HIDDEN' : 'VISIBLE'}</span>
                    </button>
                </td>
                <td>
                    <button type="button" class="post-toggle-btn ${isLocked ? 'locked' : ''}" onclick="togglePostCommentsDisabled('${p.id}', ${!isLocked})" title="Click to toggle Comments Lock">
                        <i class="ti ti-lock${isLocked ? '' : '-open'}"></i>
                        <span>${isLocked ? 'LOCKED' : 'OPEN'}</span>
                    </button>
                </td>
                <td>
                    <span style="font-size: 0.8rem; color: var(--md-sys-color-outline);">${p.likesCount || 0} ❤️ &bull; ${p.commentsCount || 0} 💬</span>
                </td>
                <td style="text-align: right;">
                    <div style="display: flex; align-items: center; justify-content: flex-end; gap: 6px;">
                        <a href="post.html?id=${p.id}" target="_blank" class="table-btn-action" title="View live post web page">
                            <i class="ti ti-external-link"></i> Web
                        </a>
                        <button type="button" class="table-btn-action" onclick="openPostCommentsModal('${p.id}')" title="Inspect & moderate comments">
                            <i class="ti ti-messages"></i> Comments
                        </button>
                        <button type="button" class="table-btn-action" style="color: var(--md-sys-color-error);" onclick="deletePost('${p.id}')" title="Delete post">
                            <i class="ti ti-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

async function updateAdminPostNodeRest(postId, updates) {
    try {
        const accessToken = await getOAuth2AccessToken();
        const url = `https://sketchx-88b8e-default-rtdb.asia-southeast1.firebasedatabase.app/community_posts/${postId}.json?access_token=${encodeURIComponent(accessToken)}`;
        const res = await fetch(url, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates)
        });
        if (res.ok) {
            return await res.json();
        }
    } catch (err) {
        console.warn("REST post update notice:", err.message);
    }
    return null;
}

async function togglePostVerified(postId, verified) {
    const post = allPosts.find(p => p.id === postId);
    if (post) {
        post.verified = verified;
        renderPostsTable();
    }

    try {
        await updateAdminPostNodeRest(postId, { verified: verified });
        await db.ref(`community_posts/${postId}/verified`).set(verified).catch(() => {});
        showToast(verified ? "Post marked as Verified ✓" : "Post unverified.");
    } catch (err) {
        showToast("Verified status updated.");
    }
}

async function togglePostHidden(postId, hidden) {
    const post = allPosts.find(p => p.id === postId);
    if (post) {
        post.hidden = hidden;
        renderPostsTable();
    }

    try {
        await updateAdminPostNodeRest(postId, { hidden: hidden });
        await db.ref(`community_posts/${postId}/hidden`).set(hidden).catch(() => {});
        showToast(hidden ? "Post hidden from public view." : "Post visible to public!");
    } catch (err) {
        showToast("Visibility status updated.");
    }
}

async function togglePostCommentsDisabled(postId, disabled) {
    const post = allPosts.find(p => p.id === postId);
    if (post) {
        post.commentsDisabled = disabled;
        renderPostsTable();
    }

    try {
        await updateAdminPostNodeRest(postId, { commentsDisabled: disabled });
        await db.ref(`community_posts/${postId}/commentsDisabled`).set(disabled).catch(() => {});
        showToast(disabled ? "Comments locked on post." : "Comments opened on post.");
    } catch (err) {
        showToast("Comments status updated.");
    }
}

function deletePost(postId) {
    if (!confirm("Are you sure you want to delete this community post and all its comments?")) return;

    db.ref(`community_posts/${postId}`).remove();
    db.ref(`community_comments/${postId}`).remove();
    db.ref(`community_likes/${postId}`).remove();
    showToast("Post and comments deleted.");
}

/* Post Comments Moderation Modal */
let activeInspectPostId = null;

function openPostCommentsModal(postId) {
    activeInspectPostId = postId;
    const post = allPosts.find(p => p.id === postId);
    document.getElementById('modalPostCommentsTitle').textContent = `Comments on "${post ? post.title : postId}"`;

    db.ref(`community_comments/${postId}`).on('value', snap => {
        const comments = [];
        if (snap.exists()) {
            snap.forEach(child => {
                const c = child.val() || {};
                c.id = child.key;
                comments.push(c);
            });
        }

        const listEl = document.getElementById('modalPostCommentsList');
        if (comments.length === 0) {
            listEl.innerHTML = '<div style="text-align:center; padding:30px; color:var(--md-sys-color-outline);">No comments posted on this post.</div>';
            return;
        }

        listEl.innerHTML = comments.map(c => `
            <div style="padding:12px 16px; background:var(--md-sys-color-surface-container-high); border-radius:var(--shape-medium); border:1px solid var(--md-sys-color-outline-variant); display:flex; align-items:center; justify-content:space-between; gap:12px;">
                <div>
                    <div style="font-weight:700; color:var(--md-sys-color-on-surface); font-size:0.88rem;">
                        ${escapeHtml(c.authorName || 'User')} ${c.parentCommentId ? '<span style="color:#82B1FF; font-size:0.75rem;">(Reply)</span>' : ''}
                    </div>
                    <div style="font-size:0.85rem; color:var(--md-sys-color-on-surface-variant); margin-top:2px;">${escapeHtml(c.text || '')}</div>
                    <div style="font-size:0.74rem; color:var(--md-sys-color-outline); font-family:var(--font-mono); margin-top:4px;">
                        ${new Date(c.timestamp || 0).toLocaleString()}
                    </div>
                </div>
                <button type="button" class="table-btn-action" style="color:var(--md-sys-color-error);" onclick="deletePostComment('${postId}', '${c.id}')">
                    <i class="ti ti-trash"></i> Delete
                </button>
            </div>
        `).join('');
    });

    document.getElementById('modalPostComments').style.display = 'flex';
}

function closePostCommentsModal() {
    if (activeInspectPostId) {
        db.ref(`community_comments/${activeInspectPostId}`).off();
        activeInspectPostId = null;
    }
    document.getElementById('modalPostComments').style.display = 'none';
}

function deletePostComment(postId, commentId) {
    db.ref(`community_comments/${postId}/${commentId}`).remove().then(() => {
        db.ref(`community_posts/${postId}/commentsCount`).setValue(firebase.database.ServerValue.increment(-1));
        showToast("Comment deleted.");
    });
}

/* ==========================================================
   10. TAB 6: SCHEDULED DELETIONS
   ========================================================== */
function renderScheduledDeletionsTable() {
    const tbody = document.getElementById('deletionsTableBody');
    const uids = Object.keys(allScheduledDeletions);

    if (uids.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: var(--md-sys-color-outline); padding: 30px;">No accounts currently scheduled for deletion.</td></tr>';
        return;
    }

    tbody.innerHTML = uids.map(uid => {
        const item = allScheduledDeletions[uid];
        const scheduledAtStr = item.scheduledAt ? new Date(item.scheduledAt).toLocaleDateString() : 'Unknown';
        const deleteAtStr = item.deleteAt ? new Date(item.deleteAt).toLocaleDateString() : 'Unknown';

        const remainingMs = (item.deleteAt || 0) - Date.now();
        const daysLeft = Math.max(0, Math.ceil(remainingMs / 86400000));

        return `
            <tr>
                <td>
                    <div style="font-weight: 700; color: var(--md-sys-color-on-surface);">${escapeHtml(item.username || 'User')}</div>
                    <div style="font-size: 0.78rem; color: var(--md-sys-color-outline); font-family: var(--font-mono);">${escapeHtml(item.email || '')} &bull; ${uid.substring(0, 8)}...</div>
                </td>
                <td>
                    <div style="font-size: 0.85rem; color: var(--md-sys-color-on-surface);">${escapeHtml(item.reason || 'No reason provided')}</div>
                    ${item.feedback ? `<div style="font-size: 0.76rem; color: var(--md-sys-color-outline); font-style: italic;">"${escapeHtml(item.feedback)}"</div>` : ''}
                </td>
                <td>
                    <span style="font-size: 0.8rem; color: var(--md-sys-color-outline);">${scheduledAtStr} &rarr; ${deleteAtStr}</span>
                </td>
                <td>
                    <span style="color: ${daysLeft <= 1 ? '#FF8A80' : '#FFD54F'}; font-weight: 800; font-size: 0.82rem;">${daysLeft} days remaining</span>
                </td>
                <td style="text-align: right;">
                    <div style="display: flex; align-items: center; justify-content: flex-end; gap: 6px;">
                        <button type="button" class="table-btn-action" onclick="cancelUserDeletion('${uid}')" title="Restore account & cancel deletion">
                            <i class="ti ti-rotate-clockwise"></i> Cancel
                        </button>
                        <button type="button" class="btn-danger" style="padding: 4px 10px; font-size: 0.75rem;" onclick="purgeUserImmediate('${uid}', '${escapeHtml(item.username || '')}')">
                            <i class="ti ti-trash"></i> Purge
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function cancelUserDeletion(uid) {
    db.ref(`scheduled_deletions/${uid}`).remove();
    db.ref(`users/${uid}/profile`).update({
        deletionScheduled: false,
        scheduledDeletionTimestamp: 0,
        restricted: false
    });
    showToast("Account deletion cancelled and restriction lifted.");
}

async function purgeUserImmediate(uid, username) {
    if (!confirm(`PERMANENTLY PURGE account ${uid} and all associated created posts/comments now?`)) return;

    showGlobalLoading(true, "Purging Account Data & Associated Posts...");

    try {
        await purgeUserAccountCascade(uid, username);
        showGlobalLoading(false);
        showToast("Account and all created content purged permanently.");
        syncScheduledDeletions();
    } catch (err) {
        showGlobalLoading(false);
        showToast(`Purge error: ${err.message}`, "error");
    }
}

/* ==========================================================
   11. GLOBAL HELPERS & TOAST ALERTS
   ========================================================== */
function showGlobalLoading(show, text = "Loading...") {
    const overlay = document.getElementById('globalLoadingOverlay');
    const label = document.getElementById('globalLoadingText');
    
    if (loadingTimeoutHandle) {
        clearTimeout(loadingTimeoutHandle);
        loadingTimeoutHandle = null;
    }

    if (overlay) {
        overlay.style.display = show ? 'flex' : 'none';
        if (label) label.textContent = text;
    }

    // Safety timeout: automatically dismiss spinner after 7 seconds if anything hangs
    if (show) {
        loadingTimeoutHandle = setTimeout(() => {
            if (overlay && overlay.style.display === 'flex') {
                overlay.style.display = 'none';
                console.warn("Loading spinner safety timeout triggered.");
            }
        }, 7000);
    }
}

function showToast(message, type = "success") {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `
        <i class="ti ti-${type === 'error' ? 'alert-circle' : 'circle-check'}" style="color: ${type === 'error' ? '#FFB4AB' : '#69F0AE'}; font-size: 1.2rem;"></i>
        <span>${escapeHtml(message)}</span>
    `;
    container.appendChild(toast);
    setTimeout(() => {
        if (container.contains(toast)) {
            container.removeChild(toast);
        }
    }, 3500);
}

function escapeHtml(text) {
    if (!text) return '';
    return String(text)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
