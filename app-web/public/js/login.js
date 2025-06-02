document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const messageElement = document.getElementById('message');

    if (isLoggedIn()) {
        redirectToDashboard();
        return;
    }

    loginForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        messageElement.style.display = 'none';

        const username = loginForm.username.value.trim();
        const password = loginForm.password.value;

        if (!username || !password) {
            displayMessage('message', 'Username dan password harus diisi!', false);
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/api/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
            });

            const data = await response.json();

            if (response.ok) {
                setToken(data.token); // Simpan token dari auth.js
                setUsername(data.username); // Simpan username
                displayMessage('message', data.message, true);
                setTimeout(() => {
                    redirectToDashboard();
                }, 1000);
            } else {
                displayMessage('message', data.message || 'Login gagal.', false);
            }
        } catch (error) {
            console.error('Error:', error);
            displayMessage('message', 'Terjadi kesalahan. Coba lagi nanti.', false);
        }
    });
});
