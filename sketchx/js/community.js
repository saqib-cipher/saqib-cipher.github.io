/**
 * SketchX - Community Page Controller
 * Firebase Realtime Database Stream, Filter & Search
 */

const firebaseConfig = {
    apiKey: "AIzaSyBiyDhOw6prURPXzUqONbW4JhCwEZqkXBE",
    authDomain: "sketchx-88b8e.firebaseapp.com",
    databaseURL: "https://sketchx-88b8e-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "sketchx-88b8e",
    storageBucket: "sketchx-88b8e.firebasestorage.app",
    messagingSenderId: "305217175374",
    appId: "1:305217175374:android:85193f44ed3b39ea78a81f"
};

if (typeof firebase !== 'undefined' && !firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const auth = typeof firebase !== 'undefined' ? firebase.auth() : null;
const db   = typeof firebase !== 'undefined' ? firebase.database() : null;

let allPosts = [];
let displayedPosts = [];
const PAGE_SIZE = 12;
let displayedCount = 0;

window.communityActiveFilter = 'all';
window.communitySearchQuery  = '';

document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initNavToggle();
    initFilters();
    initSearch();
    initFirebase();
});

/* ================================================================
   THEME
   ================================================================ */
function initTheme() {
    const saved = localStorage.getItem('sketchx_theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', saved);
    updateThemeIcon(saved);

    const toggle = document.getElementById('themeToggle');
    if (toggle) {
        toggle.addEventListener('click', () => {
            const cur  = document.documentElement.getAttribute('data-theme') || 'dark';
            const next = cur === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', next);
            localStorage.setItem('sketchx_theme', next);
            updateThemeIcon(next);
        });
    }
}

function updateThemeIcon(theme) {
    const icon = document.getElementById('themeIcon');
    if (icon) icon.className = theme === 'dark' ? 'ti ti-sun' : 'ti ti-moon';
}

/* ================================================================
   NAV
   ================================================================ */
function initNavToggle() {
    const btn   = document.getElementById('mobileMenuBtn');
    const menu  = document.getElementById('mobileMenu');
    if (btn && menu) {
        btn.addEventListener('click', () => {
            const isOpen = menu.style.display === 'flex';
            menu.style.display = isOpen ? 'none' : 'flex';
            const ic = btn.querySelector('i');
            if (ic) ic.className = isOpen ? 'ti ti-menu-2' : 'ti ti-x';
        });
    }
}

/* ================================================================
   FILTERS
   ================================================================ */
function initFilters() {
    document.querySelectorAll('.filter-pill').forEach(pill => {
        pill.addEventListener('click', () => {
            document.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            window.communityActiveFilter = pill.dataset.filter || 'all';
            displayedCount = 0;
            window.communityRenderPosts();
        });
    });
}

/* ================================================================
   SEARCH
   ================================================================ */
function initSearch() {
    const input     = document.getElementById('postSearchInput');
    const clearBtn  = document.getElementById('searchClearBtn');

    if (input) {
        input.addEventListener('input', e => {
            window.communitySearchQuery = e.target.value.trim().toLowerCase();
            if (clearBtn) clearBtn.style.display = window.communitySearchQuery ? 'flex' : 'none';
            displayedCount = 0;
            window.communityRenderPosts();
        });
    }

    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            if (input) input.value = '';
            window.communitySearchQuery = '';
            clearBtn.style.display = 'none';
            displayedCount = 0;
            window.communityRenderPosts();
        });
    }
}

/* ================================================================
   FIREBASE REALTIME POSTS
   ================================================================ */
function initFirebase() {
    if (!auth || !db) {
        renderFallbackPosts();
        return;
    }

    auth.onAuthStateChanged(user => {
        if (!user) {
            auth.signInAnonymously().catch(() => fetchPosts());
        } else {
            fetchPosts();
        }
    });
}

function fetchPosts() {
    db.ref('community_posts').limitToLast(100).on('value', snap => {
        if (!snap.exists()) {
            renderFallbackPosts();
            return;
        }

        const list = [];
        snap.forEach(child => {
            const val = child.val();
            if (val && !val.hidden) {
                val.id = child.key;
                list.push(val);
            }
        });

        allPosts = list.reverse();

        // Update total count display
        const countEl = document.getElementById('totalPostsCount');
        if (countEl) countEl.textContent = allPosts.length + '+';

        displayedCount = 0;
        window.communityRenderPosts();
    }, err => {
        console.warn('DB stream:', err);
        renderFallbackPosts();
    });
}

/* ================================================================
   RENDER POSTS
   ================================================================ */
window.communityRenderPosts = function() {
    const grid  = document.getElementById('postsGrid');
    const empty = document.getElementById('postsEmpty');
    const lmWrap = document.getElementById('loadMoreWrap');
    if (!grid) return;

    const filtered = getFilteredPosts();
    updateFilterStatus(filtered.length);

    if (filtered.length === 0) {
        grid.innerHTML = '';
        if (empty)  empty.style.display  = 'flex';
        if (lmWrap) lmWrap.style.display = 'none';
        return;
    }

    if (empty) empty.style.display = 'none';

    // First render or reset
    if (displayedCount === 0) displayedCount = Math.min(PAGE_SIZE, filtered.length);

    const toShow = filtered.slice(0, displayedCount);
    grid.innerHTML = toShow.map(buildPostCard).join('');

    // Load more visibility
    if (lmWrap) {
        lmWrap.style.display = displayedCount < filtered.length ? 'block' : 'none';
    }

    displayedPosts = filtered;
};

window.communityLoadMore = function() {
    displayedCount = Math.min(displayedCount + PAGE_SIZE, displayedPosts.length);
    window.communityRenderPosts();
};

function getFilteredPosts() {
    return allPosts.filter(p => {
        const filter = window.communityActiveFilter;
        if (filter === 'block'    && p.type !== 'block') return false;
        if (filter === 'code'     && p.type === 'block') return false;
        if (filter === 'verified' && !p.verified)        return false;

        const q = window.communitySearchQuery;
        if (q) {
            const haystack = [p.title || '', p.authorName || '', p.code || ''].join(' ').toLowerCase();
            return haystack.includes(q);
        }
        return true;
    });
}

function updateFilterStatus(count) {
    const label  = document.getElementById('filterStatusLabel');
    const badge  = document.getElementById('postsCountBadge');
    const filter = window.communityActiveFilter;
    const q      = window.communitySearchQuery;

    if (label) {
        if (q)               label.textContent = `Results for "${q}"`;
        else if (filter === 'all')   label.textContent = 'Showing all posts';
        else if (filter === 'block') label.textContent = 'Custom blocks only';
        else if (filter === 'code')  label.textContent = 'Code snippets only';
        else if (filter === 'verified') label.textContent = 'Verified posts only';
    }

    if (badge) badge.textContent = count + ' posts';
}

/* ================================================================
   POST CARD HTML
   ================================================================ */
function buildPostCard(post) {
    const author  = escapeHtml(post.authorName || 'Developer');
    const initial = (author.charAt(0) || 'D').toUpperCase();
    const title   = escapeHtml(post.title || 'Untitled Post');
    const code    = escapeHtml((post.code || '').substring(0, 200));
    const likes   = post.likesCount    || 0;
    const cmts    = post.commentsCount || 0;
    const isBlock = post.type === 'block';
    const dateStr = post.timestamp
        ? new Date(post.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
        : 'Recent';

    return `
        <article class="community-post-card" onclick="window.location.href='post.html?id=${post.id}'" role="link" tabindex="0"
                 onkeydown="if(event.key==='Enter')window.location.href='post.html?id=${post.id}'">
            <div class="post-card-head">
                <div class="post-author-group">
                    <div class="post-avatar-initial" style="${getAvatarStyle(initial)}">${initial}</div>
                    <div class="post-author-meta">
                        <div class="post-author-name">${author}</div>
                        <div class="post-date-tag">${dateStr}</div>
                    </div>
                </div>
                <div class="post-card-badges">
                    ${post.verified ? '<span class="m3-badge success" style="font-size:0.68rem;padding:2px 8px;"><i class="ti ti-discount-check"></i> Verified</span>' : ''}
                    <span class="m3-badge ${isBlock ? 'secondary' : 'tertiary'}" style="font-size:0.68rem;padding:2px 8px;">
                        <i class="ti ${isBlock ? 'ti-puzzle' : 'ti-code'}"></i> ${isBlock ? 'Block' : 'Code'}
                    </span>
                </div>
            </div>

            <h3 class="post-card-title">${title}</h3>

            ${code ? `<div class="post-code-snippet"><code>${code}</code></div>` : ''}

            <div class="post-card-foot">
                <div class="post-metrics-group">
                    <span class="metric-item"><i class="ti ti-heart" style="color:var(--md-sys-color-error);"></i> ${likes}</span>
                    <span class="metric-item"><i class="ti ti-message-circle"></i> ${cmts}</span>
                </div>
                <span style="font-size:0.84rem;font-weight:700;color:var(--md-sys-color-primary);display:flex;align-items:center;gap:4px;">
                    View <i class="ti ti-arrow-right"></i>
                </span>
            </div>
        </article>
    `;
}

const AVATAR_COLORS = [
    'background:var(--md-sys-color-primary-container);color:var(--md-sys-color-on-primary-container);',
    'background:var(--md-sys-color-secondary-container);color:var(--md-sys-color-on-secondary-container);',
    'background:var(--md-sys-color-tertiary-container);color:var(--md-sys-color-on-tertiary-container);',
];

function getAvatarStyle(initial) {
    return AVATAR_COLORS[initial.charCodeAt(0) % AVATAR_COLORS.length];
}

/* ================================================================
   FALLBACK DATA
   ================================================================ */
function renderFallbackPosts() {
    allPosts = [
        {
            id: '-sample-m3',
            title: 'Material 3 Dynamic Color & Theme Engine',
            authorName: 'SketchX Core',
            type: 'code', verified: true, likesCount: 142, commentsCount: 38,
            timestamp: Date.now() - 3600000 * 5,
            code: 'DynamicColors.applyToActivitiesIfAvailable(this);\nMaterialSharedAxis transition = new MaterialSharedAxis(MaterialSharedAxis.Z, true);\ngetWindow().setEnterTransition(transition);'
        },
        {
            id: '-sample-block',
            title: 'Floating Bottom Nav Custom Block',
            authorName: 'Sketchware_Pro',
            type: 'block', verified: true, likesCount: 96, commentsCount: 24,
            timestamp: Date.now() - 3600000 * 18,
            code: '{"name":"setFloatingNavStyle","type":"command","color":"#006399","spec":"%m.view style %d.int"}'
        },
        {
            id: '-sample-git',
            title: 'Git Commit & Diff Visualizer Utility',
            authorName: 'CipherSaqib',
            type: 'code', verified: true, likesCount: 110, commentsCount: 29,
            timestamp: Date.now() - 3600000 * 42,
            code: 'GitUtil.commitAndPush(workspace, "Sync changes", new GitCallback() {\n    @Override public void onComplete() { Toast.makeText(this, "Synced!", 0).show(); }\n});'
        },
        {
            id: '-sample-icon',
            title: 'SVG Icon Injector for Sketchware Pro',
            authorName: 'GrafixLab',
            type: 'code', verified: false, likesCount: 73, commentsCount: 15,
            timestamp: Date.now() - 3600000 * 70,
            code: 'SvgInjector.inject(getContext(), binding.iconView, "ti-star", R.color.md_theme_primary);'
        },
        {
            id: '-sample-palette',
            title: 'Material 3 Seed Color Palette Generator Block',
            authorName: 'DevAyesha',
            type: 'block', verified: false, likesCount: 58, commentsCount: 11,
            timestamp: Date.now() - 3600000 * 90,
            code: '{"name":"generateM3Palette","type":"expression","returnType":"String","args":[{"type":"number","name":"seedColor"}]}'
        },
        {
            id: '-sample-anim',
            title: 'Spring Physics MaterialContainerTransform Helper',
            authorName: 'MotionDev',
            type: 'code', verified: true, likesCount: 88, commentsCount: 20,
            timestamp: Date.now() - 3600000 * 110,
            code: 'MaterialContainerTransform transform = new MaterialContainerTransform();\ntransform.addTarget(endView);\ntransform.setPathMotion(new MaterialArcMotion());\nTransitionManager.beginDelayedTransition(container, transform);'
        }
    ];

    const countEl = document.getElementById('totalPostsCount');
    if (countEl) countEl.textContent = '6+';

    displayedCount = 0;
    window.communityRenderPosts();
}

/* ================================================================
   UTILS
   ================================================================ */
function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
        .replace(/"/g,'&quot;').replace(/'/g,'&#039;');
}
