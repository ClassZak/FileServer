import axios from 'axios';

// Базовый URL для API запросов
const API_BASE_URL = '/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    }
});

// Interceptor для добавления токена к запросам
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Interceptor для обработки ответов
api.interceptors.response.use(
    (response) => {
        // Можно логировать успешные ответы
        console.log(`✅ API успех: ${response.config.method?.toUpperCase()} ${response.config.url}`);
        return response;
    },
    (error) => {
        // Логируем ошибки
        console.error(`❌ API ошибка: ${error.config?.method?.toUpperCase()} ${error.config?.url} - ${error.response?.status}`);
        
        // Обработка ошибок аутентификации
        if (error.response?.status === 401 || error.response?.status === 403) {
            // Удаляем токен и редиректим на логин
            localStorage.removeItem('token');
            localStorage.removeItem('refreshToken');
            
            // Только если мы не на странице логина
            if (!window.location.pathname.includes('/login')) {
                window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
            }
        }
        
        return Promise.reject(error);
    }
);

export default api;