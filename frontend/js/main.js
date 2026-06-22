// Common utility functions and API helpers

// API Base URL
const API_BASE = '/api';

// Check if user is authenticated
function checkAuth() {
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = '/login.html';
    return false;
  }
  return true;
}

// Check if admin is authenticated
function checkAdminAuth() {
  const token = localStorage.getItem('adminToken');
  if (!token) {
    window.location.href = '/admin/login.html';
    return false;
  }
  return true;
}

// Logout user
function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '/login.html';
}

// Logout admin
function logoutAdmin() {
  localStorage.removeItem('adminToken');
  localStorage.removeItem('admin');
  window.location.href = '/admin/login.html';
}

// API call helper with authentication
async function apiCall(endpoint, options = {}) {
  const token = localStorage.getItem('token') || localStorage.getItem('adminToken');
  
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    }
  };

  const mergedOptions = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers
    }
  };

  const response = await fetch(`${API_BASE}${endpoint}`, mergedOptions);
  
  // Handle 401 - Unauthorized
  if (response.status === 401) {
    if (localStorage.getItem('adminToken')) {
      logoutAdmin();
    } else {
      logout();
    }
    return null;
  }

  return response;
}

// Format date to Indonesian locale
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}

// Format date to short format
function formatDateShort(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}

// Calculate days remaining
function calculateDaysRemaining(expiredDate) {
  const now = new Date();
  const expired = new Date(expiredDate);
  const diff = expired - now;
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  return days > 0 ? days : 0;
}

// Show loading overlay
function showLoading(show) {
  const overlay = document.getElementById('loadingOverlay');
  if (overlay) {
    overlay.classList.toggle('hidden', !show);
  }
}

// Show alert message
function showAlert(elementId, message, type = 'info') {
  const alertDiv = document.getElementById(elementId);
  if (!alertDiv) return;

  const alertClass = type === 'success' ? 'alert-success' : 
                     type === 'error' ? 'alert-error' : 'alert-info';
  
  alertDiv.className = `alert ${alertClass}`;
  alertDiv.textContent = message;
  alertDiv.classList.remove('hidden');
  
  // Auto hide after 5 seconds
  setTimeout(() => {
    alertDiv.classList.add('hidden');
  }, 5000);
}

// Validate email format
function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

// Format serial code
function formatSerialCode(code) {
  return code.replace(/(.{4})/g, '$1-').slice(0, -1);
}

// Get warranty status badge HTML
function getWarrantyStatusBadge(isExpired, daysRemaining) {
  if (isExpired) {
    return '<span class="badge badge-danger">EXPIRED</span>';
  } else if (daysRemaining <= 7) {
    return '<span class="badge badge-danger">Segera Berakhir</span>';
  } else if (daysRemaining <= 30) {
    return '<span class="badge badge-warning">Perhatian</span>';
  } else {
    return '<span class="badge badge-success">AKTIF</span>';
  }
}

// Handle API errors
function handleApiError(error, defaultMessage = 'Terjadi kesalahan') {
  console.error('API Error:', error);
  return error.message || defaultMessage;
}

// Copy text to clipboard
function copyToClipboard(text) {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).then(() => {
      alert('Berhasil di-copy ke clipboard!');
    }).catch(() => {
      alert('Gagal copy ke clipboard');
    });
  } else {
    // Fallback for older browsers
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    alert('Berhasil di-copy ke clipboard!');
  }
}

// Debounce function for search inputs
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Export functions for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    checkAuth,
    checkAdminAuth,
    logout,
    logoutAdmin,
    apiCall,
    formatDate,
    formatDateShort,
    calculateDaysRemaining,
    showLoading,
    showAlert,
    validateEmail,
    formatSerialCode,
    getWarrantyStatusBadge,
    handleApiError,
    copyToClipboard,
    debounce
  };
}
