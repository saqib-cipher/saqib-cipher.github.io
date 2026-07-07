const faders = document.querySelectorAll('.fade-up, .fade-in');
const navBar = document.querySelector('.expressive-button-group');

const checkScroll = () => {
  faders.forEach(fader => {
    const rect = fader.getBoundingClientRect();
    if (rect.top < window.innerHeight - 100) {
      fader.classList.add('active');
    }
  });

  if (navBar) {
    const isAtBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 20;
    if (isAtBottom) {
      navBar.classList.add('hidden');
    } else {
      navBar.classList.remove('hidden');
    }
  }
};

window.addEventListener('scroll', checkScroll);
window.addEventListener('resize', checkScroll);
window.addEventListener('DOMContentLoaded', checkScroll);
checkScroll();


//nav bar
function toggleActive(clickedButton) {
  const group = clickedButton.parentElement;
  const buttons = group.querySelectorAll('.expressive-btn');
  
  buttons.forEach(btn => btn.classList.remove('active'));
  clickedButton.classList.add('active');
}


    const hashNavLinks = document.querySelectorAll('.expressive-btn[href^="#"]');
    const sections = [];
    hashNavLinks.forEach(function (link) {
      const id = link.getAttribute('href').slice(1);
      const section = document.getElementById(id);
      if (section) sections.push({ el: section, link: link });
    });

    if (sections.length > 0) {
      window.addEventListener('scroll', function () {
        var scrollPos = window.scrollY + window.innerHeight / 2;

        sections.forEach(function (s) {
          if (
            s.el.offsetTop <= scrollPos &&
            s.el.offsetTop + s.el.offsetHeight > scrollPos
          ) {
            hashNavLinks.forEach(function (l) { l.classList.remove('active'); });
            s.link.classList.add('active');
          }
        });
      });
    }

// Horizontal Project Slider Navigation
const track = document.querySelector('.projects-track');
const prevBtn = document.querySelector('.slider-btn.prev');
const nextBtn = document.querySelector('.slider-btn.next');

if (track && prevBtn && nextBtn) {
  const slides = document.querySelectorAll('.project-slide');
  const indicators = document.querySelectorAll('.indicator');

  prevBtn.addEventListener('click', () => {
    const slide = track.querySelector('.project-slide');
    const scrollAmount = slide ? (slide.clientWidth + 24) : track.clientWidth;
    track.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
  });
  nextBtn.addEventListener('click', () => {
    const slide = track.querySelector('.project-slide');
    const scrollAmount = slide ? (slide.clientWidth + 24) : track.clientWidth;
    track.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  });

  // Indicator click navigation
  indicators.forEach((ind, index) => {
    ind.addEventListener('click', () => {
      const slide = track.querySelector('.project-slide');
      if (slide) {
        const scrollAmount = slide.clientWidth + 24;
        track.scrollTo({ left: index * scrollAmount, behavior: 'smooth' });
      }
    });
  });

  // Intersection Observer for Material 3 Carousel Active States and Indicator sync
  const observerOptions = {
    root: track,
    threshold: 0.55
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('active-slide');
        
        // Synchronize dots indicators
        const index = Array.from(slides).indexOf(entry.target);
        indicators.forEach((ind, i) => {
          if (i === index) ind.classList.add('active');
          else ind.classList.remove('active');
        });
      } else {
        entry.target.classList.remove('active-slide');
      }
    });
  }, observerOptions);

  slides.forEach(slide => observer.observe(slide));

  // Hide prev/next buttons when boundaries are reached
  const updateButtons = () => {
    // If scrolled to the start, hide prev button
    if (track.scrollLeft <= 5) {
      prevBtn.style.opacity = '0';
      prevBtn.style.pointerEvents = 'none';
    } else {
      prevBtn.style.opacity = '1';
      prevBtn.style.pointerEvents = 'auto';
    }

    // If scrolled to the end, hide next button
    if (Math.ceil(track.scrollLeft + track.clientWidth) >= track.scrollWidth - 5) {
      nextBtn.style.opacity = '0';
      nextBtn.style.pointerEvents = 'none';
    } else {
      nextBtn.style.opacity = '1';
      nextBtn.style.pointerEvents = 'auto';
    }
  };

  track.addEventListener('scroll', updateButtons);
  window.addEventListener('resize', updateButtons);
  updateButtons(); // Run on initial load
}
