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

// featured products

const featuredCards = document.getElementById('featured-cards');

function pickName(value) {
    if (!value) return '';
    return typeof value === 'object' ? (value.name || '') : value;
}

function renderStars(rating) {
    const filled = Math.round(rating) || 0;
    let stars = '';
    for (let i = 1; i <= 5; i++) {
        stars += `
            <svg class="star ${i <= filled ? 'filled' : ''}" width="14" height="14" viewBox="0 0 24 24"
                stroke="currentColor" stroke-width="2" stroke-linejoin="round">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
            </svg>`;
    }
    return stars;
}

async function loadFeaturedProducts() {
    if (!featuredCards) return;
    try {
        const response = await fetch(`${BASE_URL}/api/products`, {
            method: 'GET',
            headers: {
                'X-API-KEY': API_KEY,
                'Content-Type': 'application/json'
            }
        });
        if (!response.ok) throw new Error('Request failed');
        const result = await response.json();
        const list = Array.isArray(result.data) ? result.data : (result.data && result.data.items) || [];
        const products = [...list]
            .sort((a, b) => Number(b.rating ?? b.averageRating ?? 0) - Number(a.rating ?? a.averageRating ?? 0))
            .slice(0, 4);
        if (products.length === 0) {
            featuredCards.innerHTML = '<p>No products found</p>';
            return;
        }
        featuredCards.innerHTML = products.map(product => {
            const image = product.imageUrl || product.image || (product.images && product.images[0]) || '';
            const category = pickName(product.categoryName || product.category);
            const brand = pickName(product.brandName || product.brand);
            const rating = Number(product.rating ?? product.averageRating ?? 0);
            const price = Number(product.price || 0).toLocaleString('en-US');
            return `
            <div class="featured-card" data-product-id="${product.id}">
                <div class="featured-card-img">
                    <img src="${image}" alt="${product.name}">
                    <div class="featured-card-actions">
                        <button type="button" class="featured-card-action" aria-label="Add to wishlist">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                            </svg>
                        </button>
                        <button type="button" class="featured-card-action" aria-label="Quick view">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                <circle cx="12" cy="12" r="3"></circle>
                            </svg>
                        </button>
                    </div>
                </div>
                <div class="featured-card-info">
                    <div class="featured-card-meta">
                        <span class="featured-card-category">${category}</span>
                        <span class="featured-card-dot">•</span>
                        <span class="featured-card-brand">${brand}</span>
                    </div>
                    <span class="featured-card-name">${product.name}</span>
                    <div class="featured-card-rating">
                        <div class="featured-card-stars">${renderStars(rating)}</div>
                        <span>${rating.toFixed(1)}</span>
                    </div>
                    <span class="featured-card-price">USD ${price}</span>
                    <button type="button" class="featured-card-cart" data-product-id="${product.id}">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                            stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <circle cx="9" cy="21" r="1"></circle>
                            <circle cx="20" cy="21" r="1"></circle>
                            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                        </svg>
                        Add to Cart
                    </button>
                </div>
            </div>`;
        }).join('');
    } catch (err) {
        featuredCards.innerHTML = '<p>Failed to load products</p>';
        console.error('Featured products fetch error:', err);
    }
}

loadFeaturedProducts();

// new arrivals
const newArrivalsCards = document.getElementById('new-arrivals-cards');

async function loadNewArrivals() {
    if (!newArrivalsCards) return;
    try {
        const response = await fetch(`${BASE_URL}/api/products`, {
            method: 'GET',
            headers: {
                'X-API-KEY': API_KEY,
                'Content-Type': 'application/json'
            }
        });
        if (!response.ok) throw new Error('Request failed');
        const result = await response.json();
        const list = Array.isArray(result.data) ? result.data : (result.data && result.data.items) || [];
        const products = list
            .filter(p => pickName(p.categoryName || p.category).toLowerCase() === 'storage')
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 4);
        if (products.length === 0) {
            newArrivalsCards.innerHTML = '<p>No products found</p>';
            return;
        }
        newArrivalsCards.innerHTML = products.map(product => {
            const image = product.imageUrl || product.image || (product.images && product.images[0]) || '';
            const category = pickName(product.categoryName || product.category);
            const brand = pickName(product.brandName || product.brand);
            const rating = Number(product.rating ?? product.averageRating ?? 0);
            const price = Number(product.price || 0).toLocaleString('en-US');
            return `
            <div class="new-arrival-card" data-product-id="${product.id}">
                <div class="new-arrival-img">
                    <img src="${image}" alt="${product.name}">
                    <span class="new-arrival-badge">NEW</span>
                    <div class="new-arrival-actions">
                        <button type="button" class="new-arrival-action" aria-label="Add to wishlist">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                            </svg>
                        </button>
                        <button type="button" class="new-arrival-action" aria-label="Quick view">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                <circle cx="12" cy="12" r="3"></circle>
                            </svg>
                        </button>
                    </div>
                </div>
                <div class="new-arrival-info">
                    <div class="new-arrival-meta">
                        <span class="new-arrival-category">${category}</span>
                        <span class="new-arrival-dot">•</span>
                        <span class="new-arrival-brand">${brand}</span>
                    </div>
                    <span class="new-arrival-name">${product.name}</span>
                    <div class="new-arrival-rating">
                        <div class="new-arrival-stars">${renderStars(rating)}</div>
                        <span>${rating.toFixed(1)}</span>
                    </div>
                    <span class="new-arrival-price">USD ${price}</span>
                    <button type="button" class="new-arrival-cart" data-product-id="${product.id}">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                            stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <circle cx="9" cy="21" r="1"></circle>
                            <circle cx="20" cy="21" r="1"></circle>
                            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                        </svg>
                        Add to Cart
                    </button>
                </div>
            </div>`;
        }).join('');
    } catch (err) {
        newArrivalsCards.innerHTML = '<p>Failed to load products</p>';
        console.error('New arrivals fetch error:', err);
    }
}

loadNewArrivals();