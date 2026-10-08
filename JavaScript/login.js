const API_KEY = 'ebbee9bb-1884-43ad-ae71-afa71ea9460e';
const BASE_URL = 'https://shopapi.stepacademy.ge';

function parseApiError(raw) {
    if (!raw) return 'Invalid credentials!';
    if (typeof raw === 'object') {
        if (raw.detail) return parseApiError(raw.detail);
        if (raw.message) return parseApiError(raw.message);
    }
    return raw;
}

document.querySelector('.signin-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const body = Object.fromEntries(formData.entries());
    try {
        const response = await fetch(`${BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'accept': '*/*',
                'X-API-KEY': API_KEY
            },
            body: JSON.stringify(body)
        });
        const resData = await response.json().catch(() => null);
        if (response.ok) {
            if (resData?.data?.accessToken) {
                localStorage.setItem('accessToken', resData.data.accessToken);
            }
            if (resData?.data?.refreshToken) {
                localStorage.setItem('refreshToken', resData.data.refreshToken);
            }
            const user = resData?.data?.user || resData?.user || resData?.data;
            if (user) {
                const firstName = user.firstName || user.first_name;
                const lastName = user.lastName || user.last_name;
                if (firstName) localStorage.setItem('userFirstName', firstName);
                if (lastName) localStorage.setItem('userLastName', lastName);
            }
            window.location.href = '../index.html';
        } else {
            alert(parseApiError(resData?.detail || resData?.message || 'Invalid credentials!'));
        }
    } catch (err) {
        console.error(err);
        alert('Network error. Check console for details.');
    }
});