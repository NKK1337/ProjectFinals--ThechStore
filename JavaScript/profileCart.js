document.addEventListener('DOMContentLoaded', () => {
    const cartListContainer = document.querySelector('[data-list="cart"]');
    const emptyCartContainer = document.querySelector('[data-empty="cart"]');
    const FAVORITES_STORAGE_KEY = 'step_tech_favorites';
window.FavoritesAPI = {
    getFavorites() {
        return JSON.parse(localStorage.getItem(FAVORITES_STORAGE_KEY) || '[]');
    },
    saveFavorites(favorites) {
        localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites));
        window.dispatchEvent(new CustomEvent('favorites:updated'));
    },
    toggleFavorite(product) {
        let favorites = this.getFavorites();
        const index = favorites.findIndex(item => item.id === product.id);
        if (index > -1) {
            favorites.splice(index, 1);
        } else {
            favorites.push(product);
        }
        this.saveFavorites(favorites);
    },
    removeFavorite(productId) {
        let favorites = this.getFavorites();
        favorites = favorites.filter(item => item.id !== productId);
        this.saveFavorites(favorites);
    },
    moveToCart(product) {
        this.removeFavorite(product.id);
        if (window.CartAPI) {
            window.CartAPI.addItem(product);
        }
    }
};
    if (!cartListContainer) return;
    function renderCart() {
        const cart = window.CartAPI ? window.CartAPI.getCart() : JSON.parse(localStorage.getItem('step_tech_cart') || '[]');
        const totalItems = cart.reduce((acc, item) => acc + (item.quantity || 1), 0);
        const totalPrice = cart.reduce((acc, item) => acc + (parseFloat(item.price || 0) * (item.quantity || 1)), 0);
        if (window.ProfilePage && typeof window.ProfilePage.setCount === 'function') {
            window.ProfilePage.setCount('cart', totalItems);
        } else {
            if (emptyCartContainer) emptyCartContainer.hidden = cart.length > 0;
            if (cartListContainer) cartListContainer.hidden = cart.length === 0;
        }
        if (cart.length === 0) {
            cartListContainer.innerHTML = '';
            return;
        }
        const itemsHtml = cart.map(item => `
            <div class="cart-item" data-id="${item.id}" style="display: flex; align-items: center; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #eee;">
                <div style="display: flex; align-items: center; gap: 12px;">
                    ${item.image ? `<img src="${item.image}" alt="${item.name}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 6px;">` : ''}
                    <div>
                        <h4 style="margin: 0; font-size: 1rem;">${item.name || 'Product'}</h4>
                        <span style="font-size: 0.85rem; color: #666;">$${parseFloat(item.price || 0).toFixed(2)}</span>
                    </div>
                </div>
                <div style="display: flex; align-items: center; gap: 10px;">
                    <button type="button" class="cart-qty-btn" data-action="decrease" data-id="${item.id}" style="padding: 2px 8px;">-</button>
                    <span>${item.quantity || 1}</span>
                    <button type="button" class="cart-qty-btn" data-action="increase" data-id="${item.id}" style="padding: 2px 8px;">+</button>
                    <button type="button" class="cart-remove-btn" data-id="${item.id}" style="color: red; background: none; border: none; cursor: pointer; margin-left: 10px;">✕</button>
                </div>
            </div>
        `).join('');
        const summaryHtml = `
            <div class="cart-summary" style="margin-top: 20px; padding-top: 15px; border-top: 2px solid #ddd; display: flex; justify-content: space-between; align-items: center;">
                <h3>Total: $${totalPrice.toFixed(2)}</h3>
                <button type="button" id="clearCartBtn" style="padding: 8px 16px; background-color: #f44336; color: white; border: none; border-radius: 4px; cursor: pointer;">Clear Cart</button>
            </div>
        `;
        cartListContainer.innerHTML = itemsHtml + summaryHtml;
    }
    cartListContainer.addEventListener('click', (e) => {
        const target = e.target;
        const productId = target.dataset.id;
        if (target.classList.contains('cart-qty-btn')) {
            const action = target.dataset.action;
            const delta = action === 'increase' ? 1 : -1;
            if (window.CartAPI) {
                window.CartAPI.updateQuantity(productId, delta);
            }
        } else if (target.classList.contains('cart-remove-btn')) {
            if (window.CartAPI) {
                window.CartAPI.removeFromCart(productId);
            }
        } else if (target.id === 'clearCartBtn') {
            if (window.CartAPI) {
                window.CartAPI.clearCart();
            }
        }
    });
    window.addEventListener('cart:updated', renderCart);
    renderCart();
});