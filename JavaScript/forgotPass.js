const API_KEY = 'ebbee9bb-1884-43ad-ae71-afa71ea9460e';
const BASE_URL = 'https://shopapi.stepacademy.ge';

const token = localStorage.getItem('accessToken') || '';

function getHeaders() {
    const headers = {
        'accept': '*/*',
        'X-API-KEY': API_KEY
    };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
}

const form = document.querySelector('.forgot-form');

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = form.querySelector('input[name="email"]').value;
    try {
        const response = await fetch(`${BASE_URL}/api/auth/forget-password/${encodeURIComponent(email)}`, {
            method: 'POST',
            headers: getHeaders()
        });
        const resData = await response.json().catch(() => null);
        if (response.ok) {
            alert('Reset link/instructions sent to your email.');
        } else {
            alert(resData?.detail || resData?.message || 'Email not found.');
        }
    } catch (err) {
        console.error(err);
        alert('Network error. Check console for details.');
    }
});

const urlParams = new URLSearchParams(window.location.search);
const resetToken = urlParams.get('token');

if (resetToken) {
    async function resetPassword(newPassword) {
        try {
            const headers = getHeaders();
            headers['Content-Type'] = 'application/json';
            const response = await fetch(`${BASE_URL}/api/auth/reset-password`, {
                method: 'PUT',
                headers,
                body: JSON.stringify({ token: resetToken, password: newPassword })
            });
            const resData = await response.json().catch(() => null);
            if (response.ok) {
                alert('Password reset successful!');
                window.location.href = './signin.html';
            } else {
                alert(resData?.detail || resData?.message || 'Password reset failed.');
            }
        } catch (err) {
            console.error(err);
            alert('Network error. Check console for details.');
        }
    }
}