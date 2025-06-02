document.addEventListener('DOMContentLoaded', async () => {
    if (!isLoggedIn()) {
        redirectToLogin();
        return;
    }

    const usernameDisplay = document.getElementById('usernameDisplay');
    const logoutButton = document.getElementById('logoutButton');

    const storedUsername = getUsername();
    if (storedUsername) {
        usernameDisplay.textContent = storedUsername;
    } else {
        // Jika username tidak ada di localStorage, coba ambil dari server
        // Ini berguna jika pengguna langsung membuka dashboard setelah login di tab lain
        // atau jika localStorage terhapus tapi token masih valid.
        try {
            const token = getToken();
            const response = await fetch(`${API_BASE_URL}/api/user`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (response.ok) {
                const userData = await response.json();
                usernameDisplay.textContent = userData.username;
                setUsername(userData.username); // Simpan lagi untuk konsistensi
            } else if (response.status === 401 || response.status === 403) {
                // Token tidak valid atau tidak ada
                removeToken();
                removeUsername();
                redirectToLogin();
            } else {
                console.error('Gagal mengambil data pengguna:', response.statusText);
                usernameDisplay.textContent = 'Pengguna'; // Fallback
            }
        } catch (error) {
            console.error('Error fetching user data:', error);
            usernameDisplay.textContent = 'Pengguna'; // Fallback
            // Mungkin token expired, redirect ke login
            removeToken();
            removeUsername();
            redirectToLogin();
        }
    }


    logoutButton.addEventListener('click', () => {
        removeToken();
        removeUsername();
        displayMessage('message', 'Anda telah logout.', true); // Perlu elemen message di dashboard.html jika mau
        setTimeout(() => {
            redirectToLogin();
        }, 1000);
    });
});
