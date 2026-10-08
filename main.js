const API_KEY = 'ebbee9bb-1884-43ad-ae71-afa71ea9460e';
const BASE_URL = 'https://shopapi.stepacademy.ge';

let loadedProductsMap = new Map();

document.addEventListener('DOMContentLoaded', () => {
    renderAuthHeader();
    loadCategories();
    loadCategoryCards();
    loadFeaturedProducts();
    loadNewArrivals();
    highlightCurrentNav();
    setupProductActionListeners();
});

function updateHeaderBadges() {
    const cart = window.CartAPI ? window.CartAPI.getCart() : JSON.parse(localStorage.getItem('step_tech_cart') || '[]');
    const favorites = window.FavoritesAPI ? window.FavoritesAPI.getFavorites() : JSON.parse(localStorage.getItem('step_tech_favorites') || '[]');
    const totalCartCount = cart.reduce((acc, item) => acc + (item.quantity || 1), 0);
    const totalFavCount = favorites.length;
    const cartBadge = document.getElementById('cartHeaderBadge');
    const favBadge = document.getElementById('favHeaderBadge');
    if (cartBadge) {
        cartBadge.textContent = totalCartCount;
        cartBadge.hidden = totalCartCount === 0;
    }
    if (favBadge) {
        favBadge.textContent = totalFavCount;
        favBadge.hidden = totalFavCount === 0;
    }
}

window.addEventListener('cart:updated', updateHeaderBadges);
window.addEventListener('favorites:updated', updateHeaderBadges);

function setupProductActionListeners() {
    document.addEventListener('click', (e) => {
        const cartBtn = e.target.closest('.featured-card-cart, .new-arrival-cart');
        if (cartBtn) {
            e.preventDefault();
            const productId = cartBtn.dataset.productId;
            const product = loadedProductsMap.get(productId);
            if (product) {
                const itemToAdd = {
                    id: product.id,
                    name: product.name,
                    price: Number(product.price || 0),
                    image: product.imageUrl || product.image || (product.images && product.images[0]) || '',
                    category: pickName(product.categoryName || product.category)
                };
                if (window.CartAPI && typeof window.CartAPI.addItem === 'function') {
                    window.CartAPI.addItem(itemToAdd);
                } else if (window.CartAPI && typeof window.CartAPI.addToCart === 'function') {
                    window.CartAPI.addToCart(itemToAdd);
                } else {
                    const cart = JSON.parse(localStorage.getItem('step_tech_cart') || '[]');
                    const existing = cart.find(i => String(i.id) === String(itemToAdd.id));
                    if (existing) {
                        existing.quantity = (existing.quantity || 1) + 1;
                    } else {
                        cart.push({ ...itemToAdd, quantity: 1 });
                    }
                    localStorage.setItem('step_tech_cart', JSON.stringify(cart));
                    window.dispatchEvent(new CustomEvent('cart:updated'));
                }
            }
            return;
        }
        const favBtn = e.target.closest('.featured-card-action[aria-label="Add to wishlist"], .new-arrival-action[aria-label="Add to wishlist"]');
        if (favBtn) {
            e.preventDefault();
            const cardElem = favBtn.closest('.featured-card, .new-arrival-card');
            if (!cardElem) return;
            const productId = cardElem.dataset.productId;
            const product = loadedProductsMap.get(productId);
            if (product) {
                const itemToFav = {
                    id: product.id,
                    name: product.name,
                    price: Number(product.price || 0),
                    image: product.imageUrl || product.image || (product.images && product.images[0]) || '',
                    category: pickName(product.categoryName || product.category)
                };
                if (window.FavoritesAPI && typeof window.FavoritesAPI.toggleFavorite === 'function') {
                    window.FavoritesAPI.toggleFavorite(itemToFav);
                } else {
                    let favorites = JSON.parse(localStorage.getItem('step_tech_favorites') || '[]');
                    const index = favorites.findIndex(i => String(i.id) === String(itemToFav.id));
                    if (index > -1) {
                        favorites.splice(index, 1);
                    } else {
                        favorites.push(itemToFav);
                    }
                    localStorage.setItem('step_tech_favorites', JSON.stringify(favorites));
                    window.dispatchEvent(new CustomEvent('favorites:updated'));
                }
            }
        }
    });
}

async function getUserInitials(token) {
    let firstName = localStorage.getItem('userFirstName') || '';
    let lastName = localStorage.getItem('userLastName') || '';
    if (firstName || lastName) {
        const f = firstName ? firstName.trim().charAt(0).toUpperCase() : '';
        const l = lastName ? lastName.trim().charAt(0).toUpperCase() : '';
        return `${f}${l}` || 'U';
    }
    if (token) {
        try {
            const response = await fetch(`${BASE_URL}/api/auth/current-user`, {
                method: 'GET',
                headers: {
                    'accept': '*/*',
                    'X-API-KEY': API_KEY,
                    'Authorization': `Bearer ${token}`
                }
            });
            if (response.ok) {
                const userData = await response.json();
                firstName = userData.firstName || userData.first_name || '';
                lastName = userData.lastName || userData.last_name || '';
                if (firstName) localStorage.setItem('userFirstName', firstName);
                if (lastName) localStorage.setItem('userLastName', lastName);
                const f = firstName ? firstName.trim().charAt(0).toUpperCase() : '';
                const l = lastName ? lastName.trim().charAt(0).toUpperCase() : '';
                if (f || l) return `${f}${l}`;
            }
        } catch (err) {
            console.error('Error fetching current user:', err);
        }
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const payload = JSON.parse(window.atob(base64));
            const name = payload.name || payload.unique_name || payload.sub || '';
            if (name) {
                const parts = name.trim().split(' ');
                const f = parts[0] ? parts[0].charAt(0).toUpperCase() : '';
                const l = parts[1] ? parts[1].charAt(0).toUpperCase() : '';
                if (f || l) return `${f}${l}`;
            }
        } catch (e) {
            console.error('Error parsing token:', e);
        }
    }
    return 'U';
}

// Render dynamic authentication header
async function renderAuthHeader() {
    const authContainer = document.getElementById('authContainer');
    if (!authContainer) return;
    const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
    const isInHtmlFolder = window.location.pathname.includes('/Html/') || window.location.pathname.includes('/html/');
    const profilePath = isInHtmlFolder ? './profile.html' : './Html/profile.html';
    const cartPath = isInHtmlFolder ? './profile.html#cart' : './Html/profile.html#cart';
    const favoritesPath = isInHtmlFolder ? './profile.html#favorites' : './Html/profile.html#favorites';
    const signInPath = isInHtmlFolder ? './signin.html' : './Html/signin.html';
    if (token) {
        const initials = await getUserInitials(token);
        authContainer.innerHTML = `
            <a href="${favoritesPath}" class="header-icon-btn" id="favHeaderBtn" title="Favorites">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l8.78-8.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                </svg>
                <span class="nav-badge" id="favHeaderBadge" hidden>0</span>
            </a>
            <a href="${cartPath}" class="header-icon-btn" id="cartHeaderBtn" title="Cart">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="9" cy="21" r="1"></circle>
                    <circle cx="20" cy="21" r="1"></circle>
                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                </svg>
                <span class="nav-badge" id="cartHeaderBadge" hidden>0</span>
            </a>
            <a href="${profilePath}" class="profile-avatar-btn" title="My Profile">${initials}</a>
        `;
        updateHeaderBadges();
    } else {
        authContainer.innerHTML = `
            <a class="sign-in-a" href="${signInPath}">
                <button class="sign-in-btn-element">Sign In</button>
            </a>
        `;
    }
}

// Load Dropdown Categories
async function loadCategories() {
    const dropdown = document.getElementById('categoriesDropdown');
    if (!dropdown) return;
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
        const isInHtmlFolder = window.location.pathname.includes('/Html/') || window.location.pathname.includes('/html/');
        const shopPath = isInHtmlFolder ? './shop.html' : './Html/shop.html';
        dropdown.innerHTML = categories.map(category => `
            <li>
                <a href="${shopPath}?category=${category.id}">
                    ${category.name}
                    <span class="count">${category.productCount || 0}</span>
                </a>
            </li>
        `).join('');
    } catch (err) {
        dropdown.innerHTML = '<li class="dropdown-error">Failed to load categories</li>';
        console.error('Categories fetch error:', err);
    }
}

// Search bar functionality
const searchInputHeader = document.getElementById('searchInputHeader');
const clearBtn = document.getElementById('clearBtn');

if (searchInputHeader && clearBtn) {
    searchInputHeader.addEventListener('input', () => {
        clearBtn.style.display = searchInputHeader.value.length > 0 ? 'block' : 'none';
    });
    clearBtn.addEventListener('click', () => {
        searchInputHeader.value = '';
        clearBtn.style.display = 'none';
        searchInputHeader.focus();
    });
    searchInputHeader.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const query = searchInputHeader.value.trim();
            if (query) {
                const isInHtmlFolder = window.location.pathname.includes('/Html/') || window.location.pathname.includes('/html/');
                const shopPath = isInHtmlFolder ? './shop.html' : './Html/shop.html';
                window.location.href = `${shopPath}?search=${encodeURIComponent(query)}`;
            }
        }
    });
}

// Active Nav state toggling
function highlightCurrentNav() {
    const navHoverHome = document.getElementById('navHoverHome');
    const navHoverShop = document.getElementById('navHoverShop');
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';

    if ((currentPage === 'index.html' || currentPage === '') && navHoverHome) {
        navHoverHome.classList.add('active');
    } else if (currentPage === 'shop.html' && navHoverShop) {
        navHoverShop.classList.add('active');
    }
}

// Category Cards
async function loadCategoryCards() {
    const categoryCards = document.getElementById('category-cards');
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
            categoryCards.innerHTML = '<p>No categories found</p>';
            return;
        }
        const isInHtmlFolder = window.location.pathname.includes('/Html/') || window.location.pathname.includes('/html/');
        const shopPath = isInHtmlFolder ? './shop.html' : './Html/shop.html';
        categoryCards.innerHTML = categories.map(category => `
            <a href="${shopPath}?category=${category.id}" class="category-card">
                <div class="category-card-img">
                    <img src="${category.imageUrl || category.image || ''}" alt="${category.name}">
                </div>
                <div class="category-card-info">
                    <span class="category-card-name">${category.name}</span>
                    <span class="category-card-count">${category.productCount || 0} products</span>
                </div>
                <svg class="category-card-arrow" width="20" height="20" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                    <polyline points="12 5 19 12 12 19"></polyline>
                </svg>
            </a>
        `).join('');
    } catch (err) {
        categoryCards.innerHTML = '<p>Failed to load categories</p>';
        console.error('Category cards fetch error:', err);
    }
}

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

// Featured Products
async function loadFeaturedProducts() {
    const featuredCards = document.getElementById('featured-cards');
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
        products.forEach(p => loadedProductsMap.set(String(p.id), p));
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

// New Arrivals
async function loadNewArrivals() {
    const newArrivalsCards = document.getElementById('new-arrivals-cards');
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
        products.forEach(p => loadedProductsMap.set(String(p.id), p));
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