// Check if token exists (returns boolean)
export const isAuthenticated = () => {
  return !!localStorage.getItem("token");
};

// Get token (returns token string or null)
export const getToken = () => {
  return localStorage.getItem("token");
};

// Save token to localStorage
export const setToken = (token) => {
  localStorage.setItem("token", token);
};

// Remove token (logout)
export const removeToken = () => {
  localStorage.removeItem("token");
};
