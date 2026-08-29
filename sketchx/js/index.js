/**
 * SketchX - Index Page Controller
 * Handles: Theme, Nav toggle, M3 Multi-Browse Carousel, Stats counter
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

let slideIndex = 0;
let carouselTimer = null;
let touchStartX = 0;

document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initNav();
    initM3Carousel();
    initStatsObserver();
});

/* ================================================================
   THEME
   ================================================================ */
function initTheme() {
    const saved = localStorage.getItem('sketchx_theme')
        || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
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
   NAV MOBILE TOGGLE
   ================================================================ */
function initNav() {
    const btn  = document.getElementById('mobileMenuBtn');
    const menu = document.getElementById('mobileMenu');
    if (!btn || !menu) return;

    btn.addEventListener('click', () => {
        const isOpen = menu.style.display === 'flex';
        menu.style.display = isOpen ? 'none' : 'flex';
        const ic = btn.querySelector('i');
        if (ic) ic.className = isOpen ? 'ti ti-menu-2' : 'ti ti-x';
    });
}

/* ================================================================
   MATERIAL 3 HERO EXPAND CAROUSEL
   ================================================================ */
function initM3Carousel() {
    const track   = document.getElementById('carouselTrack');
    const prevBtn = document.getElementById('carouselPrev');
    const nextBtn = document.getElementById('carouselNext');
    const dotsBox = document.getElementById('carouselDots');
    if (!track) return;

    const items = track.querySelectorAll('.m3-carousel-item');
    if (!items.length) return;

    // Direct card click expand
    items.forEach((item, i) => {
        item.addEventListener('click', () => {
            if (slideIndex !== i) {
                setSlide(i);
            }
        });
    });

    // Build morphing dots
    if (dotsBox) {
        dotsBox.innerHTML = '';
        items.forEach((_, i) => {
            const dot = document.createElement('div');
            dot.className = 'carousel-dot' + (i === 0 ? ' active' : '');
            dot.addEventListener('click', () => setSlide(i));
            dotsBox.appendChild(dot);
        });
    }

    if (prevBtn) prevBtn.addEventListener('click', () => setSlide(slideIndex - 1));
    if (nextBtn) nextBtn.addEventListener('click', () => setSlide(slideIndex + 1));

    // Touch swipe
    track.addEventListener('touchstart', e => {
        touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    track.addEventListener('touchend', e => {
        const diff = e.changedTouches[0].screenX - touchStartX;
        if (Math.abs(diff) > 40) setSlide(slideIndex + (diff < 0 ? 1 : -1));
    }, { passive: true });

    // Mouse drag
    let dragStartX = 0, isDragging = false;
    track.addEventListener('mousedown', e => {
        isDragging = true;
        dragStartX = e.clientX;
        track.style.cursor = 'grabbing';
    });
    document.addEventListener('mouseup', e => {
        if (!isDragging) return;
        isDragging = false;
        track.style.cursor = 'grab';
        const diff = e.clientX - dragStartX;
        if (Math.abs(diff) > 50) setSlide(slideIndex + (diff < 0 ? 1 : -1));
    });

    window.addEventListener('resize', () => {
        setSlide(slideIndex);
    });

    // Initial position
    setTimeout(() => setSlide(0), 100);

    startAutoSlide();

    const stage = document.querySelector('.m3-carousel-stage');
    if (stage) {
        stage.addEventListener('mouseenter', stopAutoSlide);
        stage.addEventListener('mouseleave', startAutoSlide);
    }
}

function setSlide(index) {
    const track = document.getElementById('carouselTrack');
    const stage = document.querySelector('.m3-carousel-stage');
    const items = track ? track.querySelectorAll('.m3-carousel-item') : [];
    const dots  = document.querySelectorAll('.carousel-dot');
    if (!items.length || !track || !stage) return;

    if (index < 0) index = items.length - 1;
    if (index >= items.length) index = 0;
    slideIndex = index;

    // Toggle active class on items and morphing dots
    items.forEach((item, i) => item.classList.toggle('active', i === slideIndex));
    dots.forEach((dot,  i) => dot.classList.toggle('active',  i === slideIndex));

    const stageW = stage.offsetWidth;
    let pillW = 96, activeW = 340, gap = 16;
    if (window.innerWidth <= 500) {
        pillW = 48; activeW = 240; gap = 16;
    } else if (window.innerWidth <= 768) {
        pillW = 68; activeW = 270; gap = 16;
    }

    // Precise mathematical center position
    const itemCenter = slideIndex * (pillW + gap) + (activeW / 2);
    const targetOffset = itemCenter - (stageW / 2);
    track.style.transform = `translateX(${-targetOffset}px)`;
}

function startAutoSlide() {
    stopAutoSlide();
    carouselTimer = setInterval(() => setSlide(slideIndex + 1), 4500);
}
function stopAutoSlide() {
    if (carouselTimer) { clearInterval(carouselTimer); carouselTimer = null; }
}

/* ================================================================
   STATS ANIMATION
   ================================================================ */
function initStatsObserver() {
    const stats = document.querySelectorAll('.metric-number-big[data-target]');
    if (!stats.length) return;

    let done = false;
    const obs = new IntersectionObserver(entries => {
        entries.forEach(e => {
            if (e.isIntersecting && !done) {
                done = true;
                stats.forEach(el => {
                    const target = parseInt(el.getAttribute('data-target'), 10);
                    const suffix = el.getAttribute('data-suffix') || '';
                    animateNumber(el, target, suffix);
                });
            }
        });
    }, { threshold: 0.5 });

    const strip = document.querySelector('.metrics-strip');
    if (strip) obs.observe(strip);
}

function animateNumber(el, target, suffix) {
    let current = 0;
    const inc   = Math.ceil(target / 50);
    const timer = setInterval(() => {
        current += inc;
        if (current >= target) { current = target; clearInterval(timer); }
        el.textContent = current.toLocaleString() + suffix;
    }, 22);
}
