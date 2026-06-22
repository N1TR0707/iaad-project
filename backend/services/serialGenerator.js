const SerialNumber = require('../models/SerialNumber');

class SerialGenerator {
  // Characters to use (excluding confusing ones: 0, O, I, 1)
  static CHARS = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';

  // Generate a random character from allowed set
  static getRandomChar() {
    return this.CHARS[Math.floor(Math.random() * this.CHARS.length)];
  }

  // Calculate checksum for validation
  static calculateChecksum(code) {
    let sum = 0;
    for (let i = 0; i < code.length; i++) {
      const charIndex = this.CHARS.indexOf(code[i]);
      sum += charIndex * (i + 1);
    }
    const checksumIndex = sum % this.CHARS.length;
    return this.CHARS[checksumIndex];
  }

  // Generate a single serial code
  static generateCode() {
    // Generate 14 random characters (4 blocks of 3 chars + 2 chars for checksum)
    let code = '';
    for (let i = 0; i < 14; i++) {
      code += this.getRandomChar();
    }

    // Calculate and append 2-character checksum
    const checksum1 = this.calculateChecksum(code);
    const checksum2 = this.calculateChecksum(code + checksum1);
    code += checksum1 + checksum2;

    // Format as XXXX-XXXX-XXXX-XXXX
    return code.match(/.{1,4}/g).join('-');
  }

  // Validate serial code format and checksum
  static validateCode(serialCode) {
    // Remove dashes and convert to uppercase
    const code = serialCode.replace(/-/g, '').toUpperCase();

    // Check length (16 characters)
    if (code.length !== 16) {
      return { valid: false, error: 'Serial code must be 16 characters' };
    }

    // Check if all characters are valid
    for (const char of code) {
      if (!this.CHARS.includes(char)) {
        return { valid: false, error: 'Serial code contains invalid characters' };
      }
    }

    // Verify checksums
    const baseCode = code.substring(0, 14);
    const providedChecksum1 = code[14];
    const providedChecksum2 = code[15];

    const calculatedChecksum1 = this.calculateChecksum(baseCode);
    const calculatedChecksum2 = this.calculateChecksum(baseCode + calculatedChecksum1);

    if (providedChecksum1 !== calculatedChecksum1 || providedChecksum2 !== calculatedChecksum2) {
      return { valid: false, error: 'Invalid checksum - serial code is not authentic' };
    }

    return { valid: true };
  }

  // Generate multiple unique serial codes
  static async generateBatch(productId, count) {
    const generatedCodes = [];
    const existingCodes = new Set();

    // Get existing codes for this product to avoid duplicates
    const existing = await SerialNumber.getByProduct(productId);
    existing.forEach(sn => existingCodes.add(sn.serial_code));

    let attempts = 0;
    const maxAttempts = count * 10; // Prevent infinite loop

    while (generatedCodes.length < count && attempts < maxAttempts) {
      attempts++;
      const code = this.generateCode();

      // Check if code is unique
      if (!existingCodes.has(code) && !generatedCodes.includes(code)) {
        try {
          await SerialNumber.create(code, productId);
          generatedCodes.push(code);
        } catch (error) {
          // If duplicate error, try again
          if (!error.message.includes('UNIQUE')) {
            throw error;
          }
        }
      }
    }

    if (generatedCodes.length < count) {
      throw new Error(`Could only generate ${generatedCodes.length} unique codes out of ${count} requested`);
    }

    return generatedCodes;
  }

  // Format serial code for display
  static formatCode(code) {
    const cleaned = code.replace(/-/g, '');
    return cleaned.match(/.{1,4}/g).join('-');
  }
}

module.exports = SerialGenerator;
