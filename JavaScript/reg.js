const API_KEY = 'ebbee9bb-1884-43ad-ae71-afa71ea9460e';
const BASE_URL = 'https://shopapi.stepacademy.ge';

document.addEventListener('DOMContentLoaded', () => {
    const regForm = document.querySelector('.reg-form');
    if (!regForm) return;
    regForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const body = Object.fromEntries(formData.entries());
        const userEmail = body.email || regForm.querySelector('input[type="email"]')?.value?.trim();
        if (!userEmail) {
            alert('Please enter a valid email address.');
            return;
        }
        const firstNameVal = body.firstName || body.first_name || regForm.querySelector('input[name="firstName"], input[name="first_name"]')?.value;
        const lastNameVal = body.lastName || body.last_name || regForm.querySelector('input[name="lastName"], input[name="last_name"]')?.value;
        if (firstNameVal) localStorage.setItem('userFirstName', firstNameVal.trim());
        if (lastNameVal) localStorage.setItem('userLastName', lastNameVal.trim());
        const token = localStorage.getItem('accessToken') || '';
        const headers = {
            'Content-Type': 'application/json',
            'accept': '*/*',
            'X-API-KEY': API_KEY
        };
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        try {
            const response = await fetch(`${BASE_URL}/api/auth/register`, {
                method: 'POST',
                headers,
                body: JSON.stringify(body)
            });
            const resData = await response.json().catch(() => null);
            if (response.ok) {
                localStorage.setItem('pendingEmail', userEmail);
                localStorage.setItem('pendingVerifyEmail', userEmail);
                const isInHtmlFolder = window.location.pathname.includes('/Html/');
                const targetPath = isInHtmlFolder ? './verify.html' : './Html/verify.html';
                window.location.href = targetPath;
            } else {
                alert(resData?.detail || resData?.message || 'Registration failed!');
            }
        } catch (err) {
            console.error('Registration Error:', err);
            alert('Network error. Check console for details.');
        }
    });
});