import axios from 'axios';
import useAuthStore from '../store/authStore';

// Create a custom axios instance pointing to your Node backend
const api = axios.create({
    baseURL: 'http://localhost:5000/api',
});

// Interceptor: Before ANY request leaves the frontend, attach the token if we have one
api.interceptors.request.use((config) => {
    // Grab the token directly from our Zustand store's initial state / localStorage
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default api;