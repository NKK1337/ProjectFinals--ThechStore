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

// filter categories 

async function categoriesFilterLoad() {
    const categoriesFilter = document.getElementById('categoriesFilter');
    try {
        const response = await fetch(`${BASE_URL}/api/categories`, {
            method: 'GET',
            headers: {
                'X-API-KEY': API_KEY,
                'Content-Type': 'application/json'
            }
        });
        if (!response.ok) {
            throw new Error(`HTTP error: ${response.status}`);
        }
        const data = await response.json();
        const categories = data.data ?? data;
        categories.forEach(category => {
            categoriesFilter.innerHTML += `
        <label class="category">
            <input 
                type="radio" 
                name="category"
                value="${category.id}"
            >
            <span>${category.name}</span>
            <span>${category.productCount}</span>
        </label>
    `;
        });
    } catch (err) {
        console.error('ERROR:', err);
    }
}

categoriesFilterLoad();
