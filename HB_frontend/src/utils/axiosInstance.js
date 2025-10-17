import axios from 'axios';

const API_BASE =
  import.meta.env.VITE_REACT_APP_API || "http://localhost:3000/api";

const axiosInstance = axios.create({
  baseURL: API_BASE,
});

let onAuthError = null;

export const setAuthErrorInterceptor = (logoutHandler, toastHandler, navigateHandler) => {
    onAuthError = { logoutHandler, toastHandler, navigateHandler };
};

axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.token = token; 
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (onAuthError && error.response && error.response.status === 401) {
      
      const { logoutHandler, toastHandler, navigateHandler } = onAuthError;

      toastHandler('error', 'Token หมดอายุ', 'กรุณา login ใหม่');
      
      setTimeout(() => {
        logoutHandler();
        navigateHandler('/login');
      }, 1000); 

      return new Promise(() => {});
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;