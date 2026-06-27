// Auth helper functions
function getAuthToken() {
    return localStorage.getItem('token');
}

function setAuthToken(token) {
    localStorage.setItem('token', token);
}

function removeAuthToken() {
    localStorage.removeItem('token');
}

function isAuthenticated() {
    return !!getAuthToken();
}

function getAuthHeaders() {
    const token = getAuthToken();
    return token ? {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    } : {
        'Content-Type': 'application/json'
    };
}

// Check authentication status
async function checkAuth() {
    const token = getAuthToken();
    if (!token) {
        window.location.href = '/login.html';
        return false;
    }
    
    try {
        const response = await fetch('/api/auth/verify', {
            headers: getAuthHeaders()
        });
        
        if (!response.ok) {
            removeAuthToken();
            window.location.href = '/login.html';
            return false;
        }
        
        return true;
    } catch (error) {
        console.error('Auth check failed:', error);
        removeAuthToken();
        window.location.href = '/login.html';
        return false;
    }
}

// Logout function
function logout() {
    removeAuthToken();
    window.location.href = '/login.html';
}
