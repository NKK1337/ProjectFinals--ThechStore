const hamburgerBtn = document.getElementById('hamburgerBtn');
const navList = document.getElementById('navList');
const menuOverlay = document.getElementById('menuOverlay');

function closeMenu() {
    navList.classList.remove('open');
    hamburgerBtn.classList.remove('active');
    menuOverlay.classList.remove('open');
    document.body.classList.remove('menu-open');
}

function openMenu() {
    navList.classList.add('open');
    hamburgerBtn.classList.add('active');
    menuOverlay.classList.add('open');
    document.body.classList.add('menu-open');
}

hamburgerBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (navList.classList.contains('open')) {
        closeMenu();
    } else {
        openMenu();
    }
});

menuOverlay.addEventListener('click', closeMenu);

document.querySelectorAll('.nav-list a').forEach(link => {
    link.addEventListener('click', () => {
        if (window.innerWidth <= 781) {
            closeMenu();
        }
    });
});

window.addEventListener('resize', () => {
    if (window.innerWidth > 781) {
        closeMenu();
    }
});