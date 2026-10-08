const API_KEY = 'ebbee9bb-1884-43ad-ae71-afa71ea9460e';
const BASE_URL = 'https://shopapi.stepacademy.ge';

(() => {
    'use strict';
    const isInsideSubfolder = window.location.pathname.toLowerCase().includes('/html/');
    const INDEX_PATH = isInsideSubfolder ? '../index.html' : 'index.html';
    const SIGNIN_PATH = isInsideSubfolder ? 'signin.html' : 'Html/signin.html';
    const CONFIG = {
        loginPage: SIGNIN_PATH,
        authStorageKeys: ['token', 'accessToken', 'user', 'currentUser', 'userFirstName', 'userLastName']
    };
    const TABS = ['profile', 'cart', 'favorites', 'settings'];
    const TITLES = {
        profile: 'My Profile',
        cart: 'Shopping Cart',
        favorites: 'My Favorites',
        settings: 'Account Settings'
    };
    const logoutBtn = document.getElementById('logoutBtn');
    const profileForm = document.getElementById('profileForm');
    const saveBtn = document.getElementById('saveBtn');
    const discardBtn = document.getElementById('discardBtn');
    const avatarInput = document.getElementById('avatarUrl');
    const photoPreview = document.getElementById('photoPreview');
    const passwordForm = document.getElementById('passwordForm');
    const updatePasswordBtn = document.getElementById('updatePasswordBtn');
    const deleteBtn = document.getElementById('deleteAccountBtn');
    const deleteDialog = document.getElementById('deleteDialog');
    const deleteCancelBtn = document.getElementById('deleteCancelBtn');
    const deleteConfirmBtn = document.getElementById('deleteConfirmBtn');
    const fields = {
        firstName: document.getElementById('firstName'),
        lastName: document.getElementById('lastName'),
        email: document.getElementById('email'),
        birthDate: document.getElementById('birthDate'),
        phone: document.getElementById('phone'),
        address: document.getElementById('address'),
        avatarUrl: avatarInput
    };
    let baseline = {};
    function getToken() {
        return localStorage.getItem('accessToken') || localStorage.getItem('token');
    }
    function getAuthHeaders() {
        const token = getToken();
        const headers = {
            'Content-Type': 'application/json',
            'X-API-KEY': API_KEY
        };
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        return headers;
    }
    function getTabFromHash() {
        const name = location.hash.replace('#', '');
        return TABS.includes(name) ? name : 'profile';
    }
    function showTab(name) {
        const panels = document.querySelectorAll('[data-panel]');
        const tabLinks = document.querySelectorAll('.control-panel a[data-tab], .prf-control-panel [data-tab]');
        panels.forEach((panel) => {
            panel.hidden = panel.dataset.panel !== name;
        });
        tabLinks.forEach((link) => {
            const isActive = link.dataset.tab === name;
            link.classList.toggle('active', isActive);
            if (isActive) {
                link.setAttribute('aria-current', 'page');
            } else {
                link.removeAttribute('aria-current');
            }
        });
        if (TITLES[name]) {
            document.title = TITLES[name] + ' | Step Tech';
        }
        document.dispatchEvent(new CustomEvent('tab:change', { detail: { tab: name } }));
    }
    window.addEventListener('hashchange', () => {
        showTab(getTabFromHash());
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            CONFIG.authStorageKeys.forEach((key) => {
                localStorage.removeItem(key);
                sessionStorage.removeItem(key);
            });
            sessionStorage.clear();
            window.location.href = INDEX_PATH;
        });
    }
    function showError(input, message) {
        if (!input) return;
        const field = input.closest('.prf-field') || input.closest('.field');
        if (!field) return;
        const target = field.querySelector('[data-error-for="' + input.id + '"]');
        field.classList.toggle('has-error', Boolean(message));
        if (target) target.textContent = message || '';
    }
    function clearError(input) {
        showError(input, '');
    }
    function getFormData() {
        const data = {};
        Object.keys(fields).forEach((key) => {
            if (fields[key]) {
                data[key] = fields[key].value.trim();
            }
        });
        return data;
    }
    function isDirty() {
        const now = getFormData();
        return Object.keys(now).some((key) => now[key] !== (baseline[key] || ''));
    }
    function updateButtons() {
        if (discardBtn) discardBtn.disabled = !isDirty();
    }
    function getInitials(first, last) {
        const a = (first || '').trim().charAt(0);
        const b = (last || '').trim().charAt(0);
        return (a + b).toUpperCase() || 'U';
    }
    function setAvatar(container, url) {
        if (!container) return;
        const img = container.querySelector('img');
        const initials = container.querySelector('[data-user-initials]');
        if (!img) return;
        if (url) {
            img.onload = () => {
                img.hidden = false;
                if (initials) initials.hidden = true;
            };
            img.onerror = () => {
                img.hidden = true;
                img.removeAttribute('src');
                if (initials) initials.hidden = false;
            };
            img.src = url;
        } else {
            img.hidden = true;
            img.removeAttribute('src');
            if (initials) initials.hidden = false;
        }
    }
    function updateInitials() {
        const firstNameVal = fields.firstName ? fields.firstName.value : '';
        const lastNameVal = fields.lastName ? fields.lastName.value : '';
        const text = getInitials(firstNameVal, lastNameVal);
        document.querySelectorAll('[data-user-initials]').forEach((el) => {
            el.textContent = text;
        });
    }
    async function loadUserProfile() {
        const token = getToken();
        if (!token) {
            window.location.href = SIGNIN_PATH;
            return;
        }
        try {
            const response = await fetch(`${BASE_URL}/api/users/me`, {
                method: 'GET',
                headers: getAuthHeaders()
            });
            if (!response.ok) {
                if (response.status === 401) {
                    window.location.href = SIGNIN_PATH;
                    return;
                }
                throw new Error('Failed to load profile details');
            }
            const userData = await response.json();
            populateUserData(userData);
        } catch (err) {
            console.error('Profile fetch error:', err);
        }
    }
    function populateUserData(user = {}) {
        const details = user.details || {};
        if (fields.firstName) fields.firstName.value = user.firstName || '';
        if (fields.lastName) fields.lastName.value = user.lastName || '';
        if (fields.email) fields.email.value = user.email || '';
        if (fields.phone) fields.phone.value = details.phoneNumber || user.phoneNumber || '';
        if (fields.address) fields.address.value = details.address || user.address || '';
        if (fields.avatarUrl) fields.avatarUrl.value = details.pictureUrl || user.pictureUrl || '';
        const dob = details.dob || user.dateOfBirth || user.dob || '';
        if (fields.birthDate) fields.birthDate.value = dob ? String(dob).slice(0, 10) : '';
        const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
        document.querySelectorAll('[data-user-name]').forEach((el) => {
            el.textContent = fullName || 'User Name';
        });
        document.querySelectorAll('[data-user-email]').forEach((el) => {
            el.textContent = user.email || '';
        });
        localStorage.setItem('userFirstName', user.firstName || '');
        localStorage.setItem('userLastName', user.lastName || '');
        updateInitials();
        const pic = details.pictureUrl || user.pictureUrl || '';
        setAvatar(document.querySelector('[data-user-avatar]'), pic);
        if (photoPreview) setAvatar(photoPreview, pic);
        baseline = getFormData();
        updateButtons();
    }
    async function saveUserProfile(e) {
        e.preventDefault();
        if (!validateProfile()) return;
        if (saveBtn) saveBtn.disabled = true;

        const dobVal = fields.birthDate && fields.birthDate.value
            ? new Date(fields.birthDate.value).toISOString()
            : new Date("2000-01-01").toISOString();

        const payload = {
            firstName: fields.firstName.value.trim(),
            lastName: fields.lastName.value.trim(),
            email: fields.email.value.trim(),
            phoneNumber: fields.phone ? fields.phone.value.trim() : '',
            address: fields.address ? fields.address.value.trim() : '',
            pictureUrl: fields.avatarUrl ? fields.avatarUrl.value.trim() : '',
            dateOfBirth: dobVal
        };

        try {
            const response = await fetch(`${BASE_URL}/api/users`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errText = await response.text();
                let msg = 'Failed to update profile';
                try {
                    const parsed = JSON.parse(errText);
                    msg = parsed.detail || parsed.message || msg;
                } catch (pErr) {
                    msg = errText || msg;
                }
                throw new Error(msg);
            }

            alert('Profile updated successfully!');
            await loadUserProfile();
        } catch (err) {
            console.error('Update profile error:', err);
            alert(err.message);
        } finally {
            if (saveBtn) saveBtn.disabled = false;
        }
    }
    function validateProfile() {
        let valid = true;
        ['firstName', 'lastName'].forEach((name) => {
            if (fields[name] && !fields[name].value.trim()) {
                showError(fields[name], 'This field is required');
                valid = false;
            } else if (fields[name]) {
                clearError(fields[name]);
            }
        });
        return valid;
    }
    if (profileForm) {
        profileForm.addEventListener('input', (e) => {
            if (e.target === avatarInput && photoPreview) {
                setAvatar(photoPreview, avatarInput.value.trim());
            }
            if (e.target === fields.firstName || e.target === fields.lastName) {
                updateInitials();
            }
            if (e.target.id) clearError(e.target);
            updateButtons();
        });
        profileForm.addEventListener('submit', saveUserProfile);
    }
    if (discardBtn) {
        discardBtn.addEventListener('click', () => {
            Object.keys(fields).forEach((key) => {
                if (fields[key]) {
                    fields[key].value = baseline[key] || '';
                    clearError(fields[key]);
                }
            });
            if (photoPreview) setAvatar(photoPreview, baseline.avatarUrl);
            updateInitials();
            updateButtons();
        });
    }
    const pw = {
        current: document.getElementById('currentPassword'),
        next: document.getElementById('newPassword'),
        confirm: document.getElementById('confirmPassword')
    };
    if (passwordForm) {
        passwordForm.addEventListener('click', (e) => {
            const btn = e.target.closest('.prf-toggle-eye, .toggle-eye');
            if (!btn) return;
            const input = btn.parentElement.querySelector('input');
            const use = btn.querySelector('use');
            const show = input.type === 'password';
            input.type = show ? 'text' : 'password';
            if (use) use.setAttribute('href', show ? '#i-eye-off' : '#i-eye');
            btn.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
        });
        passwordForm.addEventListener('input', (e) => {
            if (e.target.id) clearError(e.target);
        });
        passwordForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!validatePassword()) return;
            if (updatePasswordBtn) updatePasswordBtn.disabled = true;
            const payload = {
                currentPassword: pw.current.value,
                newPassword: pw.next.value
            };
            try {
                const response = await fetch(`${BASE_URL}/api/users/change-password`, {
                    method: 'PUT',
                    headers: getAuthHeaders(),
                    body: JSON.stringify(payload)
                });
                if (!response.ok) {
                    const errText = await response.text();
                    throw new Error(errText || 'Current password incorrect');
                }
                alert('Password changed successfully!');
                resetPasswordForm();
            } catch (err) {
                console.error('Password change error:', err);
                alert('Password change failed: ' + err.message);
            } finally {
                if (updatePasswordBtn) updatePasswordBtn.disabled = false;
            }
        });
    }
    function validatePassword() {
        let valid = true;
        if (!pw.current || !pw.current.value) {
            if (pw.current) showError(pw.current, 'Enter your current password');
            valid = false;
        }
        if (!pw.next || !pw.next.value) {
            if (pw.next) showError(pw.next, 'Enter a new password');
            valid = false;
        } else if (pw.next.value.length < 8) {
            showError(pw.next, 'Password must be at least 8 characters');
            valid = false;
        } else if (pw.current && pw.next.value === pw.current.value) {
            showError(pw.next, 'New password must be different from current password');
            valid = false;
        }
        if (!pw.confirm || !pw.confirm.value) {
            if (pw.confirm) showError(pw.confirm, 'Confirm your new password');
            valid = false;
        } else if (pw.next && pw.confirm.value !== pw.next.value) {
            showError(pw.confirm, 'Passwords do not match');
            valid = false;
        }
        return valid;
    }
    function resetPasswordForm() {
        if (!passwordForm) return;
        passwordForm.reset();
        passwordForm.querySelectorAll('input').forEach((input) => {
            input.type = 'password';
            clearError(input);
        });
        passwordForm.querySelectorAll('.prf-toggle-eye, .toggle-eye').forEach((btn) => {
            const use = btn.querySelector('use');
            if (use) use.setAttribute('href', '#i-eye');
            btn.setAttribute('aria-label', 'Show password');
        });
        if (updatePasswordBtn) updatePasswordBtn.disabled = false;
    }
    function openDeleteDialog() {
        if (!deleteDialog) return;
        if (typeof deleteDialog.showModal === 'function') {
            deleteDialog.showModal();
        } else if (window.confirm('Delete your account? This cannot be undone.')) {
            confirmDelete();
        }
    }
    async function confirmDelete() {
        if (deleteDialog && deleteDialog.open) deleteDialog.close();
        try {
            const response = await fetch(`${BASE_URL}/api/users/delete-profile`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });
            if (!response.ok) {
                const errText = await response.text();
                throw new Error(errText || 'Failed to delete account');
            }
            alert('Account deleted successfully.');
            CONFIG.authStorageKeys.forEach((key) => localStorage.removeItem(key));
            window.location.href = INDEX_PATH;
        } catch (err) {
            console.error('Delete account error:', err);
            alert('Failed to delete account: ' + err.message);
        }
    }
    if (deleteBtn) deleteBtn.addEventListener('click', openDeleteDialog);
    if (deleteCancelBtn) deleteCancelBtn.addEventListener('click', () => deleteDialog && deleteDialog.close());
    if (deleteConfirmBtn) deleteConfirmBtn.addEventListener('click', confirmDelete);
    if (deleteDialog) {
        deleteDialog.addEventListener('click', (e) => {
            if (e.target === deleteDialog) deleteDialog.close();
        });
    }
    const COUNT_TEXT = {
        cart: (n) => n + (n === 1 ? ' item' : ' items') + ' in your cart',
        favorites: (n) => n + (n === 1 ? ' item' : ' items') + ' saved'
    };
    function setCount(type, count) {
        const n = Number(count) || 0;
        const label = document.querySelector('[data-count="' + type + '"]');
        const list = document.querySelector('[data-list="' + type + '"]');
        const empty = document.querySelector('[data-empty="' + type + '"]');
        if (label && COUNT_TEXT[type]) label.textContent = COUNT_TEXT[type](n);
        if (list) list.hidden = n === 0;
        if (empty) empty.hidden = n > 0;
    }
    window.ProfilePage = {
        loadUserProfile,
        setCount,
        goTo(name) {
            if (TABS.includes(name)) location.hash = name;
        }
    };
    showTab(getTabFromHash());
    loadUserProfile();
})();
document.addEventListener('DOMContentLoaded', () => {
    const isInsideSubfolder = window.location.pathname.toLowerCase().includes('/html/');
    const HTML_DIR = isInsideSubfolder ? '' : 'Html/';
    const categoriesDropdown = document.getElementById('categoriesDropdown');
    const searchInputHeader = document.getElementById('searchInputHeader');
    const clearBtn = document.getElementById('clearBtn');
    const hamburgerBtn = document.getElementById('hamburgerBtn');
    const navList = document.getElementById('navList');
    const menuOverlay = document.getElementById('menuOverlay');
    const navButtons = document.querySelectorAll('.prf-control-panel [data-tab]');
    function renderHeaderAuth() {
        const authContainer = document.getElementById('authContainer') || document.querySelector('.hdr-auth-container');
        if (!authContainer) return;
        const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
        const isLoggedIn = Boolean(token);
        if (isLoggedIn) {
            const firstName = localStorage.getItem('userFirstName') || '';
            const lastName = localStorage.getItem('userLastName') || '';
            const initial = ((firstName ? firstName.charAt(0) : '') + (lastName ? lastName.charAt(0) : '')).toUpperCase() || 'U';
            authContainer.innerHTML = `
                <div class="hdr-actions" style="display: flex; align-items: center; gap: 12px;">
                    <a href="${HTML_DIR}profile.html#favorites" class="hdr-action-btn" title="Favorites">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l8.72-8.72 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                        </svg>
                    </a>
                    <a href="${HTML_DIR}profile.html#cart" class="hdr-action-btn" title="Cart">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="9" cy="21" r="1"></circle>
                            <circle cx="20" cy="21" r="1"></circle>
                            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                        </svg>
                    </a>
                    <a href="${HTML_DIR}profile.html" class="hdr-avatar-btn" title="My Profile">
                        <span class="hdr-avatar-initial">${initial}</span>
                    </a>
                </div>
            `;
        } else {
            authContainer.innerHTML = `
                <a class="hdr-sign-in-a" href="${HTML_DIR}signin.html">
                    <button class="hdr-sign-in-btn">Sign In</button>
                </a>
            `;
        }
    }
    async function loadCategories() {
        if (!categoriesDropdown) return;
        try {
            const response = await fetch(`${BASE_URL}/api/categories`, {
                headers: {
                    'X-API-KEY': API_KEY,
                    'Content-Type': 'application/json'
                }
            });
            if (!response.ok) throw new Error('Failed to fetch categories');
            const result = await response.json();
            const categories = result.data || result;
            categoriesDropdown.innerHTML = '';
            if (!categories || categories.length === 0) {
                categoriesDropdown.innerHTML = '<li><a href="#">No categories found</a></li>';
                return;
            }
            categories.forEach((cat) => {
                const li = document.createElement('li');
                li.innerHTML = `
                    <a href="${HTML_DIR}shop.html?category=${encodeURIComponent(cat.id)}">
                        <span>${cat.name}</span>
                        <span class="count">${cat.productCount || 0}</span>
                    </a>
                `;
                categoriesDropdown.appendChild(li);
            });
        } catch (error) {
            categoriesDropdown.innerHTML = '<li class="hdr-dropdown-error">Failed to load categories</li>';
        }
    }
    function initHeaderSearch() {
        if (!searchInputHeader) return;
        const toggleClearBtn = () => {
            if (clearBtn) {
                clearBtn.style.display = searchInputHeader.value.trim() ? 'block' : 'none';
            }
        };
        toggleClearBtn();
        searchInputHeader.addEventListener('input', toggleClearBtn);
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                searchInputHeader.value = '';
                toggleClearBtn();
                searchInputHeader.focus();
            });
        }
        searchInputHeader.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const query = searchInputHeader.value.trim();
                if (query) {
                    window.location.href = `${HTML_DIR}shop.html?search=${encodeURIComponent(query)}`;
                }
            }
        });
    }
    function initMobileMenu() {
        if (!hamburgerBtn || !navList) return;
        const toggleMenu = () => {
            const isOpen = navList.classList.toggle('open');
            hamburgerBtn.classList.toggle('hdr-active', isOpen);
            document.body.classList.toggle('menu-open', isOpen);
            if (menuOverlay) menuOverlay.classList.toggle('open', isOpen);
        };
        hamburgerBtn.addEventListener('click', toggleMenu);
        if (menuOverlay) menuOverlay.addEventListener('click', toggleMenu);
    }
    function initTabNavigation() {
        navButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const targetTab = btn.getAttribute('data-tab');
                window.location.hash = targetTab;
            });
        });
    }

    renderHeaderAuth();
    loadCategories();
    initHeaderSearch();
    initMobileMenu();
    initTabNavigation();
});