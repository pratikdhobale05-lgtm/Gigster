import { create } from 'zustand';
import api from '../utils/api';

const useAuthStore = create((set, get) => ({
    user: JSON.parse(localStorage.getItem('user')) || null,
    token: localStorage.getItem('token') || null,
    isAuthenticated: !!localStorage.getItem('token'),

    login: (userData, token) => {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));
        set({ user: userData, token: token, isAuthenticated: true });
    },

    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        set({ user: null, token: null, isAuthenticated: false });
    },

    // Rehydrate user data from token on app load
    fetchMe: async () => {
        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            const response = await api.get('/users/me/profile');
            const userData = response.data.data.user;
            localStorage.setItem('user', JSON.stringify(userData));
            set({ user: userData, isAuthenticated: true });
        } catch (err) {
            // Token is invalid — clear everything
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            set({ user: null, token: null, isAuthenticated: false });
        }
    },
}));

export default useAuthStore;