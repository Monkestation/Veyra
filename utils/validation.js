const validatePassword = (password) => {
  if (!password || password.length < 6) {
    return { valid: false, message: 'Password must be at least 6 characters' };
  }
  return { valid: true };
};

const validateRole = (role) => {
  if (!['user', 'admin'].includes(role)) {
    return { valid: false, message: 'Role must be user or admin' };
  }
  return { valid: true };
};

const validateRequired = (fields, obj) => {
  const missing = [];
  fields.forEach(field => {
    if (!obj[field]) {
      missing.push(field);
    }
  });
  
  if (missing.length > 0) {
    return { valid: false, message: `Missing required fields: ${missing.join(', ')}` };
  }
  return { valid: true };
};

module.exports = {
  validatePassword,
  validateRole,
  validateRequired
};