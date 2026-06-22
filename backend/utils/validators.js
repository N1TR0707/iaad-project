// Validation utilities

const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePassword = (password) => {
  // At least 6 characters
  if (password.length < 6) {
    return { valid: false, error: 'Password minimal 6 karakter' };
  }
  return { valid: true };
};

const validateSerialCodeFormat = (serialCode) => {
  // Format: XXXX-XXXX-XXXX-XXXX
  const serialRegex = /^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;
  return serialRegex.test(serialCode.toUpperCase());
};

const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  
  // Remove potentially dangerous characters
  return input
    .trim()
    .replace(/[<>]/g, ''); // Remove < and > to prevent XSS
};

const validatePhone = (phone) => {
  if (!phone) return true; // Phone is optional
  
  // Simple phone validation (Indonesian format)
  const phoneRegex = /^(\+62|62|0)[0-9]{9,12}$/;
  return phoneRegex.test(phone.replace(/[\s-]/g, ''));
};

module.exports = {
  validateEmail,
  validatePassword,
  validateSerialCodeFormat,
  sanitizeInput,
  validatePhone
};
