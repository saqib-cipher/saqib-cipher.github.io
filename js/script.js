const faders = document.querySelectorAll('.fade-in');

window.addEventListener('scroll', () => {
  faders.forEach(fader => {
    const rect = fader.getBoundingClientRect();
    if (rect.top < window.innerHeight - 100) {
      fader.classList.add('active');
    }
  });
});


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
        var scrollPos = window.scrollY + 200;

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
  
