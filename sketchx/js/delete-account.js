/**
 * SketchX Account Deletion Request Portal Logic
 * Handles Firebase Authentication, Profile Fetching, RTDB Deletion Request Storage, and Telegram Bot Dispatch.
 */

/* ==========================================================
   1. FIREBASE CONFIGURATION & INITIALIZATION
   (From sketchx/google-services.json)
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
   2. TELEGRAM CONFIGURATION
   ========================================================== */
const TELEGRAM_BOT_TOKEN = "7040449048:AAFAqtwevsTiTmNwjzIi6b1oVTzQnh75l8w";
// Group link: https://t.me/+jCNEWNFKYlxiNjdl
let TELEGRAM_CHAT_ID = "-1002360521717";

/* ==========================================================
   3. APP STATE
   ========================================================== */
let currentUser = null;
let userProfileData = null;

/* ==========================================================
   4. THEME CONTROLLER
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
        updateThemeIcon(prefersDark ? 'dark' : 'light');
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
    if (theme === 'dark') {
        themeIcon.className = 'ti ti-moon';
    } else {
        themeIcon.className = 'ti ti-sun';
    }
}

if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', toggleTheme);
}
initTheme();

/* ==========================================================
   5. PASSWORD VISIBILITY TOGGLE
   ========================================================== */
const togglePasswordBtn = document.getElementById('togglePasswordBtn');
const loginPasswordInput = document.getElementById('loginPassword');
const passwordEyeIcon = document.getElementById('passwordEyeIcon');

if (togglePasswordBtn && loginPasswordInput && passwordEyeIcon) {
    togglePasswordBtn.addEventListener('click', () => {
        const isPassword = loginPasswordInput.type === 'password';
        loginPasswordInput.type = isPassword ? 'text' : 'password';
        passwordEyeIcon.className = isPassword ? 'ti ti-eye-off' : 'ti ti-eye';
    });
}

/* ==========================================================
   6. AUTHENTICATION HANDLERS
   ========================================================== */

// Auth State Listener
auth.onAuthStateChanged(async (user) => {
    if (user) {
        currentUser = user;
        await loadUserProfile(user);
        switchView(2);
    } else {
        currentUser = null;
        userProfileData = null;
        switchView(1);
    }
});

// Google Sign In
const googleSignInBtn = document.getElementById('googleSignInBtn');
if (googleSignInBtn) {
    googleSignInBtn.addEventListener('click', async () => {
        hideAlert();
        const originalContent = googleSignInBtn.innerHTML;
        googleSignInBtn.innerHTML = `<div class="spinner" style="border-top-color:var(--md-sys-color-primary); border-color:rgba(0,0,0,0.15)"></div><span>Connecting to Google...</span>`;
        googleSignInBtn.disabled = true;

        const provider = new firebase.auth.GoogleAuthProvider();
        provider.addScope('email');
        provider.addScope('profile');

        try {
            await auth.signInWithPopup(provider);
            showSnackbar('Signed in with Google successfully!', 'success');
        } catch (error) {
            console.error('Google Sign In Error:', error);
            googleSignInBtn.innerHTML = originalContent;
            googleSignInBtn.disabled = false;
            if (error.code !== 'auth/popup-closed-by-user') {
                showAlert('Google Sign-In Failed: ' + (error.message || 'Please try again or use email login.'), 'error');
            }
        }
    });
}

// Email & Password Sign In
async function handleEmailPasswordLogin(event) {
    event.preventDefault();
    hideAlert();

    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    const submitBtn = document.getElementById('emailSignInBtn');
    const btnText = document.getElementById('signInBtnText');

    if (!email || !password) {
        showAlert('Please enter both your email address and password.', 'warning');
        return;
    }

    submitBtn.disabled = true;
    btnText.innerHTML = `<div class="spinner"></div> Signing In...`;

    try {
        await auth.signInWithEmailAndPassword(email, password);
        showSnackbar('Logged in successfully!', 'success');
    } catch (error) {
        console.error('Email Login Error:', error);
        submitBtn.disabled = false;
        btnText.innerHTML = `Sign In & Review Account`;

        let errorMsg = 'Failed to sign in. Please verify your credentials.';
        if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
            errorMsg = 'Invalid email or password. Please check your credentials or reset your password.';
        } else if (error.code === 'auth/too-many-requests') {
            errorMsg = 'Too many failed login attempts. Please wait a moment and try again or reset your password.';
        } else if (error.code === 'auth/network-request-failed') {
            errorMsg = 'Network error. Please check your internet connection.';
        }
        showAlert(errorMsg, 'error');
    }
}

// Password Reset
async function handleForgotPassword() {
    const email = document.getElementById('loginEmail').value.trim();
    if (!email) {
        showAlert('Please enter your email address in the field above first, then click "Forgot password?".', 'info');
        document.getElementById('loginEmail').focus();
        return;
    }

    try {
        await auth.sendPasswordResetEmail(email);
        showAlert(`Password reset email has been sent to ${email}. Check your inbox!`, 'success');
        showSnackbar('Reset email sent!', 'success');
    } catch (error) {
        console.error('Reset password error:', error);
        showAlert('Could not send reset email: ' + error.message, 'error');
    }
}

// Sign Out
async function handleSignOut() {
    try {
        await auth.signOut();
        showSnackbar('Signed out.', 'info');
    } catch (e) {
        console.error(e);
    }
}

function handleSignOutAndFinish() {
    auth.signOut().then(() => {
        window.location.href = 'privacy_policy.html';
    });
}

/* ==========================================================
   7. LOAD USER PROFILE & REALTIME DATABASE DATA
   ========================================================== */
async function loadUserProfile(user) {
    // UI Defaults
    const displayName = user.displayName || 'SketchX Developer';
    const email = user.email || 'No email provided';
    const photoURL = user.photoURL;
    const uid = user.uid;
    
    document.getElementById('userDisplayName').textContent = displayName;
    document.getElementById('userEmailText').textContent = email;
    document.getElementById('userUidText').textContent = uid;
    document.getElementById('modalUserEmail').textContent = email;

    // Creation Date
    const createdAt = user.metadata.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString(undefined, {
        year: 'numeric', month: 'short', day: 'numeric'
    }) : 'Unknown';
    document.getElementById('userCreatedDate').textContent = createdAt;

    // Auth Providers
    const providers = user.providerData.map(p => {
        if (p.providerId === 'google.com') return 'Google';
        if (p.providerId === 'password') return 'Email/Password';
        return p.providerId;
    }).join(', ') || 'Custom';
    document.getElementById('userAuthMethod').textContent = providers;

    // Avatar
    const avatarImg = document.getElementById('userAvatarImg');
    const avatarInitials = document.getElementById('avatarInitials');

    if (photoURL) {
        avatarImg.src = photoURL;
        avatarImg.style.display = 'block';
        avatarInitials.style.display = 'none';
    } else {
        avatarImg.style.display = 'none';
        avatarInitials.style.display = 'block';
        avatarInitials.textContent = displayName.charAt(0).toUpperCase() || 'U';
    }

    // Email Verified Status
    const emailVerifiedBadge = document.getElementById('emailVerifiedBadge');
    if (user.emailVerified) {
        emailVerifiedBadge.innerHTML = `<i class="ti ti-circle-check-filled" style="color:var(--md-sys-color-success);" title="Email Verified"></i>`;
    } else {
        emailVerifiedBadge.innerHTML = `<i class="ti ti-alert-circle-filled" style="color:var(--md-sys-color-warning);" title="Email Unverified"></i>`;
    }

    // Fetch RTDB profile at `users/{uid}/profile`
    try {
        const snapshot = await database.ref(`users/${uid}/profile`).once('value');
        if (snapshot.exists()) {
            userProfileData = snapshot.val();
            if (userProfileData.username) {
                document.getElementById('userUsername').textContent = '@' + userProfileData.username;
            }
            if (userProfileData.displayName) {
                document.getElementById('userDisplayName').textContent = userProfileData.displayName;
            }
            if (userProfileData.badge) {
                const badgeElem = document.getElementById('userBadge');
                badgeElem.textContent = userProfileData.badge;
                if (userProfileData.badge.toLowerCase() === 'admin') {
                    badgeElem.className = 'badge-chip badge-admin';
                } else if (userProfileData.badge.toLowerCase().includes('vip') || userProfileData.badge.toLowerCase().includes('pro')) {
                    badgeElem.className = 'badge-chip badge-vip';
                } else {
                    badgeElem.className = 'badge-chip badge-user';
                }
            }
            if (userProfileData.deletionScheduled) {
                document.getElementById('alreadyPendingNotice').style.display = 'flex';
            } else {
                document.getElementById('alreadyPendingNotice').style.display = 'none';
            }
        } else {
            document.getElementById('userUsername').textContent = '@' + (user.email ? user.email.split('@')[0] : 'user');
        }
    } catch (dbErr) {
        console.warn('Could not read user profile from database:', dbErr);
        document.getElementById('userUsername').textContent = '@' + (user.email ? user.email.split('@')[0] : 'user');
    }
}

/* ==========================================================
   8. REASON SELECTION & SAFETY CONFIRMATION
   ========================================================== */
function selectReason(element) {
    document.querySelectorAll('.reason-option').forEach(el => el.classList.remove('selected'));
    element.classList.add('selected');
    const radio = element.querySelector('input[type="radio"]');
    if (radio) radio.checked = true;
}

function toggleSubmitButton() {
    const checkbox = document.getElementById('confirmCheckbox');
    const submitBtn = document.getElementById('submitDeleteBtn');
    submitBtn.disabled = !checkbox.checked;
}

function openConfirmationModal() {
    document.getElementById('confirmModal').classList.add('show');
}

function closeConfirmationModal() {
    document.getElementById('confirmModal').classList.remove('show');
}

/* ==========================================================
   9. EXECUTE DELETION REQUEST & TELEGRAM DISPATCH
   ========================================================== */
async function executeDeletionRequest() {
    if (!currentUser) return;

    const finalBtn = document.getElementById('finalConfirmDeleteBtn');
    finalBtn.disabled = true;
    finalBtn.innerHTML = `<div class="spinner"></div> Submitting...`;

    const selectedRadio = document.querySelector('input[name="deleteReason"]:checked');
    const reasonText = selectedRadio ? selectedRadio.value : 'Not specified';
    const feedbackText = document.getElementById('additionalFeedback').value.trim();
    const requestId = 'DEL-' + Math.random().toString(36).substring(2, 9).toUpperCase();
    const timestamp = Date.now();
    const timestampIso = new Date(timestamp).toISOString();
    const scheduledDateIso = new Date(timestamp + 30 * 24 * 60 * 60 * 1000).toISOString();

    const deletionPayload = {
        requestId: requestId,
        uid: currentUser.uid,
        email: currentUser.email || 'N/A',
        displayName: (userProfileData && userProfileData.displayName) || currentUser.displayName || 'Unknown',
        username: (userProfileData && userProfileData.username) || '',
        badge: (userProfileData && userProfileData.badge) || 'user',
        reason: reasonText,
        additionalFeedback: feedbackText,
        requestedAtTimestamp: timestamp,
        requestedAtIso: timestampIso,
        scheduledPurgeDate: scheduledDateIso,
        status: 'pending_deletion',
        authProviders: currentUser.providerData.map(p => p.providerId).join(', '),
        userAgent: navigator.userAgent
    };

    // 1. Store Request Separately in Firebase Realtime Database
    try {
        await database.ref(`deletion_requests/${currentUser.uid}`).set(deletionPayload);
        console.log('Deletion request stored in deletion_requests/' + currentUser.uid);

        // Also update flag in user profile if accessible
        try {
            await database.ref(`users/${currentUser.uid}/profile`).update({
                deletionScheduled: true,
                scheduledDeletionTimestamp: timestamp,
                deletionRequestId: requestId
            });
        } catch (pErr) {
            console.warn('Could not update profile node flag:', pErr);
        }
    } catch (dbError) {
        console.error('Failed to write to Firebase Realtime Database:', dbError);
        showAlert('Warning: Request saved locally, but database sync encountered an error: ' + dbError.message, 'warning');
    }

    // 2. Dispatch Alert to Telegram Bot
    let telegramSent = false;
    try {
        telegramSent = await sendTelegramDeletionNotification(deletionPayload);
    } catch (tgErr) {
        console.warn('Telegram notification failed:', tgErr);
    }

    // 3. Update UI to Step 4 Success View
    closeConfirmationModal();
    
    document.getElementById('receiptRequestId').textContent = requestId;
    document.getElementById('receiptEmail').textContent = currentUser.email || 'N/A';
    document.getElementById('receiptUid').textContent = currentUser.uid;
    document.getElementById('receiptReason').textContent = reasonText;
    document.getElementById('receiptDate').textContent = new Date(timestamp).toLocaleString();
    document.getElementById('receiptTgStatus').textContent = telegramSent ? 'Dispatched to Admin Bot' : 'Logged in System';

    switchView(4);
    showSnackbar('Account deletion request submitted successfully.', 'success');
}

// Telegram Bot Notification Dispatcher
async function sendTelegramDeletionNotification(data) {
    if (!TELEGRAM_BOT_TOKEN) return false;

    const tgMessage = `🚨 <b>SKETCHX ACCOUNT DELETION REQUEST</b>\n` +
        `━━━━━━━━━━━━━━━━━━━━━━\n` +
        `🆔 <b>Request ID:</b> <code>${data.requestId}</code>\n` +
        `👤 <b>Display Name:</b> <code>${escapeHtml(data.displayName)}</code>\n` +
        `🏷️ <b>Username:</b> <code>${data.username ? '@' + escapeHtml(data.username) : 'N/A'}</code>\n` +
        `📧 <b>Email:</b> <code>${escapeHtml(data.email)}</code>\n` +
        `🔑 <b>UID:</b> <code>${data.uid}</code>\n` +
        `🎖️ <b>Badge:</b> ${escapeHtml(data.badge)}\n` +
        `🔐 <b>Auth Method:</b> ${escapeHtml(data.authProviders)}\n` +
        `⏰ <b>Requested At:</b> ${data.requestedAtIso}\n` +
        `🗓️ <b>Purge Date:</b> ${data.scheduledPurgeDate}\n\n` +
        `❓ <b>Reason:</b>\n👉 <i>${escapeHtml(data.reason)}</i>\n\n` +
        (data.additionalFeedback ? `📝 <b>User Feedback:</b>\n💬 <i>${escapeHtml(data.additionalFeedback)}</i>\n\n` : '') +
        `━━━━━━━━━━━━━━━━━━━━━━\n` +
        `⚠️ <i>Action: Stored in Firebase node: deletion_requests/${data.uid}</i>`;

    try {
        const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                chat_id: TELEGRAM_CHAT_ID,
                text: tgMessage,
                parse_mode: 'HTML'
            })
        });

        const result = await response.json();
        if (result.ok) {
            console.log('Telegram notification sent successfully to group:', result);
            return true;
        } else {
            console.warn('Telegram response not OK:', result);
            return false;
        }
    } catch (e) {
        console.error('Error dispatching telegram message:', e);
        return false;
    }
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

/* ==========================================================
   10. VIEW & STEP NAVIGATION CONTROLLER
   ========================================================== */
function switchView(step) {
    const view1 = document.getElementById('viewStep1');
    const view2 = document.getElementById('viewStep2');
    const view4 = document.getElementById('viewStep4');
    const stepper = document.getElementById('stepper');
    const ind1 = document.getElementById('stepIndicator1');
    const ind2 = document.getElementById('stepIndicator2');
    const ind3 = document.getElementById('stepIndicator3');

    if (step === 1) {
        view1.style.display = 'block';
        view2.style.display = 'none';
        view4.style.display = 'none';
        stepper.style.display = 'flex';

        ind1.className = 'step-item active';
        ind2.className = 'step-item';
        ind3.className = 'step-item';
    } else if (step === 2) {
        view1.style.display = 'none';
        view2.style.display = 'block';
        view4.style.display = 'none';
        stepper.style.display = 'flex';

        ind1.className = 'step-item completed';
        ind2.className = 'step-item active';
        ind3.className = 'step-item active';
    } else if (step === 4) {
        view1.style.display = 'none';
        view2.style.display = 'none';
        view4.style.display = 'block';
        stepper.style.display = 'none';
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ==========================================================
   11. UTILITIES: SNACKBAR & ALERTS
   ========================================================== */
function showAlert(message, type = 'error') {
    const globalAlert = document.getElementById('globalAlert');
    if (!globalAlert) return;

    let iconClass = 'ti-alert-circle';
    if (type === 'success') iconClass = 'ti-check';
    if (type === 'warning') iconClass = 'ti-alert-triangle';
    if (type === 'info') iconClass = 'ti-info-circle';

    globalAlert.className = `m3-alert m3-alert-${type}`;
    globalAlert.innerHTML = `<i class="ti ${iconClass}"></i><div>${message}</div>`;
    globalAlert.style.display = 'flex';
    globalAlert.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function hideAlert() {
    const globalAlert = document.getElementById('globalAlert');
    if (globalAlert) globalAlert.style.display = 'none';
}

let snackbarTimer = null;
function showSnackbar(text, type = 'info') {
    const snackbar = document.getElementById('snackbar');
    const snackText = document.getElementById('snackText');
    const snackIcon = document.getElementById('snackIcon');
    if (!snackbar || !snackText) return;

    snackText.textContent = text;
    if (snackIcon) {
        if (type === 'success') snackIcon.className = 'ti ti-circle-check';
        else if (type === 'error') snackIcon.className = 'ti ti-alert-circle';
        else snackIcon.className = 'ti ti-info-circle';
    }

    snackbar.classList.add('show');
    if (snackbarTimer) clearTimeout(snackbarTimer);
    snackbarTimer = setTimeout(() => {
        snackbar.classList.remove('show');
    }, 4000);
}

function copyUidToClipboard() {
    if (!currentUser) return;
    navigator.clipboard.writeText(currentUser.uid).then(() => {
        showSnackbar('Account UID copied to clipboard!', 'success');
    }).catch(() => {
        showSnackbar('Failed to copy UID.', 'error');
    });
}
