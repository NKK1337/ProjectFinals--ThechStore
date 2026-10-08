window.API_KEY = window.API_KEY || 'ebbee9bb-1884-43ad-ae71-afa71ea9460e';
window.BASE_URL = window.BASE_URL || 'https://shopapi.stepacademy.ge';

const API_KEY = window.API_KEY;
const BASE_URL = window.BASE_URL;

let currentProduct = null;
let currentQuantity = 1;

document.addEventListener('DOMContentLoaded', () => {
    renderAuthHeader();
    loadCategories();
    initItemPage();
    setupQuantityControls();
    setupActionButtons();
});

// Load Categories Dropdown Menu
async function loadCategories() {
    const dropdown = document.getElementById('categoriesDropdown');
    if (!dropdown) return;

    try {
        const response = await fetch(`${BASE_URL}/api/categories`, {
            method: 'GET',
            headers: {
                'accept': '*/*',
                'X-API-KEY': API_KEY
            }
        });

        if (!response.ok) throw new Error('Failed to load categories');

        const result = await response.json();
        const categories = result.data || result;

        if (!categories || categories.length === 0) {
            dropdown.innerHTML = '<li class="dropdown-empty">No categories found</li>';
            return;
        }

        dropdown.innerHTML = categories.map(category => `
            <li>
                <a href="./shop.html?category=${category.id}">
                    ${category.name}
                    <span class="count">${category.productCount || 0}</span>
                </a>
            </li>
        `).join('');
    } catch (err) {
        console.error('Categories load error:', err);
        dropdown.innerHTML = '<li class="dropdown-error">Failed to load categories</li>';
    }
}

// Sync Header User Badges & Auth Info
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
    }
    return 'U';
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

async function renderAuthHeader() {
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

async function initItemPage() {
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');

    const stateElem = document.getElementById('itmState');
    const wrapperElem = document.getElementById('itmWrapper');

    if (!productId) {
        if (stateElem) {
            stateElem.textContent = 'No product selected.';
            stateElem.classList.add('error');
        }
        return;
    }

    try {
        const response = await fetch(`${BASE_URL}/api/products/${productId}`, {
            method: 'GET',
            headers: {
                'accept': 'text/plain',
                'X-API-KEY': API_KEY
            }
        });

        if (!response.ok) throw new Error('Product not found');

        const product = await response.json();
        currentProduct = product.data || product;

        renderProductDetails(currentProduct);

        if (stateElem) stateElem.hidden = true;
        if (wrapperElem) wrapperElem.hidden = false;
    } catch (err) {
        console.error('Error fetching product:', err);
        if (stateElem) {
            stateElem.textContent = 'Failed to load product details.';
            stateElem.classList.add('error');
        }
    }
}

function renderProductDetails(product) {
    const categoryName = typeof product.category === 'object' ? product.category?.name : (product.category || 'Tech');
    const brandName = product.brand || 'Generic';

    const categoryElem = document.getElementById('itmCategory');
    const brandElem = document.getElementById('itmBrand');
    const titleElem = document.getElementById('itmTitle');
    const priceElem = document.getElementById('itmPrice');
    const textElem = document.getElementById('itmText');

    if (categoryElem) categoryElem.textContent = categoryName;
    if (brandElem) brandElem.textContent = brandName;
    if (titleElem) titleElem.textContent = product.name || 'Product Details';
    document.title = `${product.name || 'Product'} | Step Tech`;

    const price = Number(product.price || 0).toFixed(2);
    if (priceElem) priceElem.textContent = `$${price}`;
    if (textElem) textElem.textContent = product.description || 'No description available.';

    const stockElem = document.getElementById('itmStock');
    if (stockElem) {
        const stockCount = Number(product.stock ?? 0);
        if (stockCount <= 0) {
            stockElem.innerHTML = `<span class="itm-stock-badge out">Out of Stock</span>`;
        } else if (stockCount < 5) {
            stockElem.innerHTML = `<span class="itm-stock-badge low">Only ${stockCount} left in stock</span>`;
        } else {
            stockElem.innerHTML = `<span class="itm-stock-badge">In Stock (${stockCount})</span>`;
        }
    }

    const rating = Number(product.rating ?? 5);
    const fillPercent = Math.min(100, Math.max(0, (rating / 5) * 100));
    const starsFill = document.getElementById('itmStarsFill');
    if (starsFill) starsFill.style.width = `${fillPercent}%`;

    const ratingNumElem = document.getElementById('itmRatingNum');
    const reviewsElem = document.getElementById('itmReviews');
    if (ratingNumElem) ratingNumElem.textContent = rating.toFixed(1);
    if (reviewsElem) reviewsElem.textContent = `(${product.reviewsCount || 10} reviews)`;

    let images = [];
    if (Array.isArray(product.imageUrls) && product.imageUrls.length > 0) {
        images = product.imageUrls;
    } else if (product.imageUrl) {
        images = [product.imageUrl];
    } else {
        images = ['https://via.placeholder.com/600'];
    }

    const mainImg = document.getElementById('itmMainImg');
    if (mainImg) {
        mainImg.src = images[0];
        mainImg.alt = product.name || 'Product Image';
    }

    const thumbsContainer = document.getElementById('itmThumbs');
    if (thumbsContainer) {
        if (images.length > 1) {
            thumbsContainer.innerHTML = images.map((imgUrl, index) => `
                <button type="button" class="itm-thumb ${index === 0 ? 'active' : ''}" data-img="${imgUrl}">
                    <img src="${imgUrl}" alt="${product.name}">
                </button>
            `).join('');

            thumbsContainer.addEventListener('click', (e) => {
                const thumb = e.target.closest('.itm-thumb');
                if (!thumb) return;
                thumbsContainer.querySelectorAll('.itm-thumb').forEach(t => t.classList.remove('active'));
                thumb.classList.add('active');
                if (mainImg) mainImg.src = thumb.dataset.img;
            });
        } else {
            thumbsContainer.innerHTML = '';
        }
    }

    updateFavButtonState();
}

function setupQuantityControls() {
    const qtyInput = document.getElementById('itmQtyInput');
    const btnMinus = document.getElementById('qtyMinus');
    const btnPlus = document.getElementById('qtyPlus');

    if (!qtyInput) return;

    btnMinus?.addEventListener('click', () => {
        if (currentQuantity > 1) {
            currentQuantity--;
            qtyInput.value = currentQuantity;
        }
    });

    btnPlus?.addEventListener('click', () => {
        currentQuantity++;
        qtyInput.value = currentQuantity;
    });

    qtyInput.addEventListener('change', () => {
        const val = parseInt(qtyInput.value, 10);
        currentQuantity = (!isNaN(val) && val >= 1) ? val : 1;
        qtyInput.value = currentQuantity;
    });
}

function setupActionButtons() {
    const addToCartBtn = document.getElementById('addToCartBtn');
    const favBtn = document.getElementById('favBtn');

    addToCartBtn?.addEventListener('click', () => {
        if (!currentProduct) return;

        const itemToAdd = {
            id: currentProduct.id,
            name: currentProduct.name,
            price: Number(currentProduct.price || 0),
            image: currentProduct.imageUrl || (currentProduct.imageUrls && currentProduct.imageUrls[0]) || '',
            category: typeof currentProduct.category === 'object' ? currentProduct.category?.name : currentProduct.category
        };

        for (let i = 0; i < currentQuantity; i++) {
            if (window.CartAPI && typeof window.CartAPI.addItem === 'function') {
                window.CartAPI.addItem(itemToAdd);
            } else {
                const cart = JSON.parse(localStorage.getItem('step_tech_cart') || '[]');
                const existing = cart.find(item => String(item.id) === String(itemToAdd.id));
                if (existing) {
                    existing.quantity = (existing.quantity || 1) + 1;
                } else {
                    cart.push({ ...itemToAdd, quantity: 1 });
                }
                localStorage.setItem('step_tech_cart', JSON.stringify(cart));
                window.dispatchEvent(new CustomEvent('cart:updated'));
            }
        }

        showToast(`Added ${currentQuantity} item(s) to cart!`);
    });

    favBtn?.addEventListener('click', () => {
        if (!currentProduct) return;

        const itemToFav = {
            id: currentProduct.id,
            name: currentProduct.name,
            price: Number(currentProduct.price || 0),
            image: currentProduct.imageUrl || (currentProduct.imageUrls && currentProduct.imageUrls[0]) || '',
            category: typeof currentProduct.category === 'object' ? currentProduct.category?.name : currentProduct.category
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

        updateFavButtonState();
    });
}

function updateFavButtonState() {
    const favBtn = document.getElementById('favBtn');
    if (!favBtn || !currentProduct) return;

    let isFav = false;
    if (window.FavoritesAPI && typeof window.FavoritesAPI.isFavorite === 'function') {
        isFav = window.FavoritesAPI.isFavorite(currentProduct.id);
    } else {
        const favorites = JSON.parse(localStorage.getItem('step_tech_favorites') || '[]');
        isFav = favorites.some(i => String(i.id) === String(currentProduct.id));
    }

    favBtn.classList.toggle('active', isFav);
    favBtn.setAttribute('aria-pressed', isFav ? 'true' : 'false');
}

function showToast(msg) {
    const toast = document.getElementById('itmToast');
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 2500);
}

window.addEventListener('cart:updated', updateHeaderBadges);
window.addEventListener('favorites:updated', updateHeaderBadges);