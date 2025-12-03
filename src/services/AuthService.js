import axios from 'axios';

class AuthService {
    static async loginByEmail(email, password) {
        try {
            const response = await axios.post('/api/auth/login', {
                email,
                password
            });
            
            if (response.data.token) {
                // Сохраняем только токены, данные пользователя будем получать через /api/auth/verify
                localStorage.setItem('token', response.data.token);
                localStorage.setItem('refreshToken', response.data.refreshToken);
                return {
                    success: true,
                    token: response.data.token,
                    refreshToken: response.data.refreshToken
                };
            }
        } catch (error) {
            console.error('Login error:', error);
            return {
                success: false,
                message: error.response?.data?.message || 'Ошибка входа'
            };
        }
    }

    // Основной метод проверки авторизации - ТОЛЬКО через сервер
    static async checkAuth() {
        try {
            const token = this.getToken();
            
            if (!token) {
                return { 
                    authenticated: false, 
                    user: null,
                    message: 'Токен отсутствует' 
                };
            }

            const response = await axios.get('/api/auth/verify', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            // Только если сервер подтвердил валидность токена
            if (response.data.valid && response.data.user) {
                return {
                    authenticated: true,
                    user: response.data.user,
                    message: 'Токен действителен'
                };
            } else {
                // Токен невалиден, пробуем обновить
                return await this.tryRefreshToken();
            }
            
        } catch (error) {
            console.error('Check auth error:', error);
            
            // Если 401 - пробуем обновить токен
            if (error.response?.status === 401) {
                return await this.tryRefreshToken();
            }
            
            // Любая другая ошибка - считаем неавторизованным
            return {
                authenticated: false,
                user: null,
                message: error.response?.data?.message || 'Ошибка проверки токена'
            };
        }
    }

    // Попытка обновить токен через refresh token
    static async tryRefreshToken() {
        try {
            const refreshToken = localStorage.getItem('refreshToken');
            
            if (!refreshToken) {
                return { 
                    authenticated: false, 
                    user: null,
                    message: 'Refresh token отсутствует' 
                };
            }

            const response = await axios.post('/api/auth/refresh', {
                refreshToken
            });

            if (response.data.token) {
                localStorage.setItem('token', response.data.token);
                localStorage.setItem('refreshToken', response.data.refreshToken);
                
                // Получаем данные пользователя с новым токеном
                const userResponse = await axios.get('/api/auth/verify', {
                    headers: {
                        'Authorization': `Bearer ${response.data.token}`
                    }
                });
                
                return {
                    authenticated: true,
                    user: userResponse.data.user,
                    message: 'Токен обновлен'
                };
            }
        } catch (refreshError) {
            console.error('Refresh token error:', refreshError);
        }

        // Если не удалось обновить - очищаем всё
        this.clearAuthData();
        return {
            authenticated: false,
            user: null,
            message: 'Требуется повторный вход'
        };
    }

    // Получить данные пользователя (только если есть токен, но без проверки)
    static getUser() {
        const userStr = localStorage.getItem('user');
        return userStr ? JSON.parse(userStr) : null;
    }

    static logout() {
        try {
            axios.post('/api/auth/logout').catch(() => {});
        } finally {
            this.clearAuthData();
        }
    }

    // Очистка всех данных авторизации
    static clearAuthData() {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
    }

    static getToken() {
        return localStorage.getItem('token');
    }

    // Быстрая проверка наличия токена (без проверки на сервере)
    static hasToken() {
        return !!localStorage.getItem('token');
    }

    // Метод для явной установки пользователя (после успешного checkAuth)
    static setUser(user) {
        if (user) {
            localStorage.setItem('user', JSON.stringify(user));
        }
    }
}

export default AuthService;