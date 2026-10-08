document.addEventListener('DOMContentLoaded', () => {
    const favListContainer = document.querySelector('[data-list="favorites"]');
    const emptyFavContainer = document.querySelector('[data-empty="favorites"]');
    function getFavorites() {
        if (window.FavoritesAPI && typeof window.FavoritesAPI.getFavorites === 'function') {
            return window.FavoritesAPI.getFavorites();
        }
        try {
            return JSON.parse(localStorage.getItem('step_tech_favorites')) || [];
        } catch (e) {
            return [];
        }
    }
    function clearFavorites() {
        if (window.FavoritesAPI && typeof window.FavoritesAPI.clearFavorites === 'function') {
            window.FavoritesAPI.clearFavorites();
        } else {
            localStorage.removeItem('step_tech_favorites');
            window.dispatchEvent(new CustomEvent('favorites:updated', { detail: [] }));
        }
    }
    function removeFavoriteItem(id) {
        if (window.FavoritesAPI && typeof window.FavoritesAPI.removeFavorite === 'function') {
            window.FavoritesAPI.removeFavorite(id);
        } else {
            let favorites = getFavorites();
            favorites = favorites.filter(item => String(item.id) !== String(id));
            localStorage.setItem('step_tech_favorites', JSON.stringify(favorites));
            window.dispatchEvent(new CustomEvent('favorites:updated', { detail: favorites }));
        }
    }
    function renderFavorites() {
        const favorites = getFavorites();
        const totalItems = favorites.length;
        if (window.ProfilePage && typeof window.ProfilePage.setCount === 'function') {
            window.ProfilePage.setCount('favorites', totalItems);
        }
        if (emptyFavContainer) emptyFavContainer.hidden = totalItems > 0;
        if (favListContainer) favListContainer.hidden = totalItems === 0;
        if (!favListContainer || totalItems === 0) {
            if (favListContainer) favListContainer.innerHTML = '';
            return;
        }
        const itemsHtml = favorites.map(item => `
            <div class="favorite-item" data-id="${item.id}" style="display: flex; align-items: center; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #eee;">
                <div style="display: flex; align-items: center; gap: 12px;">
                    ${item.image ? `<img src="${item.image}" alt="${item.name}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 6px;">` : ''}
                    <div>
                        <h4 style="margin: 0; font-size: 1rem;">${item.name || 'Product'}</h4>
                        <span style="font-size: 0.85rem; color: #666;">$${parseFloat(item.price || 0).toFixed(2)}</span>
                    </div>
                </div>
                <div style="display: flex; align-items: center; gap: 10px;">
                    <button 
                        type="button" 
                        class="add-to-cart-btn" 
                        data-id="${item.id}"
                        data-name="${item.name}"
                        data-price="${item.price}"
                        data-image="${item.image}"
                        data-category="${item.category}"
                        style="padding: 6px 12px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;"
                    >
                        Move to Cart
                    </button>
                    <button type="button" class="fav-remove-btn" data-id="${item.id}" style="color: red; background: none; border: none; cursor: pointer; font-size: 1.1rem;" title="Remove">✕</button>
                </div>
            </div>
        `).join('');
        const summaryHtml = `
            <div class="fav-summary" style="margin-top: 20px; padding-top: 15px; border-top: 2px solid #ddd; display: flex; justify-content: space-between; align-items: center;">
                <p style="margin: 0; color: #666;">Total Saved Items: <strong>${totalItems}</strong></p>
                <button type="button" id="clearFavBtn" style="padding: 8px 16px; background-color: #f44336; color: white; border: none; border-radius: 4px; cursor: pointer;">Clear All Favorites</button>
            </div>
        `;
        favListContainer.innerHTML = itemsHtml + summaryHtml;
    }
    document.addEventListener('click', (e) => {
        const target = e.target;
        if (target && target.id === 'clearFavBtn') {
            e.preventDefault();
            clearFavorites();
            return;
        }
        const removeBtn = target.closest('.fav-remove-btn');
        if (removeBtn) {
            e.preventDefault();
            const productId = removeBtn.dataset.id;
            if (productId) {
                removeFavoriteItem(productId);
            }
        }
    });
    window.addEventListener('favorites:updated', renderFavorites);
    renderFavorites();
});