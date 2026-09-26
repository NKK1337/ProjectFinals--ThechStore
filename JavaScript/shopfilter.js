const filtersToggleBtn = document.getElementById('filtersToggleBtn');
const filterPanel = document.getElementById('filterPanel');
const filterBackdrop = document.getElementById('filterBackdrop');
const filterCloseBtn = document.getElementById('filterCloseBtn');

function openFilters() {
    filterPanel.classList.add('open');
    filterBackdrop.classList.add('open');
    document.body.classList.add('filters-open');
}

function closeFilters() {
    filterPanel.classList.remove('open');
    filterBackdrop.classList.remove('open');
    document.body.classList.remove('filters-open');
}

filtersToggleBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    openFilters();
});

filterCloseBtn.addEventListener('click', closeFilters);
filterBackdrop.addEventListener('click', closeFilters);

window.addEventListener('resize', () => {
    if (window.innerWidth > 1024) {
        closeFilters();
    }
});
