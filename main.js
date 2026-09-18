// categories 
const API_KEY = 'ebbee9bb-1884-43ad-ae71-afa71ea9460e';
const BASE_URL = 'https://shopapi.stepacademy.ge';

async function loadCategories() {
    const dropdown = document.getElementById('categoriesDropdown');
    try {
        const response = await fetch(`${BASE_URL}/api/categories`, {
            method: 'GET',
            headers: {
                'X-API-KEY': API_KEY,
                'Content-Type': 'application/json'
            }
        });
        if (!response.ok) throw new Error('Request failed');
        const result = await response.json();
        const categories = result.data;
        if (!categories || categories.length === 0) {
            dropdown.innerHTML = '<li class="dropdown-empty">No categories found</li>';
            return;
        }
        dropdown.innerHTML = categories.map(category => `
    <li>
        <a href="#" data-category-id="${category.id}">
            ${category.name}
            <span class="count">${category.productCount}</span>
        </a>
    </li>
    `).join('');
    } catch (err) {
        dropdown.innerHTML = '<li class="dropdown-error">Failed to load categories</li>';
        console.error('Categories fetch error:', err);
    }
}

loadCategories();

// serchbar js
const searchInput = document.getElementById('searchInput');
const clearBtn = document.getElementById('clearBtn');

searchInput.addEventListener('input', () => {
    clearBtn.style.display = searchInput.value.length > 0 ? 'block' : 'none';
});

clearBtn.addEventListener('click', () => {
    searchInput.value = '';
    clearBtn.style.display = 'none';
    searchInput.focus();
});

// toggle hover

const navHoverHome = document.getElementById('navHoverHome')
const navHoverShop = document.getElementById('navHoverShop')

const currentPage = window.location.pathname.split('/').pop() || 'index.html';

if (currentPage === 'index.html') {
    navHoverHome.classList.add('active');
} else if (currentPage === 'shop.html') {
    navHoverShop.classList.add('active');
}

// categoris for side page
const categoryCards = document.getElementById('category-cards');

async function loadCategoryCards() {
    if (!categoryCards) return;

    try {
        const response = await fetch(`${BASE_URL}/api/categories`, {
            method: 'GET',
            headers: {
                'X-API-KEY': API_KEY,
                'Content-Type': 'application/json'
            }
        });
        if (!response.ok) throw new Error('Request failed');
        const result = await response.json();
        const categories = (result.data || []).slice(0, 4);
        if (categories.length === 0) {
            categoryCards.innerHTML = '<p>No categories found</p>'
            return;
        }
        categoryCards.innerHTML = categories.map(category => `
            <a href="#" class="category-card" data-category-id="${category.id}">
                <div class="category-card-img">
                    <img src="${category.imageUrl || category.image || ''}" alt="${category.name}">
                </div>
                <div class="category-card-info">
                    <span class="category-card-name">${category.name}</span>
                    <span class="category-card-count">${category.productCount} products</span>
                </div>
                <svg class="category-card-arrow" width="20" height="20" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                    <polyline points="12 5 19 12 12 19"></polyline>
                </svg>
            </a>
        `).join('');
    }
    catch (err) {
        categoryCards.innerHTML = '<p>Failed to load categories</p>'
        console.error('Category cards fetch error:', err);
    }
}

loadCategoryCards();