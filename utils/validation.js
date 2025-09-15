const validateUsername = (username) => {
  const allowedChars = /^[a-zA-Z0-9_]+$/;
  if (!username || !allowedChars.test(username)) {
    return {
      valid: false,
      message:
        "Username can only contain letters, numbers, and underscores.",
    };
  }

  if (/^\d+$/.test(username)) {
    return {
      valid: false,
      message: "Username cannot be composed of only numbers.",
    };
  }

  if (username.length > 32) {
    return {
      valid: false,
      message: "Username cannot be longer than 32 characters.",
    };
  }

  if (username.length < 3) {
    return {
      valid: false,
      message: "Username cannot be shorter than 3 characters.",
    };
  }

  return { valid: true };
};

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
  validateUsername,
  validatePassword,
  validateRole,
  validateRequired
};