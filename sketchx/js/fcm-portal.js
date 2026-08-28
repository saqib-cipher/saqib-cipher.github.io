/**
 * SketchX FCM Notification Management Portal Controller
 * Full-featured administration console for broadcast and targeted push notifications.
 * Restricts access to authorized "admin" and "maintainer" badges only.
 */

/* ==========================================================
   1. FIREBASE CONFIGURATION
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

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const auth = firebase.auth();
const database = firebase.database();

/* ==========================================================
   2. SERVICE ACCOUNT CONFIGURATION FOR FCM HTTP V1 API
   ========================================================== */
const SERVICE_ACCOUNT = {
    project_id: "sketchx-88b8e",
    client_email: "firebase-adminsdk-fbsvc@sketchx-88b8e.iam.gserviceaccount.com",
    private_key: "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCqJja7tWgEisCs\nWz+mmZvO271m8c3CdqhvkxJLKcXNMqLIahzsqJa1y7gixh+VVkT76ygUO4VzTvrq\ndmNc+hkaJeHcKuCo8MqfqD99rCKymK84u+DVtjGyT2b5yklXZUatFT9xtXmQiWKG\n5bFViHn5I8XJmr02UAbwjK++yVhP/O2BfGC4tEhkesvyki+2pxS0vDTeNwsTBUBm\nkk2ZZj2VmxX9aPOZDZ96+V4YvJ54etpUSLLG9K6tuln508Z9IQP6dmSGOQ34Pede\n9tpk0oirog5npcC/eZeRLRah6FDjY6vgCBSvlFZwIHDZxMWWQA6/SgjI/DqzbZoI\nioHLUXlDAgMBAAECggEAKNxdd42Uicayh5GwQvePqckufnriQWmSgJzunztMY79d\nxUhqYtEHxGfEdCFlM01Q6rip2tYCcdMNQeIlcY4kGhnv2Bo58ohE+LuEZ88/U+mD\n5tmDoH8NBze3UJRqMYFCTE2We12r8HB1x1SA1jwcop6bIJO3DcSBLiJzEBu1SBve\nwpwoOJWh6bOQ4r6WZRYi4cTHXVDAysU2lU6LI68T4rgsZ56Cc1WRNuLMhF1zPvww\nto4BNoaYg9DT3MPJL78Wg8EeMvlRPEhZhXpJqHk7AolUsCMLfitmSNLkZm2IVQfT\nFbIRrnQt0f1cdgqT7du7zw7HXOSy5yJ6udTuEoivCQKBgQDUAD6nc9iD7c9CUgco\nz35B108MlIxnQPjEPLavyOeg4O3TleIgt13KcvM68u75X75A/gHvEL80OnH9vNGh\n5TCo+OKmMLcsVNRmSCfhIX18tZvMy6lXBQIoMfelOqkFgU4AksnhqU+PzBw7rEJv\nY6Vw5yLIvxdG7yUk5D94Yh/5KwKBgQDNdlxQewBwVtzQRdQyVHcnAnxKYzfh9KVp\nJf4gFXl4kxIStUuImyyS+fyAWSnKA1T3TxdtMXdpSH1iUfsTg4uRbRWFc2uDMGcw\nhvTayOJ+qdZ611o/oP74kAL1Un49MsPG4VELmIA5IAY3pMUJCJYucWaKtlwvJd0f\nHWK+7AxESQKBgELnGN6rdmacA85AKLY+VO/eTLoBnxVusZLsPhLXahGhKiydnlEI\nzPZ4tD2kMLpN9rJ39pBFTrHix9p1XgqjU2nfsVcVBJle4/CrULqBYSKcBWDp3LTz\nhay9qBNiobh1B/KyYDdwwQT2Ouqx//07CxjIOHf1phjim2w7A7Sv8rslAoGBAKwL\ntpV1yhJHyjNkpaFXdUbnH+iyWHMPBwubUsbO9J5wmKutwAgt2A9i4XsgLowIajeE\ntRssVs+EcenIuDPI7S/jZigPVDHQcDgEajhiCrcBxKWsetfZGmhNPwzp/OeGAMYi\nmljZZFVxaYNip9M+q3NMZg81UM/yJs0NMEirJEJxAoGASikF0qwvx0m5EjC5YM4M\nCD9DCNliQdisiLxamwYFR/hfSKE8QMRqrq0elcS/GsejVOfv+SwX4GL5h4Ck5Vcc\nvUHcKNDCr0G2p3tUYRSGDIHt8lI5xCQcM+LC50iSHD4AwVuxp55+aOeI1FKDPoo7\nmLlJnEh1Nm6lANRsUUDaSvM=\n-----END PRIVATE KEY-----\n"
};

/* ==========================================================
   3. APP STATE
   ========================================================== */
let currentUser = null;
let currentProfile = null;
let allUsersList = [];
let filteredUsersList = [];
let currentFilter = 'all';
let currentSearch = '';
let currentTargetMode = 'topic'; // 'topic' | 'token'
let selectedRecipientUser = null;
let sentLogs = [];

let cachedOAuthToken = null;
let oauthTokenExpiry = 0;

// Modal State
let activeModalUid = null;
let activeModalName = '';
let activeModalListener = null;

/* ==========================================================
   4. UNIFIED THEME CONTROLLER
   ========================================================== */
const themeToggleBtn = document.getElementById('themeToggleBtn');
const themeIcon = document.getElementById('themeIcon');

function initTheme() {
    const savedTheme = localStorage.getItem('sketchx_theme');
    if (savedTheme) {
        document.documentElement.setAttribute('data-theme', savedTheme);
        updateThemeIcon(savedTheme);
    } else {
        const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        const initialTheme = prefersDark ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', initialTheme);
        updateThemeIcon(initialTheme);
    }
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 
        (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    const newTheme = (currentTheme === 'dark') ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('sketchx_theme', newTheme);
    updateThemeIcon(newTheme);
}

function updateThemeIcon(theme) {
    if (!themeIcon) return;
    themeIcon.className = (theme === 'dark') ? 'ti ti-moon' : 'ti ti-sun';
}

if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', toggleTheme);
}

// Listen to system theme preference changes if user hasn't set explicit preference
if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
        if (!localStorage.getItem('sketchx_theme')) {
            const systemTheme = e.matches ? 'dark' : 'light';
            document.documentElement.setAttribute('data-theme', systemTheme);
            updateThemeIcon(systemTheme);
        }
    });
}

initTheme();

// Update live clock in status bar
function updateStatusBarClock() {
    const clockEl = document.getElementById('previewClock');
    if (clockEl) {
        const now = new Date();
        const hrs = String(now.getHours()).padStart(2, '0');
        const mins = String(now.getMinutes()).padStart(2, '0');
        clockEl.textContent = `${hrs}:${mins}`;
    }
}
setInterval(updateStatusBarClock, 30000);
updateStatusBarClock();

/* ==========================================================
   5. AUTHENTICATION & ACCESS CONTROL GATE
   ========================================================== */
auth.onAuthStateChanged(async (user) => {
    currentUser = user;
    if (user) {
        await verifyUserAuthorization(user);
    } else {
        showAuthView();
    }
});

async function handleGoogleSignIn() {
    const provider = new firebase.auth.GoogleAuthProvider();
    provider.addScope('email');
    provider.addScope('profile');
    try {
        showLoadingSpinner(true, "Signing in with Google...");
        await auth.signInWithPopup(provider);
    } catch (err) {
        console.error("Google Sign-In failed:", err);
        showToast(err.message || "Failed to sign in with Google.", 'error');
    } finally {
        showLoadingSpinner(false);
    }
}

async function handleEmailSignIn(event) {
    if (event) event.preventDefault();
    const email = document.getElementById('loginEmail').value.trim();
    const pass = document.getElementById('loginPassword').value;

    if (!email || !pass) {
        showToast("Please enter email and password.", 'error');
        return;
    }

    try {
        showLoadingSpinner(true, "Signing in...");
        await auth.signInWithEmailAndPassword(email, pass);
    } catch (err) {
        showToast(err.message, 'error');
    } finally {
        showLoadingSpinner(false);
    }
}

async function handleSignOut() {
    try {
        await auth.signOut();
        showToast("Signed out successfully", "info");
    } catch (err) {
        showToast(err.message, 'error');
    }
}

async function verifyUserAuthorization(user) {
    showLoadingSpinner(true, "Verifying Admin & Maintainer Authorization...");
    try {
        const snapshot = await database.ref(`users/${user.uid}/profile`).once('value');
        const profile = snapshot.val() || {};
        currentProfile = profile;
        currentProfile.uid = user.uid;

        const badge = (profile.badge || '').trim().toLowerCase();
        const isAuthorized = badge === 'admin' || badge === 'maintainer';

        if (isAuthorized) {
            showDashboardView();
            updateNavUserChip(user, profile);
            loadUsersDirectory();
        } else {
            showAccessDeniedView(user, profile);
        }
    } catch (error) {
        console.error("Error verifying authorization:", error);
        showToast("Error checking authorization: " + error.message, "error");
        showAccessDeniedView(user, { badge: 'none' });
    } finally {
        showLoadingSpinner(false);
    }
}

function updateNavUserChip(user, profile) {
    const navChip = document.getElementById('userNavChip');
    const navAvatar = document.getElementById('userNavAvatar');
    const navName = document.getElementById('userNavName');
    const navRoleBadge = document.getElementById('userNavRoleBadge');

    if (navChip && navAvatar && navName) {
        const displayName = profile.displayName || user.displayName || profile.username || "User";
        const initial = (displayName.replace('@', '').trim().charAt(0) || 'U').toUpperCase();

        navAvatar.textContent = initial;
        navName.textContent = displayName;
        
        if (navRoleBadge) {
            const badge = (profile.badge || 'Admin').toLowerCase();
            navRoleBadge.className = `role-badge ${badge}`;
            navRoleBadge.innerHTML = `<i class="ti ti-shield-check"></i> ${badge.toUpperCase()}`;
        }
        navChip.style.display = 'inline-flex';
    }
}

function showAuthView() {
    document.getElementById('viewAuth').style.display = 'block';
    document.getElementById('viewAccessDenied').style.display = 'none';
    document.getElementById('viewDashboard').style.display = 'none';
    document.getElementById('userNavChip').style.display = 'none';
}

function showAccessDeniedView(user, profile) {
    document.getElementById('viewAuth').style.display = 'none';
    document.getElementById('viewAccessDenied').style.display = 'block';
    document.getElementById('viewDashboard').style.display = 'none';
    document.getElementById('userNavChip').style.display = 'inline-flex';

    document.getElementById('deniedUserEmail').textContent = user.email || user.uid;
    const badgeEl = document.getElementById('deniedUserBadge');
    if (badgeEl) {
        const b = (profile.badge || 'none').toLowerCase();
        badgeEl.className = `role-badge ${b}`;
        badgeEl.textContent = profile.badge ? profile.badge.toUpperCase() : 'STANDARD USER';
    }
}

function showDashboardView() {
    document.getElementById('viewAuth').style.display = 'none';
    document.getElementById('viewAccessDenied').style.display = 'none';
    document.getElementById('viewDashboard').style.display = 'flex';
}

/* ==========================================================
   6. REALTIME USERS DIRECTORY & TOKEN LISTING
   ========================================================== */
function loadUsersDirectory() {
    const usersRef = database.ref('users');
    usersRef.on('value', (snapshot) => {
        const usersObj = snapshot.val() || {};
        allUsersList = [];

        let totalUsers = 0;
        let withTokens = 0;
        let adminMaintainers = 0;

        for (const uid in usersObj) {
            totalUsers++;
            const uData = usersObj[uid] || {};
            const profile = uData.profile || {};
            const fcmToken = uData.fcmToken || profile.fcmToken || null;
            const badge = (profile.badge || '').trim().toLowerCase();

            if (fcmToken) withTokens++;
            if (badge === 'admin' || badge === 'maintainer') adminMaintainers++;

            allUsersList.push({
                uid: uid,
                displayName: profile.displayName || (profile.username ? '@' + profile.username : 'User'),
                username: profile.username || '',
                email: profile.email || '',
                badge: profile.badge || '',
                fcmToken: fcmToken,
                createdAt: profile.createdAt || 0,
                photoUrl: profile.photoUrl || ''
            });
        }

        // Sort: users with tokens first, then newest
        allUsersList.sort((a, b) => {
            if (a.fcmToken && !b.fcmToken) return -1;
            if (!a.fcmToken && b.fcmToken) return 1;
            return b.createdAt - a.createdAt;
        });

        // Update Stats Cards
        document.getElementById('statTotalUsers').textContent = totalUsers;
        document.getElementById('statActiveTokens').textContent = withTokens;
        const percent = totalUsers > 0 ? Math.round((withTokens / totalUsers) * 100) : 0;
        document.getElementById('statTokenPercent').textContent = `${percent}% device coverage`;
        document.getElementById('statAdminCount').textContent = adminMaintainers;

        applyUserFilters();
    }, (error) => {
        console.error("Error loading users directory:", error);
        showToast("Failed to sync users directory: " + error.message, "error");
    });
}

function setDirectoryFilter(filterType) {
    currentFilter = filterType;
    document.querySelectorAll('.filter-chip-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.filter === filterType);
    });
    applyUserFilters();
}

function handleSearchUsers(query) {
    currentSearch = (query || '').trim().toLowerCase();
    applyUserFilters();
}

function applyUserFilters() {
    filteredUsersList = allUsersList.filter(user => {
        // Filter Type
        if (currentFilter === 'with_token' && !user.fcmToken) return false;
        if (currentFilter === 'staff') {
            const b = (user.badge || '').toLowerCase();
            if (b !== 'admin' && b !== 'maintainer') return false;
        }
        if (currentFilter === 'pro') {
            const b = (user.badge || '').toLowerCase();
            if (b !== 'pro') return false;
        }

        // Search Query
        if (currentSearch) {
            const matchName = user.displayName.toLowerCase().includes(currentSearch);
            const matchUser = user.username.toLowerCase().includes(currentSearch);
            const matchUid = user.uid.toLowerCase().includes(currentSearch);
            const matchEmail = user.email.toLowerCase().includes(currentSearch);
            const matchBadge = user.badge.toLowerCase().includes(currentSearch);
            const matchToken = user.fcmToken ? user.fcmToken.toLowerCase().includes(currentSearch) : false;
            return matchName || matchUser || matchUid || matchEmail || matchBadge || matchToken;
        }

        return true;
    });

    const userCountBadge = document.getElementById('userCountBadge');
    if (userCountBadge) {
        userCountBadge.textContent = `Showing ${filteredUsersList.length} of ${allUsersList.length} users`;
    }

    renderUsersTable();
}

function renderUsersTable() {
    const tbody = document.getElementById('usersTableBody');
    const emptyState = document.getElementById('usersEmptyState');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (filteredUsersList.length === 0) {
        if (emptyState) emptyState.style.display = 'block';
        return;
    }
    if (emptyState) emptyState.style.display = 'none';

    filteredUsersList.forEach(user => {
        const tr = document.createElement('tr');

        const initial = (user.displayName.replace('@', '').trim().charAt(0) || 'U').toUpperCase();
        const badgeKey = (user.badge || '').toLowerCase();
        const badgeTitle = user.badge ? user.badge.toUpperCase() : 'USER';
        const formattedDate = user.createdAt > 0 
            ? new Date(user.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
            : 'Unknown';

        const tokenBadgeHtml = user.fcmToken 
            ? `<div style="display:inline-flex; align-items:center; gap:6px;">
                <span class="token-badge active" title="${user.fcmToken}"><i class="ti ti-circle-check"></i> ${user.fcmToken.substring(0, 12)}...</span>
                <button class="table-btn-action" style="padding:3px 7px;" onclick="copyToClipboard('${user.fcmToken}', 'Token Copied!')" title="Copy full FCM Token"><i class="ti ti-copy"></i></button>
               </div>`
            : `<span class="token-badge missing"><i class="ti ti-circle-x"></i> No Token</span>`;

        tr.innerHTML = `
            <td>
                <div class="user-cell">
                    <div class="user-avatar-circle">${initial}</div>
                    <div class="user-names-col">
                        <span class="user-display-name">${escapeHtml(user.displayName)}</span>
                        <span class="user-handle">${user.username ? '@' + escapeHtml(user.username) : escapeHtml(user.email || user.uid.substring(0, 10))}</span>
                    </div>
                </div>
            </td>
            <td>
                <span class="role-badge ${badgeKey || 'none'}">${escapeHtml(badgeTitle)}</span>
            </td>
            <td>
                <span style="font-family:var(--font-mono); font-size:0.8rem; color:var(--md-sys-color-outline);" title="${user.uid}">
                    ${user.uid.substring(0, 8)}...
                </span>
                <button class="table-btn-action" style="padding:2px 6px; margin-left:4px;" onclick="copyToClipboard('${user.uid}', 'UID Copied!')" title="Copy UID">
                    <i class="ti ti-copy"></i>
                </button>
            </td>
            <td>${tokenBadgeHtml}</td>
            <td style="font-size:0.8rem; color:var(--md-sys-color-on-surface-variant);">${formattedDate}</td>
            <td style="text-align:right; white-space:nowrap;">
                <button class="table-btn-action" onclick="openUserNotificationsModal('${user.uid}', '${escapeHtml(user.displayName)}')" title="Inspect stored notifications in database">
                    <i class="ti ti-bell"></i> Inbox
                </button>
                <button class="table-btn-action" onclick="selectUserForPush('${user.uid}')" title="Send notification to this user">
                    <i class="ti ti-send"></i> Send
                </button>
            </td>
        `;

        tbody.appendChild(tr);
    });
}

function selectUserForPush(uid) {
    const user = allUsersList.find(u => u.uid === uid) || { uid: uid, displayName: activeModalName || 'User' };
    
    setTargetMode('token');
    selectedRecipientUser = user;

    if (user.fcmToken) {
        document.getElementById('inputRecipientToken').value = user.fcmToken;
    } else {
        document.getElementById('inputRecipientToken').value = '';
    }

    const badge = document.getElementById('selectedUserBadge');
    if (badge) {
        badge.innerHTML = `
            <span><i class="ti ti-user-check"></i> Recipient: <strong>${escapeHtml(user.displayName)}</strong> (${user.username ? '@' + escapeHtml(user.username) : user.uid.substring(0, 8)}) ${user.fcmToken ? '<span style="color:var(--md-sys-color-primary); font-size:0.75rem; font-weight:700;">(Device Push Ready)</span>' : '<span style="color:var(--md-sys-color-tertiary); font-size:0.75rem; font-weight:700;">(Inbox Database Only)</span>'}</span>
            <button type="button" class="btn-remove-recipient" onclick="clearSelectedUser()" title="Clear selection"><i class="ti ti-x"></i></button>
        `;
        badge.classList.add('visible');
    }

    document.getElementById('composerSection').scrollIntoView({ behavior: 'smooth' });
    showToast(`Recipient selected: ${user.displayName}`, 'info');
}

function clearSelectedUser() {
    selectedRecipientUser = null;
    document.getElementById('inputRecipientToken').value = '';
    const badge = document.getElementById('selectedUserBadge');
    if (badge) badge.classList.remove('visible');
}

/* ==========================================================
   7. NOTIFICATION COMPOSER & TARGET SWITCHER
   ========================================================== */
function setTargetMode(mode) {
    currentTargetMode = mode;
    document.querySelectorAll('.segment-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.mode === mode);
    });

    document.getElementById('groupTargetTopic').style.display = (mode === 'topic') ? 'block' : 'none';
    document.getElementById('groupTargetToken').style.display = (mode === 'token') ? 'block' : 'none';
    updatePreview();
}

function selectTopicPreset(topicName) {
    document.getElementById('inputTopicName').value = topicName;
    document.querySelectorAll('.topic-chip').forEach(chip => {
        chip.classList.toggle('selected', chip.dataset.topic === topicName);
    });
    updatePreview();
}

function toggleCollapsible(bodyId, iconId) {
    const body = document.getElementById(bodyId);
    const icon = document.getElementById(iconId);
    if (body) {
        const isOpen = body.classList.toggle('open');
        if (icon) icon.className = isOpen ? 'ti ti-chevron-up' : 'ti ti-chevron-down';
    }
}

/* Live Android Notification Preview */
function updatePreview() {
    const title = document.getElementById('notifTitle').value.trim() || 'SketchX Notification';
    const body = document.getElementById('notifBody').value.trim() || 'Notification content preview will appear here...';
    const notifType = document.getElementById('notifType').value || 'general';
    const channel = document.getElementById('notifChannel').value || 'community_notifications';
    const imageUrl = document.getElementById('notifImageUrl') ? document.getElementById('notifImageUrl').value.trim() : '';

    document.getElementById('previewTitle').textContent = title;
    document.getElementById('previewBody').textContent = body;
    document.getElementById('previewTypeBadge').textContent = `Type: ${notifType}`;
    
    const previewChannelBadge = document.getElementById('previewChannelBadge');
    if (previewChannelBadge) {
        previewChannelBadge.textContent = `Channel: ${channel}`;
    }

    // Dynamic Image Preview
    const previewImage = document.getElementById('previewImage');
    if (previewImage) {
        if (imageUrl) {
            previewImage.src = imageUrl;
            previewImage.classList.add('visible');
        } else {
            previewImage.src = '';
            previewImage.classList.remove('visible');
        }
    }

    const previewTargetBadge = document.getElementById('previewTargetBadge');
    if (previewTargetBadge) {
        if (currentTargetMode === 'topic') {
            const topic = document.getElementById('inputTopicName').value.trim() || 'all';
            previewTargetBadge.textContent = `Target: Topic /topics/${topic}`;
        } else {
            const token = document.getElementById('inputRecipientToken').value.trim();
            if (selectedRecipientUser) {
                previewTargetBadge.textContent = `Target: User @${selectedRecipientUser.username || selectedRecipientUser.displayName}`;
            } else {
                previewTargetBadge.textContent = token ? `Target: Single Device (${token.substring(0, 10)}...)` : 'Target: Single Device (Unset)';
            }
        }
    }

    document.getElementById('titleCharCount').textContent = `${document.getElementById('notifTitle').value.length}/80`;
    document.getElementById('bodyCharCount').textContent = `${document.getElementById('notifBody').value.length}/300`;
}

/* ==========================================================
   8. DISPATCH PUSH & SYNC TO DATABASE
   ========================================================== */
async function getGoogleAccessToken() {
    const now = Math.floor(Date.now() / 1000);
    if (cachedOAuthToken && oauthTokenExpiry > now + 60) {
        return cachedOAuthToken;
    }

    if (typeof KJUR === 'undefined' || !KJUR.jws || !KJUR.jws.JWS) {
        throw new Error("JWT Crypto library (jsrsasign) is loading. Please try again in a few seconds.");
    }

    const header = { alg: "RS256", typ: "JWT" };
    const claimSet = {
        iss: SERVICE_ACCOUNT.client_email,
        scope: "https://www.googleapis.com/auth/firebase.messaging",
        aud: "https://oauth2.googleapis.com/token",
        exp: now + 3600,
        iat: now
    };

    const sHeader = JSON.stringify(header);
    const sPayload = JSON.stringify(claimSet);
    const sJWT = KJUR.jws.JWS.sign(null, sHeader, sPayload, SERVICE_ACCOUNT.private_key);

    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
            grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
            assertion: sJWT
        })
    });

    if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        throw new Error("Failed to exchange service account JWT for access token: " + errorText);
    }

    const tokenData = await tokenResponse.json();
    cachedOAuthToken = tokenData.access_token;
    oauthTokenExpiry = now + (tokenData.expires_in || 3600);
    return cachedOAuthToken;
}

async function handleSendNotification(event) {
    if (event) event.preventDefault();

    const title = document.getElementById('notifTitle').value.trim();
    const body = document.getElementById('notifBody').value.trim();
    const imageUrl = document.getElementById('notifImageUrl').value.trim();
    const type = document.getElementById('notifType').value.trim() || 'general';
    const postId = document.getElementById('notifPostId').value.trim();
    const commentId = document.getElementById('notifCommentId').value.trim();
    const channelId = document.getElementById('notifChannel').value.trim() || 'community_notifications';
    const rawCustomData = document.getElementById('notifCustomJson').value.trim();

    if (!title || !body) {
        showToast("Please provide both a notification Title and Body.", "error");
        return;
    }

    let targetValue = '';
    let targetUid = null;

    if (currentTargetMode === 'topic') {
        targetValue = document.getElementById('inputTopicName').value.trim() || 'all';
    } else {
        targetValue = document.getElementById('inputRecipientToken').value.trim();
        if (selectedRecipientUser && selectedRecipientUser.uid) {
            targetUid = selectedRecipientUser.uid;
            if (!targetValue && selectedRecipientUser.fcmToken) {
                targetValue = selectedRecipientUser.fcmToken;
            }
        } else if (targetValue) {
            const matchUser = allUsersList.find(u => u.fcmToken === targetValue);
            if (matchUser) targetUid = matchUser.uid;
        } else {
            showToast("Please select a recipient user or paste a valid FCM registration token.", "error");
            return;
        }
    }

    // Build unique safe notification record
    const notifId = `${Date.now()}_${Math.floor(Math.random() * 10000)}`;
    const notifRecord = {
        id: notifId,
        title: title,
        body: body,
        type: type,
        postId: postId || null,
        commentId: commentId || null,
        timestamp: Date.now(),
        isRead: false
    };

    // Build Custom Data Payload for FCM (data-only for strict foreground vs background control)
    const customData = {
        id: notifId,
        type: type,
        title: title,
        body: body,
        timestamp: String(Date.now())
    };
    if (imageUrl) customData.imageUrl = imageUrl;
    if (targetUid) customData.recipientUid = targetUid;
    if (postId) customData.postId = postId;
    if (commentId) customData.commentId = commentId;

    if (rawCustomData) {
        try {
            const parsed = JSON.parse(rawCustomData);
            for (const k in parsed) {
                customData[k] = String(parsed[k]);
            }
        } catch (e) {
            showToast("Custom Data JSON is invalid. Please check syntax.", "error");
            return;
        }
    }

    const sendBtn = document.getElementById('btnSubmitSend');
    sendBtn.disabled = true;
    sendBtn.innerHTML = `<i class="ti ti-loader ti-spin"></i> Dispatching Notification...`;

    try {
        let messageId = null;

        // 1. Dispatch Push to FCM API (if target token or topic present)
        if (targetValue) {
            const accessToken = await getGoogleAccessToken();
            const fcmUrl = `https://fcm.googleapis.com/v1/projects/${SERVICE_ACCOUNT.project_id}/messages:send`;

            const message = {
                data: customData,
                android: {
                    priority: "high"
                }
            };

            if (currentTargetMode === 'topic') {
                message.topic = targetValue.replace(/^\/topics\//, "");
            } else {
                message.token = targetValue;
            }

            const response = await fetch(fcmUrl, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${accessToken}`,
                    "Content-Type": "application/json; UTF-8"
                },
                body: JSON.stringify({ message })
            });

            const resData = await response.json();
            if (!response.ok) {
                throw new Error(resData.error?.message || "Failed to dispatch message.");
            }
            messageId = resData.name;
        }

        // 2. STORE NOTIFICATION IN DATABASE (Realtime Database with isRead = false)
        try {
            if (currentTargetMode === 'token' && targetUid) {
                await database.ref(`users/${targetUid}/notifications/${notifId}`).set(notifRecord);
            } else if (currentTargetMode === 'topic') {
                const usersSnap = await database.ref('users').once('value');
                const usersVal = usersSnap.val() || {};
                const dbUpdates = {};
                for (const uKey in usersVal) {
                    const uItem = usersVal[uKey];
                    if (targetValue === 'auth' && (!uItem.profile || uItem.profile.isAnonymous)) continue;
                    dbUpdates[`users/${uKey}/notifications/${notifId}`] = notifRecord;
                }
                if (Object.keys(dbUpdates).length > 0) {
                    await database.ref().update(dbUpdates);
                }
            }
        } catch (dbErr) {
            console.warn("Notification sent via FCM, but database sync encountered notice:", dbErr);
        }

        // Success
        if (targetValue) {
            showToast("Push notification dispatched & saved to user inbox!", "success");
        } else {
            showToast("Notification saved to user inbox! (Push skipped: user has no registered device token)", "success");
        }

        addDeliveryLog({
            status: 'success',
            targetType: currentTargetMode,
            target: currentTargetMode === 'topic' ? `/topics/${targetValue}` : (selectedRecipientUser ? selectedRecipientUser.displayName : targetValue.substring(0, 16) + '...'),
            title: title,
            messageId: messageId || "Database Inbox Only",
            time: new Date().toLocaleTimeString()
        });
    } catch (err) {
        console.error("FCM Send Error:", err);
        showToast("Error sending notification: " + err.message, "error");
        addDeliveryLog({
            status: 'error',
            targetType: currentTargetMode,
            target: currentTargetMode === 'topic' ? `/topics/${targetValue}` : targetValue.substring(0, 16) + '...',
            title: title,
            error: err.message,
            time: new Date().toLocaleTimeString()
        });
    } finally {
        sendBtn.disabled = false;
        sendBtn.innerHTML = `<i class="ti ti-send"></i> Send Notification Now`;
    }
}

/* Send Test Notification to Signed in Admin */
async function sendTestToSelf() {
    if (!currentUser || !currentProfile) {
        showToast("Please sign in first.", "error");
        return;
    }

    const selfSnapshot = await database.ref(`users/${currentUser.uid}/fcmToken`).once('value');
    const myToken = selfSnapshot.val();

    if (!myToken) {
        showToast("Your current admin account has no FCM token registered on this device. Log in via the Android app once to register token.", "error");
        return;
    }

    document.getElementById('notifTitle').value = "SketchX Admin Test Notification";
    document.getElementById('notifBody').value = "This is a real-time test notification sent directly to your registered device.";
    document.getElementById('notifType').value = "announcement";
    setTargetMode('token');
    document.getElementById('inputRecipientToken').value = myToken;

    updatePreview();
    handleSendNotification();
}

function addDeliveryLog(logEntry) {
    sentLogs.unshift(logEntry);
    renderLogsList();
}

function renderLogsList() {
    const container = document.getElementById('sentLogsList');
    if (!container) return;

    if (sentLogs.length === 0) {
        container.innerHTML = `<div style="text-align:center; padding:20px; font-size:0.85rem; color:var(--md-sys-color-outline);">No notifications sent in this session yet.</div>`;
        return;
    }

    container.innerHTML = sentLogs.map(log => `
        <div class="log-item">
            <div class="log-header">
                <span class="log-status-pill ${log.status}">${log.status === 'success' ? 'DELIVERED' : 'FAILED'}</span>
                <span class="log-time">${escapeHtml(log.time)}</span>
            </div>
            <div class="log-title">${escapeHtml(log.title)}</div>
            <div class="log-target">Target: ${escapeHtml(log.target)}</div>
            ${log.messageId ? `<div style="font-size:0.72rem; color:var(--md-sys-color-outline); font-family:var(--font-mono);">${escapeHtml(log.messageId)}</div>` : ''}
            ${log.error ? `<div style="font-size:0.75rem; color:var(--md-sys-color-error);">${escapeHtml(log.error)}</div>` : ''}
        </div>
    `).join('');
}

/* ==========================================================
   9. USER NOTIFICATIONS DATABASE INSPECTOR MODAL
   ========================================================== */
function openUserNotificationsModal(uid, displayName) {
    activeModalUid = uid;
    activeModalName = displayName || 'User';

    const modal = document.getElementById('modalUserNotifications');
    if (!modal) return;

    const initial = (activeModalName.replace('@', '').trim().charAt(0) || 'U').toUpperCase();
    document.getElementById('modalUserAvatar').textContent = initial;
    document.getElementById('modalUserName').textContent = `${activeModalName}'s Notifications`;
    document.getElementById('modalUserUid').textContent = uid;

    modal.style.display = 'flex';

    // Attach Realtime listener to user's notifications in database
    const notifsRef = database.ref(`users/${uid}/notifications`);
    if (activeModalListener) {
        notifsRef.off('value', activeModalListener);
    }

    activeModalListener = notifsRef.on('value', (snapshot) => {
        const notifsObj = snapshot.val() || {};
        renderModalNotifications(notifsObj);
    }, (err) => {
        showToast("Error loading notifications from database: " + err.message, "error");
    });
}

function closeUserNotificationsModal() {
    const modal = document.getElementById('modalUserNotifications');
    if (modal) modal.style.display = 'none';

    if (activeModalUid && activeModalListener) {
        database.ref(`users/${activeModalUid}/notifications`).off('value', activeModalListener);
        activeModalListener = null;
    }
    activeModalUid = null;
}

// Modal keyboard & backdrop dismiss
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeUserNotificationsModal();
    }
});

const modalOverlay = document.getElementById('modalUserNotifications');
if (modalOverlay) {
    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) {
            closeUserNotificationsModal();
        }
    });
}

function renderModalNotifications(notifsObj) {
    const container = document.getElementById('modalNotifsList');
    if (!container) return;

    const notifs = [];
    let unreadCount = 0;

    for (const key in notifsObj) {
        const item = notifsObj[key];
        if (item) {
            item.id = item.id || key;
            if (!item.isRead) unreadCount++;
            notifs.push(item);
        }
    }

    // Sort newest first
    notifs.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

    document.getElementById('modalTotalNotifs').textContent = notifs.length;
    document.getElementById('modalUnreadNotifs').textContent = unreadCount;

    if (notifs.length === 0) {
        container.innerHTML = `
            <div style="text-align:center; padding:40px 20px; color:var(--md-sys-color-outline);">
                <i class="ti ti-bell-off" style="font-size:2.5rem; display:block; margin-bottom:8px;"></i>
                <span style="font-weight:600;">No notifications stored in database for this user.</span>
            </div>
        `;
        return;
    }

    container.innerHTML = notifs.map(item => {
        const timeAgo = formatTimeAgo(item.timestamp || Date.now());
        const isRead = !!item.isRead;
        return `
            <div class="modal-notif-item ${isRead ? 'read' : 'unread'}" id="notifItem_${escapeHtml(item.id)}">
                <div class="modal-notif-header">
                    <span class="modal-notif-title">${escapeHtml(item.title || 'Notification')}</span>
                    <span class="modal-notif-time">${timeAgo}</span>
                </div>
                <div class="modal-notif-body">${escapeHtml(item.body || '')}</div>
                <div class="modal-notif-footer">
                    <span class="read-status-chip ${isRead ? 'read' : 'unread'}" onclick="toggleNotificationReadState('${escapeHtml(item.id)}', ${!isRead})" title="Click to toggle read/unread state in database">
                        <i class="ti ${isRead ? 'ti-check' : 'ti-point-filled'}"></i> ${isRead ? 'READ' : 'UNREAD (Click to mark read)'}
                    </span>
                    <button type="button" class="table-btn-action" style="color:var(--md-sys-color-error);" onclick="deleteNotificationItem('${escapeHtml(item.id)}')">
                        <i class="ti ti-trash"></i> Delete
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

async function toggleNotificationReadState(notifId, newReadState) {
    if (!activeModalUid) return;
    try {
        await database.ref(`users/${activeModalUid}/notifications/${notifId}/isRead`).set(newReadState);
        showToast(newReadState ? "Marked as read in database" : "Marked as unread in database", "info");
    } catch (err) {
        showToast("Failed to update status: " + err.message, "error");
    }
}

async function deleteNotificationItem(notifId) {
    if (!activeModalUid) return;
    try {
        await database.ref(`users/${activeModalUid}/notifications/${notifId}`).remove();
        showToast("Notification removed from database.", "info");
    } catch (err) {
        showToast("Failed to delete notification: " + err.message, "error");
    }
}

async function modalMarkAllRead() {
    if (!activeModalUid) return;
    try {
        const snap = await database.ref(`users/${activeModalUid}/notifications`).once('value');
        const notifs = snap.val() || {};
        const updates = {};
        for (const k in notifs) {
            updates[`users/${activeModalUid}/notifications/${k}/isRead`] = true;
        }
        if (Object.keys(updates).length > 0) {
            await database.ref().update(updates);
            showToast("All notifications marked as read in database.", "success");
        }
    } catch (err) {
        showToast("Failed to mark all as read: " + err.message, "error");
    }
}

async function modalMarkAllUnread() {
    if (!activeModalUid) return;
    try {
        const snap = await database.ref(`users/${activeModalUid}/notifications`).once('value');
        const notifs = snap.val() || {};
        const updates = {};
        for (const k in notifs) {
            updates[`users/${activeModalUid}/notifications/${k}/isRead`] = false;
        }
        if (Object.keys(updates).length > 0) {
            await database.ref().update(updates);
            showToast("All notifications marked as unread in database.", "info");
        }
    } catch (err) {
        showToast("Failed to mark all as unread: " + err.message, "error");
    }
}

async function modalClearAll() {
    if (!activeModalUid) return;
    if (!confirm("Are you sure you want to permanently delete all notifications stored for this user?")) return;
    try {
        await database.ref(`users/${activeModalUid}/notifications`).remove();
        showToast("All notifications cleared from database.", "success");
    } catch (err) {
        showToast("Failed to clear notifications: " + err.message, "error");
    }
}

function modalPushShortcut() {
    if (!activeModalUid) return;
    closeUserNotificationsModal();
    selectUserForPush(activeModalUid);
}

/* ==========================================================
   10. UTILITIES & TOAST ALERTS
   ========================================================== */
function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'm3-toast';
    
    let icon = 'ti-info-circle';
    if (type === 'success') icon = 'ti-circle-check';
    if (type === 'error') icon = 'ti-alert-triangle';

    toast.innerHTML = `<i class="ti ${icon}"></i> <span>${escapeHtml(message)}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(10px) scale(0.95)';
        toast.style.transition = 'all 0.3s cubic-bezier(0.2, 0, 0, 1)';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

function showLoadingSpinner(show, text = 'Loading...') {
    const overlay = document.getElementById('globalLoadingOverlay');
    const loadingText = document.getElementById('globalLoadingText');
    if (overlay) {
        overlay.style.display = show ? 'flex' : 'none';
        if (loadingText) loadingText.textContent = text;
    }
}

function copyToClipboard(text, successMsg = 'Copied to clipboard!') {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
        showToast(successMsg, 'success');
    }).catch(() => {
        showToast("Failed to copy.", 'error');
    });
}

function formatTimeAgo(timestamp) {
    if (!timestamp || timestamp <= 0) return 'Just now';
    const now = Date.now();
    const diff = now - timestamp;
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return `${Math.floor(diff / 86400000)}d ago`;
}

function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
