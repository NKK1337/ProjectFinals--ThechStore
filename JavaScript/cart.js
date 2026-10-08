const CART_STORAGE_KEY = 'step_tech_cart';

function getCart() {
    try {
        return JSON.parse(localStorage.getItem(CART_STORAGE_KEY)) || [];
    } catch (e) {
        return [];
    }
}
function saveCart(cart) {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    window.dispatchEvent(new CustomEvent('cart:updated', { detail: cart }));
}
function addToCart(product) {
    const cart = getCart();
    const existingIndex = cart.findIndex(item => String(item.id) === String(product.id));
    if (existingIndex > -1) {
        cart[existingIndex].quantity = (cart[existingIndex].quantity || 1) + 1;
    } else {
        cart.push({ ...product, quantity: 1 });
    }
    saveCart(cart);
}
function removeFromCart(productId) {
    let cart = getCart();
    cart = cart.filter(item => String(item.id) !== String(productId));
    saveCart(cart);
}
function updateQuantity(productId, delta) {
    const cart = getCart();
    const item = cart.find(i => String(i.id) === String(productId));
    if (item) {
        item.quantity += delta;
        if (item.quantity <= 0) {
            removeFromCart(productId);
            return;
        }
        saveCart(cart);
    }
}
function clearCart() {
    localStorage.removeItem(CART_STORAGE_KEY);
    window.dispatchEvent(new CustomEvent('cart:updated', { detail: [] }));
}
document.addEventListener('DOMContentLoaded', () => {
    document.addEventListener('click', (e) => {
        const btn = e.target.closest('.add-to-cart-btn');
        if (!btn) return;
        const product = {
            id: btn.dataset.id,
            name: btn.dataset.name,
            price: parseFloat(btn.dataset.price || 0),
            image: btn.dataset.image || '',
            category: btn.dataset.category || ''
        };
        addToCart(product);
    });
});
window.CartAPI = {
    getCart,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart
};