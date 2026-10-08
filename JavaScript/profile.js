const API_KEY = 'ebbee9bb-1884-43ad-ae71-afa71ea9460e';
const BASE_URL = 'https://shopapi.stepacademy.ge';

(() => {
    'use strict';
    const isInsideSubfolder = window.location.pathname.toLowerCase().includes('/html/');
    const INDEX_PATH = isInsideSubfolder ? '../index.html' : 'index.html';
    const CONFIG = {
        loginPage: INDEX_PATH,
        authStorageKeys: ['token', 'accessToken', 'user', 'currentUser']
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
    let baseline = getFormData();
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
            e.stopPropagation();
            CONFIG.authStorageKeys.forEach((key) => {
                localStorage.removeItem(key);
                sessionStorage.removeItem(key);
            });
            sessionStorage.clear();
            window.location.href = CONFIG.loginPage;
        });
    }
    function showError(input, message) {
        if (!input) return;
        const field = input.closest('.field');
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
        return Object.keys(now).some((key) => now[key] !== baseline[key]);
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
        const phone = fields.phone ? fields.phone.value.trim() : '';
        if (phone && !/^\+?[0-9\s\-()]{7,20}$/.test(phone)) {
            showError(fields.phone, 'Enter a valid phone number');
            valid = false;
        } else if (fields.phone) {
            clearError(fields.phone);
        }
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
        profileForm.addEventListener('submit', (e) => {
            e.preventDefault();
            if (!validateProfile()) return;
            if (saveBtn) saveBtn.disabled = true;
            document.dispatchEvent(new CustomEvent('profile:save', { detail: getFormData() }));
            setTimeout(() => { if (saveBtn) saveBtn.disabled = false; }, 600);
        });
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
            const btn = e.target.closest('.toggle-eye');
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
        passwordForm.addEventListener('submit', (e) => {
            e.preventDefault();
            if (!validatePassword()) return;
            if (updatePasswordBtn) updatePasswordBtn.disabled = true;
            document.dispatchEvent(new CustomEvent('password:update', {
                detail: {
                    currentPassword: pw.current.value,
                    newPassword: pw.next.value
                }
            }));
            setTimeout(() => { if (updatePasswordBtn) updatePasswordBtn.disabled = false; }, 600);
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
            showError(pw.next, 'New password must be different from the current one');
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
        passwordForm.querySelectorAll('.toggle-eye').forEach((btn) => {
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
    function confirmDelete() {
        if (deleteDialog && deleteDialog.open) deleteDialog.close();
        document.dispatchEvent(new CustomEvent('account:delete'));
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
        setUser(user = {}) {
            const set = (key, value) => { if (fields[key]) fields[key].value = value || ''; };
            set('firstName', user.firstName);
            set('lastName', user.lastName);
            set('email', user.email);
            set('birthDate', user.birthDate ? String(user.birthDate).slice(0, 10) : '');
            set('phone', user.phone);
            set('address', user.address);
            set('avatarUrl', user.avatarUrl);
            const fullName = ((user.firstName || '') + ' ' + (user.lastName || '')).trim();
            document.querySelectorAll('[data-user-name]').forEach((el) => {
                el.textContent = fullName || 'User Name';
            });
            document.querySelectorAll('[data-user-email]').forEach((el) => {
                el.textContent = user.email || '';
            });
            updateInitials();
            setAvatar(document.querySelector('[data-user-avatar]'), user.avatarUrl || '');
            if (photoPreview) setAvatar(photoPreview, user.avatarUrl || '');
            baseline = getFormData();
            updateButtons();
        },
        getFormData,
        markSaved() {
            baseline = getFormData();
            if (saveBtn) saveBtn.disabled = false;
            updateButtons();
        },
        passwordUpdated: resetPasswordForm,
        setCount,
        goTo(name) {
            if (TABS.includes(name)) location.hash = name;
        }
    };
    showTab(getTabFromHash());
    updateInitials();
    updateButtons();
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
    const profileForm = document.getElementById('profileForm');
    const passwordForm = document.getElementById('passwordForm');
    const discardBtn = document.getElementById('discardBtn');
    const avatarInput = document.getElementById('avatarUrl');
    const photoPreview = document.getElementById('photoPreview');
    function renderHeaderAuth() {
        const authContainer = document.getElementById('authContainer') || document.querySelector('.auth-header-container');
        if (!authContainer) return;
        const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
        const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
        const isLoggedIn = Boolean(token || currentUser.email);
        if (isLoggedIn) {
            const initial = (currentUser.firstName ? currentUser.firstName.charAt(0) : (currentUser.email ? currentUser.email.charAt(0) : 'U')).toUpperCase();
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
                        ${currentUser.avatarUrl
                    ? `<img src="${currentUser.avatarUrl}" alt="Profile" class="hdr-avatar-img">`
                    : `<span class="hdr-avatar-initial">${initial}</span>`
                }
                    </a>
                </div>
            `;
        } else {
            authContainer.innerHTML = `
                <a class="sign-in-a" href="${HTML_DIR}signin.html">
                    <button class="sign-in-btn-element">Sign In</button>
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
    function loadUserData() {
        const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
        const nameElements = document.querySelectorAll('[data-user-name]');
        const emailElements = document.querySelectorAll('[data-user-email]');
        const initialsElements = document.querySelectorAll('[data-user-initials]');
        const avatarContainers = document.querySelectorAll('[data-user-avatar]');
        const fullName = `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim() || 'User Name';
        const initials = `${(currentUser.firstName || 'U')[0]}${(currentUser.lastName || '')[0] || ''}`.toUpperCase();
        nameElements.forEach(el => el.textContent = fullName);
        emailElements.forEach(el => el.textContent = currentUser.email || 'user@email.com');
        initialsElements.forEach(el => el.textContent = initials);
        if (currentUser.avatarUrl) {
            avatarContainers.forEach(container => {
                const img = container.querySelector('img');
                const span = container.querySelector('span');
                if (img) {
                    img.src = currentUser.avatarUrl;
                    img.hidden = false;
                }
                if (span) span.hidden = true;
            });
            if (photoPreview) {
                const previewImg = photoPreview.querySelector('img');
                const previewSpan = photoPreview.querySelector('span');
                if (previewImg) {
                    previewImg.src = currentUser.avatarUrl;
                    previewImg.hidden = false;
                }
                if (previewSpan) previewSpan.hidden = true;
            }
        }
        if (profileForm) {
            if (profileForm.elements['firstName']) profileForm.elements['firstName'].value = currentUser.firstName || '';
            if (profileForm.elements['lastName']) profileForm.elements['lastName'].value = currentUser.lastName || '';
            if (profileForm.elements['email']) profileForm.elements['email'].value = currentUser.email || '';
            if (profileForm.elements['birthDate']) profileForm.elements['birthDate'].value = currentUser.birthDate || '';
            if (profileForm.elements['phone']) profileForm.elements['phone'].value = currentUser.phone || '';
            if (profileForm.elements['address']) profileForm.elements['address'].value = currentUser.address || '';
            if (profileForm.elements['avatarUrl']) profileForm.elements['avatarUrl'].value = currentUser.avatarUrl || '';
        }
    }
    function initFormInteractions() {
        if (!profileForm) return;
        profileForm.addEventListener('input', () => {
            if (discardBtn) discardBtn.disabled = false;
        });
        if (discardBtn) {
            discardBtn.addEventListener('click', () => {
                loadUserData();
                discardBtn.disabled = true;
            });
        }
        if (avatarInput && photoPreview) {
            avatarInput.addEventListener('input', () => {
                const url = avatarInput.value.trim();
                const img = photoPreview.querySelector('img');
                const span = photoPreview.querySelector('span');
                if (url && img) {
                    img.src = url;
                    img.hidden = false;
                    if (span) span.hidden = true;
                } else if (img) {
                    img.hidden = true;
                    if (span) span.hidden = false;
                }
            });
        }
        profileForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
            const updatedUser = {
                ...currentUser,
                firstName: profileForm.elements['firstName'] ? profileForm.elements['firstName'].value.trim() : '',
                lastName: profileForm.elements['lastName'] ? profileForm.elements['lastName'].value.trim() : '',
                birthDate: profileForm.elements['birthDate'] ? profileForm.elements['birthDate'].value : '',
                phone: profileForm.elements['phone'] ? profileForm.elements['phone'].value.trim() : '',
                address: profileForm.elements['address'] ? profileForm.elements['address'].value.trim() : '',
                avatarUrl: profileForm.elements['avatarUrl'] ? profileForm.elements['avatarUrl'].value.trim() : ''
            };
            localStorage.setItem('currentUser', JSON.stringify(updatedUser));
            if (discardBtn) discardBtn.disabled = true;
            loadUserData();
            renderHeaderAuth();
            alert('Profile updated successfully!');
        });
        if (passwordForm) {
            passwordForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const currentPass = passwordForm.elements['currentPassword'] ? passwordForm.elements['currentPassword'].value : '';
                const newPass = passwordForm.elements['newPassword'] ? passwordForm.elements['newPassword'].value : '';
                const confirmPass = passwordForm.elements['confirmPassword'] ? passwordForm.elements['confirmPassword'].value : '';
                if (!currentPass || !newPass || !confirmPass) {
                    alert('Please fill in all password fields.');
                    return;
                }
                if (newPass !== confirmPass) {
                    alert('New passwords do not match.');
                    return;
                }
                alert('Password updated successfully!');
                passwordForm.reset();
            });
        }
        document.querySelectorAll('.prf-toggle-eye').forEach(btn => {
            btn.addEventListener('click', () => {
                const input = btn.previousElementSibling;
                if (!input) return;
                const isPassword = input.type === 'password';
                input.type = isPassword ? 'text' : 'password';
                const useTag = btn.querySelector('use');
                if (useTag) {
                    useTag.setAttribute('href', isPassword ? '#i-eye-off' : '#i-eye');
                }
            });
        });
    }
    renderHeaderAuth();
    loadCategories();
    initHeaderSearch();
    initMobileMenu();
    initTabNavigation();
    loadUserData();
    initFormInteractions();
});