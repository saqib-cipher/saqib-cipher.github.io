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

/* ==========================================================
   4. THEME INITIALIZATION
   ========================================================== */
const themeToggleBtn = document.getElementById('themeToggleBtn');
const themeIcon = document.getElementById('themeIcon');

function initTheme() {
    const savedTheme = localStorage.getItem('sketchx_theme');
    if (savedTheme) {
        document.documentElement.setAttribute('data-theme', savedTheme);
        updateThemeIcon(savedTheme);
    } else {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const initialTheme = prefersDark ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', initialTheme);
        updateThemeIcon(initialTheme);
    }
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 
        (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
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
initTheme();

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
    document.getElementById('userNavChip').style.display = 'none';

    const deniedEmail = document.getElementById('deniedUserEmail');
    const deniedBadge = document.getElementById('deniedUserBadge');
    if (deniedEmail) deniedEmail.textContent = user.email || user.uid;
    if (deniedBadge) {
        const b = (profile.badge || 'None').toLowerCase();
        deniedBadge.className = `role-badge ${b}`;
        deniedBadge.textContent = profile.badge ? profile.badge.toUpperCase() : 'NO ROLE BADGE';
    }
}

function showDashboardView() {
    document.getElementById('viewAuth').style.display = 'none';
    document.getElementById('viewAccessDenied').style.display = 'none';
    document.getElementById('viewDashboard').style.display = 'block';
}

/* Auth Actions */
async function handleGoogleSignIn() {
    const provider = new firebase.auth.GoogleAuthProvider();
    provider.addScope('email');
    provider.addScope('profile');
    try {
        await auth.signInWithPopup(provider);
    } catch (err) {
        if (err.code !== 'auth/popup-closed-by-user') {
            showToast(err.message, 'error');
        }
    }
}

async function handleEmailSignIn(event) {
    event.preventDefault();
    const email = document.getElementById('loginEmail').value.trim();
    const pass = document.getElementById('loginPassword').value;

    if (!email || !pass) {
        showToast("Please enter email and password.", "error");
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

        // Sort: newest first or users with tokens first
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
            ? `<span class="token-badge active" title="${user.fcmToken}"><i class="ti ti-circle-check"></i> ${user.fcmToken.substring(0, 14)}...</span>`
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
            <td style="text-align:right;">
                ${user.fcmToken ? `
                    <button class="table-btn-action" onclick="selectUserForPush('${user.uid}')" title="Send notification to this user">
                        <i class="ti ti-send"></i> Push
                    </button>
                    <button class="table-btn-action" onclick="copyToClipboard('${user.fcmToken}', 'FCM Token Copied!')" title="Copy FCM Token">
                        <i class="ti ti-copy"></i>
                    </button>
                ` : `
                    <span style="font-size:0.75rem; color:var(--md-sys-color-outline);">Unavailable</span>
                `}
            </td>
        `;

        tbody.appendChild(tr);
    });
}

function selectUserForPush(uid) {
    const user = allUsersList.find(u => u.uid === uid);
    if (!user || !user.fcmToken) {
        showToast("Selected user does not have a registered FCM token.", "error");
        return;
    }

    // Switch to token mode
    setTargetMode('token');
    selectedRecipientUser = user;

    document.getElementById('inputRecipientToken').value = user.fcmToken;
    const badge = document.getElementById('selectedUserBadge');
    if (badge) {
        badge.innerHTML = `
            <span><i class="ti ti-user-check"></i> Recipient: <strong>${escapeHtml(user.displayName)}</strong> (${user.username ? '@' + escapeHtml(user.username) : user.uid.substring(0, 8)})</span>
            <button type="button" class="btn-remove-recipient" onclick="clearSelectedUser()" title="Clear selection"><i class="ti ti-x"></i></button>
        `;
        badge.classList.add('visible');
    }

    // Smooth scroll to composer
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
   ========================================================= */
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
    const title = document.getElementById('notifTitle').value || 'SketchX Notification';
    const body = document.getElementById('notifBody').value || 'Notification content preview will appear here...';
    const notifType = document.getElementById('notifType').value || 'general';
    const channel = document.getElementById('notifChannel').value || 'community_notifications';

    document.getElementById('previewTitle').textContent = title;
    document.getElementById('previewBody').textContent = body;
    document.getElementById('previewTypeBadge').textContent = `Type: ${notifType} • Channel: ${channel}`;

    // Target badge in preview header
    const previewTargetBadge = document.getElementById('previewTargetBadge');
    if (previewTargetBadge) {
        if (currentTargetMode === 'topic') {
            const topic = document.getElementById('inputTopicName').value.trim() || 'all';
            previewTargetBadge.textContent = `Target: Topic /topics/${topic}`;
        } else {
            const token = document.getElementById('inputRecipientToken').value.trim();
            previewTargetBadge.textContent = token ? `Target: Single Device (${token.substring(0, 10)}...)` : 'Target: Single Device (Unset)';
        }
    }

    // Update char counts
    document.getElementById('titleCharCount').textContent = `${document.getElementById('notifTitle').value.length}/80`;
    document.getElementById('bodyCharCount').textContent = `${document.getElementById('notifBody').value.length}/300`;
}

/* ==========================================================
   8. FCM HTTP V1 SIGNING & DISPATCH ENGINE
   ========================================================== */
async function getGoogleAccessToken() {
    const now = Math.floor(Date.now() / 1000);
    if (cachedOAuthToken && now < oauthTokenExpiry - 60) {
        return cachedOAuthToken;
    }

    if (typeof KJUR === 'undefined' || !KJUR.jws || !KJUR.jws.JWS) {
        throw new Error("JWT Crypto library (jsrsasign) is loading. Please try again in 2 seconds.");
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
    if (currentTargetMode === 'topic') {
        targetValue = document.getElementById('inputTopicName').value.trim() || 'all';
    } else {
        targetValue = document.getElementById('inputRecipientToken').value.trim();
        if (!targetValue) {
            showToast("Please select a recipient user or paste a valid FCM registration token.", "error");
            return;
        }
    }

    // Build Custom Data Payload
    const customData = {
        type: type,
        title: title,
        body: body,
        timestamp: String(Date.now())
    };
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

    const notifPayload = {
        title,
        body,
        imageUrl,
        channelId,
        customData
    };

    const sendBtn = document.getElementById('btnSubmitSend');
    sendBtn.disabled = true;
    sendBtn.innerHTML = `<i class="ti ti-loader ti-spin"></i> Dispatching Notification...`;

    try {
        const accessToken = await getGoogleAccessToken();
        const fcmUrl = `https://fcm.googleapis.com/v1/projects/${SERVICE_ACCOUNT.project_id}/messages:send`;

        const message = {
            notification: {
                title: title,
                body: body
            },
            data: customData,
            android: {
                priority: "high",
                notification: {
                    channel_id: channelId,
                    notification_priority: "PRIORITY_HIGH",
                    default_sound: true,
                    default_vibrate_timings: true
                }
            }
        };

        if (imageUrl) {
            message.notification.image = imageUrl;
            message.android.notification.image = imageUrl;
        }

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

        // Success
        const messageId = resData.name || "Sent successfully";
        showToast("Notification dispatched successfully! ID: " + messageId.split('/').pop(), "success");

        addDeliveryLog({
            status: 'success',
            targetType: currentTargetMode,
            target: currentTargetMode === 'topic' ? `/topics/${targetValue}` : (selectedRecipientUser ? selectedRecipientUser.displayName : targetValue.substring(0, 16) + '...'),
            title: title,
            messageId: messageId,
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

    // Set composer to test
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
   9. UTILITIES & TOAST ALERTS
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
        toast.style.transform = 'translateY(10px)';
        toast.style.transition = 'all 0.3s ease';
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

function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
