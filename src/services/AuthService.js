import axios from 'axios';

class AuthService {
    // Вход по email
    static async loginByEmail(email, password) {
        try {
            const response = await axios.post('/api/auth/login', {
                email,
                password
            });
            
            if (response.data.token) {
                localStorage.setItem('token', response.data.token);
                localStorage.setItem('refreshToken', response.data.refreshToken);
                return {
                    success: true,
                    token: response.data.token,
                    refreshToken: response.data.refreshToken,
                    user: response.data.user
                };
            }
        } catch (error) {
            console.error('Login error:', error);
            return {
                success: false,
                message: this.getErrorMessage(error, 'Ошибка входа по email')
            };
        }
    }

    // Вход по ФИО
    static async loginBySnp(surname, name, patronymic, password) {
        try {
            const response = await axios.post('/api/auth/login-by-snp', {
                surname,
                name,
                patronymic,
                password
            });
            
            if (response.data.token) {
                localStorage.setItem('token', response.data.token);
                localStorage.setItem('refreshToken', response.data.refreshToken);
                return {
                    success: true,
                    token: response.data.token,
                    refreshToken: response.data.refreshToken,
                    user: response.data.user
                };
            }
        } catch (error) {
            console.error('Login by SNP error:', error);
            return {
                success: false,
                message: this.getErrorMessage(error, 'Ошибка входа по ФИО')
            };
        }
    }

    // Проверка авторизации (существующий)
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

            if (response.data.valid && response.data.user) {
                return {
                    authenticated: true,
                    user: response.data.user,
                    message: 'Токен действителен'
                };
            } else {
                return await this.tryRefreshToken();
            }
            
        } catch (error) {
            console.error('Check auth error:', error);
            
            if (error.response?.status === 401) {
                return await this.tryRefreshToken();
            }
            
            return {
                authenticated: false,
                user: null,
                message: this.getErrorMessage(error, 'Ошибка проверки токена')
            };
        }
    }

    // Обновление токена
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

        this.clearAuthData();
        return {
            authenticated: false,
            user: null,
            message: 'Требуется повторный вход'
        };
    }

    // Вспомогательный метод для обработки ошибок
    static getErrorMessage(error, defaultMessage) {
        if (error.response?.data?.message) {
            return error.response.data.message;
        }
        if (error.response?.data?.error) {
            return error.response.data.error;
        }
        if (error.response?.status === 401 || error.response?.status === 403) {
            return 'Неверные учетные данные';
        }
        if (error.response?.status === 404) {
            return 'Сервер авторизации недоступен';
        }
        if (error.response?.status >= 500) {
            return 'Ошибка сервера. Попробуйте позже';
        }
        if (error.message?.includes('Network Error')) {
            return 'Ошибка сети. Проверьте подключение';
        }
        return defaultMessage;
    }
    
    static clearAuthData() {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
    }

    static logout() {
        try {
            axios.post('/api/auth/logout');
            this.clearAuthData();
        } finally {
        }
    }

    static getToken() {
        return localStorage.getItem('token');
    }

    static hasToken() {
        return !!localStorage.getItem('token');
    }

    static setUser(user) {
        if (user) {
            localStorage.setItem('user', JSON.stringify(user));
        }
    }

    static getUser() {
        const userStr = localStorage.getItem('user');
        return userStr ? JSON.parse(userStr) : null;
    }


    /**
     * Изменение пароля пользователя
     * @param {string} email - Email пользователя
     * @param {string} authToken - Токен авторизации (например, "Bearer eyJhbGciOi...")
     * @param {string} oldPassword - Текущий пароль
     * @param {string} newPassword - Новый пароль
     * @returns {Promise<Object>} - Результат операции
     */
    static async updatePassword(email, authToken, oldPassword, newPassword){
        try {
            const response = await axios.put(
                `/api/users/update-password/${encodeURIComponent(email)}`, 
                {
                    'oldPassword': oldPassword, 
                    'newPassword': newPassword
                },
                {
                    headers:{
                        'Authorization': `Bearer ${authToken}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            return response.data;
        } catch (error){
            console.error('Update password error:', error);
            if (error.response) {
                // Сервер ответил с ошибкой
                const status = error.response.status;
                const data = error.response.data;
                
                let message = data?.message || 'Ошибка сервера';
                
                if (status === 403) {
                    message = data?.message || 'Недостаточно прав для изменения пароля';
                } else if (status === 404) {
                    message = data?.message || 'Пользователь не найден';
                } else if (status === 401) {
                    message = 'Требуется авторизация';
                }
                
                return {
                    success: false,
                    message: message,
                    status: status
                };
                
            } else if (error.request) {
                // Запрос был сделан, но ответа нет
                return {
                    success: false,
                    message: 'Ошибка сети: не удалось получить ответ от сервера'
                };
            } else {
                // Ошибка настройки запроса
                return {
                    success: false,
                    message: error.message || 'Ошибка при отправке запроса'
                };
            }
        }
    }
}

export default AuthService;