const API_BASE_URL = '';

function getToken() {
    return localStorage.getItem('authToken');
}

function setToken(token) {
    localStorage.setItem('authToken', token);
}

function removeToken() {
    localStorage.removeItem('authToken');
}

function getUsername() {
    return localStorage.getItem('username');
}

function setUsername(username) {
    localStorage.setItem('username', username);
}

function removeUsername() {
    localStorage.removeItem('username');
}


function isLoggedIn() {
    return !!getToken();
}

function redirectToLogin() {
    if (!window.location.pathname.endsWith('login.html')) {
        window.location.href = 'login.html';
    }
}

function redirectToDashboard() {
    if (!window.location.pathname.endsWith('dashboard.html')) {
        window.location.href = 'dashboard.html';
    }
}

function displayMessage(elementId, message, isSuccess) {
    const messageElement = document.getElementById(elementId);
    if (messageElement) {
        messageElement.textContent = message;
        messageElement.className = 'message'; // Reset class
        if (isSuccess) {
            messageElement.classList.add('success');
        } else {
            messageElement.classList.add('error');
        }
        messageElement.style.display = 'block';
    }
}
