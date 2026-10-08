const FAVORITES_STORAGE_KEY = 'step_tech_favorites';

function getFavorites() {
    try {
        return JSON.parse(localStorage.getItem(FAVORITES_STORAGE_KEY)) || [];
    } catch (e) {
        return [];
    }
}
function saveFavorites(favorites) {
    localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites));
    window.dispatchEvent(new CustomEvent('favorites:updated', { detail: favorites }));
}
function toggleFavorite(product) {
    if (!product || !product.id) return false;
    let favorites = getFavorites();
    const existingIndex = favorites.findIndex(item => String(item.id) === String(product.id));
    let isAdded = false;
    if (existingIndex > -1) {
        // Remove if already favorited
        favorites.splice(existingIndex, 1);
        isAdded = false;
    } else {
        // Add if not favorited
        favorites.push(product);
        isAdded = true;
    }
    saveFavorites(favorites);
    return isAdded;
}
function isFavorite(productId) {
    if (!productId) return false;
    const favorites = getFavorites();
    return favorites.some(item => String(item.id) === String(productId));
}
function removeFavorite(productId) {
    let favorites = getFavorites();
    favorites = favorites.filter(item => String(item.id) !== String(productId));
    saveFavorites(favorites);
}
function clearFavorites() {
    localStorage.removeItem(FAVORITES_STORAGE_KEY);
    window.dispatchEvent(new CustomEvent('favorites:updated', { detail: [] }));
}
window.FavoritesAPI = {
    getFavorites,
    toggleFavorite,
    isFavorite,
    removeFavorite,
    clearFavorites
};