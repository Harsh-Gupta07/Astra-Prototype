const nav = document.querySelector('#site-nav');
const menuButton = document.querySelector('.menu-button');
const navMenu = document.querySelector('nav');
const topButton = document.querySelector('.back-top');
const navLinks = [...document.querySelectorAll('.nav-link')];
const sections = [...document.querySelectorAll('main section[id]')];

function updateNavigation() {
  const y = window.scrollY;
  nav.classList.toggle('is-visible', y > 80);
  topButton.classList.toggle('show', y > 600);
  let current = 'home';
  sections.forEach((section) => {
    if (y + window.innerHeight * 0.35 >= section.offsetTop) current = section.id;
  });
  navLinks.forEach((link) => link.classList.toggle('active', link.getAttribute('href') === `#${current}`));
}

window.addEventListener('scroll', updateNavigation, { passive: true });
window.addEventListener('resize', updateNavigation);
updateNavigation();

menuButton.addEventListener('click', () => {
  const open = navMenu.classList.toggle('open');
  menuButton.setAttribute('aria-expanded', String(open));
});

navLinks.forEach((link) => link.addEventListener('click', () => {
  navMenu.classList.remove('open');
  menuButton.setAttribute('aria-expanded', 'false');
}));

topButton.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
