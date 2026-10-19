document.body.classList.add('js');
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const header = document.querySelector('header');
let ticking = false;
function frame() { header?.classList.toggle('scrolled', scrollY > 35); const image = document.querySelector('.hero-image'); if (image && !reduced && scrollY < innerHeight)
    image.style.transform = `translateY(${scrollY * .16}px)`; ticking = false; }
addEventListener('scroll', () => { if (!ticking) {
    requestAnimationFrame(frame);
    ticking = true;
} }, { passive: true });
frame();
if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => entries.forEach(entry => { if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
    } }), { threshold: .08 });
    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
}
else
    document.querySelectorAll('.reveal').forEach(el => el.classList.add('visible'));
if (!reduced && matchMedia('(pointer:fine)').matches)
    document.querySelectorAll('.magnetic').forEach(button => { button.addEventListener('pointermove', e => { const box = button.getBoundingClientRect(); button.style.transform = `translate(${(e.clientX - box.left - box.width / 2) * .06}px,${(e.clientY - box.top - box.height / 2) * .1}px)`; }); button.addEventListener('pointerleave', () => button.style.transform = ''); });
const year = document.getElementById('year');
if (year)
    year.textContent = new Date().getFullYear();
const menuButton = document.querySelector('.menu-toggle');
function closeMenu() { header?.classList.remove('menu-open'); menuButton?.setAttribute('aria-expanded', 'false'); menuButton?.setAttribute('aria-label', 'Open navigation'); }
menuButton?.addEventListener('click', () => { const open = header.classList.toggle('menu-open'); menuButton.setAttribute('aria-expanded', String(open)); menuButton.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation'); });
document.querySelectorAll('#site-navigation a').forEach(link => link.addEventListener('click', closeMenu));
addEventListener('keydown', event => { if (event.key === 'Escape' && header?.classList.contains('menu-open')) {
    closeMenu();
    menuButton.focus();
} });
addEventListener('click', event => { if (header?.classList.contains('menu-open') && !header.contains(event.target))
    closeMenu(); });
const journeyItems = document.querySelectorAll('.journey-item');
journeyItems.forEach((item, index) => item.addEventListener('toggle', () => { if (item.open) {
    journeyItems.forEach(other => { if (other !== item)
        other.open = false; });
    const counter = document.getElementById('journey-current');
    if (counter)
        counter.textContent = String(index + 1).padStart(2, '0');
} }));
const journeySection = document.querySelector('.journey-section');
if (journeySection && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => entries.forEach(entry => { if (entry.isIntersecting) {
        entry.target.classList.add('is-inview');
        observer.unobserve(entry.target);
    } }), { threshold: .15 });
    observer.observe(journeySection);
}
const experienceTabs = [...document.querySelectorAll('[data-experience-tab]')];
if (experienceTabs.length) {
    const chapters = [
        { chapter: '01 / BEFORE THE BIG DAY', heading: 'Choose your first frames.', description: 'Signature or Elite. Choose the photographs and films you want to bring home with your new car.' },
        { chapter: '02 / A DATE WORTH SAVING', heading: 'A little planning. All the anticipation.', description: 'Select your car, Hyderabad showroom, and delivery time. Your booking reference is ready as soon as your request is saved.' },
        { chapter: '03 / THE MOMENT IS YOURS', heading: 'Put the phone away. Be here.', description: 'Once your shoot is confirmed, enjoy the reveal and the people beside you. We’ll capture what you want to remember.' },
        { chapter: '04 / LONG AFTER THE FIRST DRIVE', heading: 'Bring the feeling home.', description: 'Receive your edited photographs and films in a digital gallery. Keep them close. Share them with your people.' }
    ];
    const section = document.querySelector('.signature-experience'), stage = document.querySelector('.signature-stage'), panel = document.getElementById('experience-panel');
    let panelAnimation;
    function chooseExperience(index, focus = false) { const next = chapters[index]; if (!next)
        return; experienceTabs.forEach((tab, i) => { tab.setAttribute('aria-selected', String(i === index)); tab.tabIndex = i === index ? 0 : -1; }); panel.setAttribute('aria-labelledby', experienceTabs[index].id); stage.dataset.phase = String(index); section.style.setProperty('--active-index', String(index)); document.getElementById('experience-chapter').textContent = next.chapter; document.getElementById('experience-heading').textContent = next.heading; document.getElementById('experience-description').textContent = next.description; document.getElementById('experience-number').textContent = String(index + 1).padStart(2, '0'); if (!reduced && panel.animate) {
        panelAnimation?.cancel();
        panelAnimation = panel.animate([{ opacity: 0, transform: 'translateY(9px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 650, easing: 'cubic-bezier(.22,1,.36,1)' });
    } if (focus)
        experienceTabs[index].focus(); }
    experienceTabs.forEach((tab, index) => { tab.addEventListener('click', () => chooseExperience(index)); tab.addEventListener('keydown', event => { let target = index; if (event.key === 'ArrowRight')
        target = (index + 1) % 4;
    else if (event.key === 'ArrowLeft')
        target = (index + 3) % 4;
    else if (event.key === 'Home')
        target = 0;
    else if (event.key === 'End')
        target = 3;
    else
        return; event.preventDefault(); chooseExperience(target, true); }); });
}
