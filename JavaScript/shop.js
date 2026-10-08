const API_KEY = 'ebbee9bb-1884-43ad-ae71-afa71ea9460e';
const BASE_URL = 'https://shopapi.stepacademy.ge';

let thisSerchInput = '';
let currentSort = '';
let currentCategory = '';
let currentMinRating = '';
let currentMinPrice = '';
let currentMaxPrice = '';
let currentBrand = '';
let currentInStock = false;
let serchTimeOut = null;
let priceTimeOut = null;
let brandTimeOut = null;
let thisCurrentPage = 1;
const itemsPerPage = 8;


const productsContainer = document.getElementById('productGrid');
const serchBar = document.getElementById('productSearchInput');
const sortSelect = document.getElementById('sortSelect');
const searchInputHeader = document.getElementById('searchInputHeader');
const clearBtn = document.getElementById('clearBtn');
const minRatingContainer = document.getElementById('minRating');
const minPriceInput = document.getElementById('minPrice');
const maxPriceInput = document.getElementById('maxPrice');
const brandSearchInput = document.getElementById('brandSearch');
const inStockCheckbox = document.getElementById('inStockOnly');
const clearFiltersBtn = document.getElementById('clearFiltersBtn');
const navHoverHome = document.getElementById('navHoverHome');
const navHoverShop = document.getElementById('navHoverShop');
const currentPage = window.location.pathname.split('/').pop() || 'index.html';
if (currentPage === 'index.html' && navHoverHome) {
    navHoverHome.classList.add('active');
} else if (currentPage === 'shop.html' && navHoverShop) {
    navHoverShop.classList.add('active');
}
function cleanPrice(val) {
    if (!val) return '';
    return val.toString().replace(/[^0-9.]/g, '');
}
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
        const categories = result.data || result;
        if (!categories || categories.length === 0) {
            dropdown.innerHTML = '<li class="dropdown-empty">No categories found</li>';
            return;
        }
        dropdown.innerHTML = categories.map(category => `
            <li>
                <a href="shop.html?category=${category.id}">
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
async function categoriesFilterLoad() {
    const categoriesFilter = document.getElementById('categoriesFilter');
    if (!categoriesFilter) return;
    try {
        const response = await fetch(`${BASE_URL}/api/categories`, {
            method: 'GET',
            headers: {
                'X-API-KEY': API_KEY,
                'Content-Type': 'application/json'
            }
        });
        if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
        const data = await response.json();
        const categories = data.data ?? data;
        let htmlContent = `
            <label class="category">
                <input type="radio" name="category" value="" ${!currentCategory ? 'checked' : ''}>
                <p>All Categories</p>
            </label>
        `;
        categories.forEach(category => {
            const isChecked = String(category.id) === String(currentCategory) ? 'checked' : '';
            htmlContent += `
                <label class="category">
                    <input 
                        type="radio" 
                        name="category"
                        value="${category.id}"
                        ${isChecked}
                    >
                    <span>${category.name}</span>
                    <span>${category.productCount || 0}</span>
                </label>
            `;
        });
        categoriesFilter.innerHTML = htmlContent;
        categoriesFilter.addEventListener('change', (e) => {
            if (e.target.name === 'category') {
                const selectedCategoryId = e.target.value;
                loadProducts(1, thisSerchInput, currentSort, selectedCategoryId, currentMinRating, currentMinPrice, currentMaxPrice, currentBrand, currentInStock);
            }
        });
    } catch (err) {
        console.error('ERROR:', err);
    }
}
function loadProducts(
    page = 1,
    serchInput = '',
    sortValue = '',
    categoryValue = '',
    minRatingValue = '',
    minPriceValue = '',
    maxPriceValue = '',
    brandValue = '',
    inStockValue = false
) {
    thisCurrentPage = page;
    thisSerchInput = serchInput.trim();
    currentSort = sortValue;
    currentCategory = categoryValue;
    currentMinRating = minRatingValue;
    currentMinPrice = cleanPrice(minPriceValue);
    currentMaxPrice = cleanPrice(maxPriceValue);
    currentBrand = brandValue.trim();
    currentInStock = Boolean(inStockValue);
    if (!productsContainer) return;
    const querySearch = encodeURIComponent(thisSerchInput);
    let sortByParam = '';
    let sortDescendingParam = '';
    if (currentSort === 'price-asc') {
        sortByParam = 'price';
        sortDescendingParam = 'false';
    } else if (currentSort === 'price-desc') {
        sortByParam = 'price';
        sortDescendingParam = 'true';
    } else if (currentSort === 'rating-desc') {
        sortByParam = 'rating';
        sortDescendingParam = 'true';
    } else if (currentSort === 'newest') {
        sortByParam = 'createdAt';
        sortDescendingParam = 'true';
    }
    let url = `${BASE_URL}/api/products/filter?Take=${itemsPerPage}&Page=${thisCurrentPage}`;
    if (thisSerchInput !== '') url += `&Search=${querySearch}`;
    if (currentCategory !== '') url += `&CategoryId=${encodeURIComponent(currentCategory)}`;
    if (currentMinRating !== '') url += `&MinRating=${encodeURIComponent(currentMinRating)}`;
    if (currentMinPrice !== '') url += `&MinPrice=${encodeURIComponent(currentMinPrice)}`;
    if (currentMaxPrice !== '') url += `&MaxPrice=${encodeURIComponent(currentMaxPrice)}`;
    if (currentBrand !== '') url += `&Brand=${encodeURIComponent(currentBrand)}`;
    if (currentInStock) url += `&InStock=true`;
    if (sortByParam !== '') url += `&SortBy=${sortByParam}&SortDescending=${sortDescendingParam}`;
    fetch(url, {
        method: 'GET',
        headers: {
            'X-API-KEY': API_KEY,
            'Content-Type': 'application/json'
        }
    })
        .then(response => response.json())
        .then(result => {
            const products = result.items || result.data?.items || [];
            const totalPages = result.totalPages || result.data?.totalPages || 1;
            productsContainer.innerHTML = '';
            if (products.length === 0) {
                productsContainer.innerHTML = `<p class="no-products">No products found.</p>`;
                renderPagination(1, 1);
                return;
            }
            for (let i = 0; i < products.length; i++) {
                const itemId = products[i].id;
                const itemName = products[i].name || 'Product';
                const itemBrand = products[i].brand || '';
                const itemModel = products[i].model || '';
                const itemPrice = products[i].price || 0;
                const itemImg = products[i].imageUrl || '';
                const itemRating = Math.round(products[i].rating || 0);
                const itemCategory = products[i].category?.name || 'Uncategorized';
                const isFav = window.FavoritesAPI ? window.FavoritesAPI.isFavorite(itemId) : false;
                const starsHtml = Array.from({ length: 5 }, (_, index) =>
                    `<span class="star ${index < itemRating ? 'on' : ''}">★</span>`
                ).join('');
                productsContainer.innerHTML += `
                <article class="product-card">
                    <div class="product-image product-image--dark">
                        <img src="${itemImg}" alt="${itemName}">
                        <div class="product-actions">
                            <button 
                                type="button" 
                                class="icon-btn wishlist-btn ${isFav ? 'active favorited' : ''}" 
                                aria-label="Add to wishlist"
                                data-id="${itemId}"
                                data-name="${itemName}"
                                data-price="${itemPrice}"
                                data-image="${itemImg}"
                                data-category="${itemCategory}"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="${isFav ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21.2l7.8-7.8 1-1a5.5 5.5 0 0 0 0-7.8z"></path>
                                </svg>
                            </button>
                            <button type="button" class="icon-btn" aria-label="Quick view">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                            </button>
                        </div>
                    </div>
                    <div class="product-body">
                        <p class="product-meta"><span class="category">${itemCategory}</span> &middot; ${itemBrand}</p>
                        <h3 class="product-name">${itemName} ${itemModel}</h3>
                        <div class="product-rating">
                            <span class="stars">${starsHtml}</span>
                            <span class="rating-value">${itemRating}</span>
                        </div>
                        <p class="product-price">$${itemPrice}</p>
                        <button 
                            type="button" 
                            class="add-to-cart-btn"
                            data-id="${itemId}"
                            data-name="${itemName}"
                            data-price="${itemPrice}"
                            data-image="${itemImg}"
                            data-category="${itemCategory}"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
                            Add to Cart
                        </button>
                    </div>
                </article>  
                `;
            }
            renderPagination(thisCurrentPage, totalPages);
        })
        .catch(err => console.error('Products fetch error:', err));
}
function renderPagination(currentPage, totalPages) {
    const paginationContainer = document.querySelector('.pagination');
    if (!paginationContainer) return;
    let html = '';
    html += `<button type="button" class="page-btn page-nav" ${currentPage === 1 ? 'disabled' : ''} onclick="changePage(${currentPage - 1})">Prev</button>`;
    for (let i = 1; i <= totalPages; i++) {
        html += `<button type="button" class="page-btn ${i === currentPage ? 'active' : ''}" onclick="changePage(${i})">${i}</button>`;
    }
    html += `<button type="button" class="page-btn page-nav" ${currentPage === totalPages ? 'disabled' : ''} onclick="changePage(${currentPage + 1})">Next</button>`;
    paginationContainer.innerHTML = html;
}
function changePage(newPage) {
    loadProducts(newPage, thisSerchInput, currentSort, currentCategory, currentMinRating, currentMinPrice, currentMaxPrice, currentBrand, currentInStock);
}
if (productsContainer) {
    productsContainer.addEventListener('click', (e) => {
        const btn = e.target.closest('[aria-label="Add to wishlist"]');
        if (!btn) return;
        const product = {
            id: btn.dataset.id,
            name: btn.dataset.name,
            price: parseFloat(btn.dataset.price || 0),
            image: btn.dataset.image,
            category: btn.dataset.category
        };
        if (window.FavoritesAPI) {
            const isNowFav = window.FavoritesAPI.toggleFavorite(product);
            btn.classList.toggle('active', isNowFav);
            btn.classList.toggle('favorited', isNowFav);
            const svg = btn.querySelector('svg');
            if (svg) {
                svg.setAttribute('fill', isNowFav ? 'currentColor' : 'none');
            }
        }
    });
}
if (serchBar) {
    serchBar.addEventListener('input', (e) => {
        const query = e.target.value;
        clearTimeout(serchTimeOut);
        serchTimeOut = setTimeout(() => {
            loadProducts(1, query, currentSort, currentCategory, currentMinRating, currentMinPrice, currentMaxPrice, currentBrand, currentInStock);
        }, 300);
    });
    serchBar.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            clearTimeout(serchTimeOut);
            loadProducts(1, e.target.value, currentSort, currentCategory, currentMinRating, currentMinPrice, currentMaxPrice, currentBrand, currentInStock);
        }
    });
}
if (searchInputHeader && clearBtn) {
    searchInputHeader.addEventListener('input', () => {
        clearBtn.style.display = searchInputHeader.value.length > 0 ? 'block' : 'none';
    });
    clearBtn.addEventListener('click', () => {
        searchInputHeader.value = '';
        clearBtn.style.display = 'none';
        searchInputHeader.focus();
        loadProducts(1, '', currentSort, currentCategory, currentMinRating, currentMinPrice, currentMaxPrice, currentBrand, currentInStock);
    });
    searchInputHeader.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            loadProducts(1, e.target.value, currentSort, currentCategory, currentMinRating, currentMinPrice, currentMaxPrice, currentBrand, currentInStock);
        }
    });
}
if (minRatingContainer) {
    const ratingBtns = minRatingContainer.querySelectorAll('.rating-btn');
    ratingBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const selectedRating = btn.getAttribute('data-rating');
            if (btn.classList.contains('active')) {
                btn.classList.remove('active');
                currentMinRating = '';
            } else {
                ratingBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                currentMinRating = selectedRating;
            }
            loadProducts(1, thisSerchInput, currentSort, currentCategory, currentMinRating, currentMinPrice, currentMaxPrice, currentBrand, currentInStock);
        });
    });
}
function handlePriceInputChange() {
    clearTimeout(priceTimeOut);
    priceTimeOut = setTimeout(() => {
        const minVal = minPriceInput ? minPriceInput.value : '';
        const maxVal = maxPriceInput ? maxPriceInput.value : '';
        loadProducts(1, thisSerchInput, currentSort, currentCategory, currentMinRating, minVal, maxVal, currentBrand, currentInStock);
    }, 400);
}
if (minPriceInput) minPriceInput.addEventListener('input', handlePriceInputChange);
if (maxPriceInput) maxPriceInput.addEventListener('input', handlePriceInputChange);
if (brandSearchInput) {
    brandSearchInput.addEventListener('input', (e) => {
        const query = e.target.value;
        clearTimeout(brandTimeOut);
        brandTimeOut = setTimeout(() => {
            loadProducts(1, thisSerchInput, currentSort, currentCategory, currentMinRating, currentMinPrice, currentMaxPrice, query, currentInStock);
        }, 300);
    });
    brandSearchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            clearTimeout(brandTimeOut);
            loadProducts(1, thisSerchInput, currentSort, currentCategory, currentMinRating, currentMinPrice, currentMaxPrice, e.target.value, currentInStock);
        }
    });
}
if (inStockCheckbox) {
    inStockCheckbox.addEventListener('change', (e) => {
        currentInStock = e.target.checked;
        loadProducts(1, thisSerchInput, currentSort, currentCategory, currentMinRating, currentMinPrice, currentMaxPrice, currentBrand, currentInStock);
    });
}
if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
        loadProducts(1, thisSerchInput, e.target.value, currentCategory, currentMinRating, currentMinPrice, currentMaxPrice, currentBrand, currentInStock);
    });
}
if (clearFiltersBtn) {
    clearFiltersBtn.addEventListener('click', () => {
        thisSerchInput = '';
        currentSort = '';
        currentCategory = '';
        currentMinRating = '';
        currentMinPrice = '';
        currentMaxPrice = '';
        currentBrand = '';
        currentInStock = false;
        if (serchBar) serchBar.value = '';
        if (searchInputHeader) searchInputHeader.value = '';
        if (brandSearchInput) brandSearchInput.value = '';
        if (minPriceInput) minPriceInput.value = '';
        if (maxPriceInput) maxPriceInput.value = '';
        if (clearBtn) clearBtn.style.display = 'none';
        if (sortSelect) sortSelect.value = '';
        if (inStockCheckbox) inStockCheckbox.checked = false;
        if (minRatingContainer) {
            const ratingBtns = minRatingContainer.querySelectorAll('.rating-btn');
            ratingBtns.forEach(btn => btn.classList.remove('active'));
        }
        const categoriesFilter = document.getElementById('categoriesFilter');
        if (categoriesFilter) {
            const radios = categoriesFilter.querySelectorAll('input[type="radio"]');
            radios.forEach(radio => {
                radio.checked = (radio.value === '');
            });
        }
        if (window.history.pushState) {
            const cleanUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
            window.history.pushState({ path: cleanUrl }, '', cleanUrl);
        }
        loadProducts(1, '', '', '', '', '', '', '', false);
    });
}
const urlParams = new URLSearchParams(window.location.search);
const sortFromUrl = urlParams.get('sort');
const categoryFromUrl = urlParams.get('category');
const searchFromUrl = urlParams.get('search');
const minRatingFromUrl = urlParams.get('minRating');
const minPriceFromUrl = urlParams.get('minPrice');
const maxPriceFromUrl = urlParams.get('maxPrice');
const brandFromUrl = urlParams.get('brand');
const inStockFromUrl = urlParams.get('inStock');
if (sortFromUrl) {
    currentSort = sortFromUrl;
    if (sortSelect) sortSelect.value = sortFromUrl;
}
if (categoryFromUrl) {
    currentCategory = categoryFromUrl;
}
if (searchFromUrl) {
    thisSerchInput = searchFromUrl;
    if (searchInputHeader) {
        searchInputHeader.value = searchFromUrl;
        if (clearBtn) clearBtn.style.display = 'block';
    }
}
if (minRatingFromUrl) {
    currentMinRating = minRatingFromUrl;
    if (minRatingContainer) {
        const matchingBtn = minRatingContainer.querySelector(`[data-rating="${minRatingFromUrl}"]`);
        if (matchingBtn) matchingBtn.classList.add('active');
    }
}
if (minPriceFromUrl) {
    currentMinPrice = cleanPrice(minPriceFromUrl);
    if (minPriceInput) minPriceInput.value = `$${currentMinPrice}`;
}
if (maxPriceFromUrl) {
    currentMaxPrice = cleanPrice(maxPriceFromUrl);
    if (maxPriceInput) maxPriceInput.value = `$${currentMaxPrice}`;
}
if (brandFromUrl) {
    currentBrand = brandFromUrl;
    if (brandSearchInput) brandSearchInput.value = brandFromUrl;
}
if (inStockFromUrl === 'true') {
    currentInStock = true;
    if (inStockCheckbox) inStockCheckbox.checked = true;
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
            const response = await fetch(`${BASE_URL}/api/profile`, {
                method: 'GET',
                headers: {
                    'accept': 'application/json',
                    'X-API-KEY': API_KEY,
                    'Authorization': `Bearer ${token}`
                }
            });
            if (response.ok) {
                const result = await response.json();
                const user = result.data || result;
                firstName = user.firstName || user.first_name || user.name?.split(' ')[0] || '';
                lastName = user.lastName || user.last_name || user.name?.split(' ')[1] || '';
                if (firstName) localStorage.setItem('userFirstName', firstName);
                if (lastName) localStorage.setItem('userLastName', lastName);
                const f = firstName ? firstName.trim().charAt(0).toUpperCase() : '';
                const l = lastName ? lastName.trim().charAt(0).toUpperCase() : '';
                if (f || l) return `${f}${l}`;
            }
        } catch (err) {
            console.error('Error fetching user profile:', err);
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
async function renderShopAuthHeader() {
    const authContainer = document.getElementById('authContainer');
    if (!authContainer) return;
    const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
    const profilePath = './profile.html';
    const cartPath = './profile.html#cart';
    const favoritesPath = './profile.html#favorites';
    const signInPath = './signin.html';
    if (token) {
        const initials = await getUserInitials(token);
        authContainer.innerHTML = `
            <a href="${favoritesPath}" class="header-icon-btn" title="Favorites">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l8.78-8.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                </svg>
            </a>
            <a href="${cartPath}" class="header-icon-btn" title="Cart">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="9" cy="21" r="1"></circle>
                    <circle cx="20" cy="21" r="1"></circle>
                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                </svg>
            </a>
            <a href="${profilePath}" class="profile-avatar-btn" title="My Profile">${initials}</a>
        `;
    } else {
        authContainer.innerHTML = `
            <a class="sign-in-a" href="${signInPath}">
                <button class="sign-in-btn-element">Sign In</button>
            </a>
        `;
    }
}
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
async function getUserInitials(token) {
    try {
        const response = await fetch('/api/user/me', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
            const user = await response.json();
            const first = user.firstName ? user.firstName.charAt(0) : '';
            const last = user.lastName ? user.lastName.charAt(0) : '';
            return (first + last).toUpperCase() || 'U';
        }
    } catch (err) {
        console.error('Failed to retrieve user info:', err);
    }
    return 'U';
}
async function renderShopAuthHeader() {
    const authContainer = document.getElementById('authContainer');
    if (!authContainer) return;
    const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
    const profilePath = './profile.html';
    const cartPath = './profile.html#cart';
    const favoritesPath = './profile.html#favorites';
    const signInPath = './signin.html';

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
if (productsContainer) {
    productsContainer.addEventListener('click', (e) => {
        if (e.target.closest('.add-to-cart-btn, .icon-btn')) return;
        const card = e.target.closest('.product-card');
        if (!card) return;
        const wishlistBtn = card.querySelector('[aria-label="Add to wishlist"]');
        const productId = wishlistBtn ? wishlistBtn.dataset.id : null;
        if (productId) {
            window.location.href = `./itempage.html?id=${productId}`;
        }
    });
}

window.addEventListener('cart:updated', updateHeaderBadges);
window.addEventListener('favorites:updated', updateHeaderBadges);
document.addEventListener('DOMContentLoaded', renderShopAuthHeader);

document.addEventListener('DOMContentLoaded', () => {
    loadCategories();
    renderShopAuthHeader();
    categoriesFilterLoad();
    loadProducts(1, thisSerchInput, currentSort, currentCategory, currentMinRating, currentMinPrice, currentMaxPrice, currentBrand, currentInStock);
});