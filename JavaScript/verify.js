const API_KEY = 'ebbee9bb-1884-43ad-ae71-afa71ea9460e';
const BASE_URL = 'https://shopapi.stepacademy.ge';

const email = localStorage.getItem('pendingEmail');
const token = localStorage.getItem('accessToken') || '';

function getHeaders() {
    const headers = {
        'Content-Type': 'application/json',
        'accept': '*/*',
        'X-API-KEY': API_KEY
    };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
}
document.querySelector('.verify-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const code = e.target.querySelector('input[name="code"]').value;
    try {
        const response = await fetch(`${BASE_URL}/api/auth/verify-email`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify({ email, code })
        });
        const resData = await response.json().catch(() => null);
        if (response.ok) {
            alert('Email verified successfully!');
            localStorage.removeItem('pendingEmail');
            window.location.href = './signin.html';
        } else {
            alert(resData?.detail || resData?.message || 'Invalid code!');
        }
    } catch (err) {
        console.error(err);
        alert('Network error. Check console for details.');
    }
});
document.querySelector('.resend-link').addEventListener('click', async (e) => {
    e.preventDefault();
    if (!email) return alert('No email found to resend verification.');
    try {
        const response = await fetch(`${BASE_URL}/api/auth/resend-email-verification/${encodeURIComponent(email)}`, {
            method: 'POST',
            headers: getHeaders()
        });
        const resData = await response.json().catch(() => null);
        if (response.ok) {
            alert('Verification code sent again!');
        } else {
            alert(resData?.detail || resData?.message || 'Failed to resend code.');
        }
    } catch (err) {
        console.error(err);
        alert('Network error. Check console for details.');
    }
});