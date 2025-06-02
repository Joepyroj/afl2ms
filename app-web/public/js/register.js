document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('registerForm');
    const messageElement = document.getElementById('message');

    if (isLoggedIn()) { // Menggunakan fungsi dari auth.js
        redirectToDashboard(); // Menggunakan fungsi dari auth.js
        return;
    }

    registerForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        messageElement.style.display = 'none'; // Sembunyikan pesan sebelumnya

        const username = registerForm.username.value.trim();
        const password = registerForm.password.value;
        const confirmPassword = registerForm.confirmPassword.value;

        if (!username || !password || !confirmPassword) {
            displayMessage('message', 'Semua field harus diisi!', false);
            return;
        }

        if (password !== confirmPassword) {
            displayMessage('message', 'Password dan konfirmasi password tidak cocok!', false);
            return;
        }
        if (password.length < 6) {
            displayMessage('message', 'Password minimal 6 karakter!', false);
            return;
        }


        try {
            const response = await fetch(`${API_BASE_URL}/api/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password, confirmPassword }),
            });

            const data = await response.json();

            if (response.ok) {
                displayMessage('message', data.message + " Silakan login.", true);
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 2000);
            } else {
                displayMessage('message', data.message || 'Registrasi gagal.', false);
            }
        } catch (error) {
            console.error('Error:', error);
            displayMessage('message', 'Terjadi kesalahan. Coba lagi nanti.', false);
        }
    });
});
