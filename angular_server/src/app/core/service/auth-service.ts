import { Injectable } from '@angular/core';
import axios, { AxiosError, AxiosResponse } from 'axios';
import { User } from '../model/user';


export interface LoginResult {
	success: boolean;
	token?: string;
	refreshToken?: string;
	user?: User;
	message?: string;
}

export interface CheckAuthResult {
	authenticated: boolean;
	user?: User;
	message?: string;
}




@Injectable({
	providedIn: 'root',
})
export class AuthService {
	/**
	 * Method for login by email
	 * @param email Email for login
	 * @param password User password
	 * @returns 
	 */
	public static async loginByEmail(email: string, password: string): Promise<LoginResult>{
		try{
			const response = await axios.post('/api/auth/login', {
				email,
				password
			});
			
			if (response.data.token){
				localStorage.setItem('token', response.data.token);
				localStorage.setItem('refreshToken', response.data.refreshToken);
				return {
					success: true,
					token: response.data.token,
					refreshToken: response.data.refreshToken,
					user: response.data.user
				};
			}
			return {
				success: false,
				message: 'Ошибка сервера. Попробуйте позже'
			};
		} catch (error) {
			console.log('login error:', error);
			return {
				success: false,
				message: this.getErrorMessage(error, 'Ошибка входа по email')
			}
		}
	}
	/**
	 * Method for login by surname, name and patronymic
	 * @param surname Surname for login
	 * @param name Name for login
	 * @param patronymic Patronymic for login
	 * @param password User password
	 * @returns 
	 */
	public static async loginBySnp(surname: string, name: string, patronymic: string, password: string): Promise<LoginResult>{
		try{
			const response = await axios.post('/api/auth/login-by-snp', {
				surname,
				name,
				patronymic,
				password
			});
			
			if (response.data.token){
				localStorage.setItem('token', response.data.token);
				localStorage.setItem('refreshToken', response.data.refreshToken);
				return {
					success: true,
					token: response.data.token,
					refreshToken: response.data.refreshToken,
					user: response.data.user
				};
			}
			return {
				success: false,
				message: 'Ошибка сервера. Попробуйте позже'
			};
		} catch (error) {
			console.log('login error:', error);
			return {
				success: false,
				message: this.getErrorMessage(error, 'Ошибка входа по ФИО')
			}
		}
	}



	/**
	 * Function to chech auth token
	 * @returns CheckAuthResult
	 */
	public static async checkAuth(): Promise<CheckAuthResult>{
		try{
			const token = this.getToken();
			if (!token) {
				return { 
					authenticated: false,
					message: 'Токен отсутствует' 
				};
			} else {
				return { 
					authenticated: true,
					message: 'Токен присутствует' 
				};
			}
		} catch(error: any) {
			console.error('Check auth error:', error);
			if (error.response?.status === 401) {
				return await this.tryRefreshToken();
			}
			
			return {
				authenticated: false,
				message: this.getErrorMessage(error, 'Ошибка проверки токена')
			}
		}
	}
	/**
	 * Function for refresh the token
	 * @returns CheckAuthResult
	 */
	public static async tryRefreshToken(): Promise<CheckAuthResult> {
		try {
			const refreshToken = localStorage.getItem('refreshToken');
			
			if (!refreshToken) {
				return { 
					authenticated: false,
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
			message: 'Требуется повторный вход'
		};
	}




	/**
	 * Additional method for error message
	 * @param error Axios error
	 * @param defaultMessage default string message
	 * @returns error message
	 */
	static getErrorMessage(error: unknown, defaultMessage: string): string {
		const axiosError = error as AxiosError<{
			message?: string;
			error?: string;
		}>;
		
		if (axiosError.response?.data?.message)
			return axiosError.response.data.message;
		if (axiosError.response?.data?.error)
			return axiosError.response.data.error;
		if (axiosError.response?.status === 401 || axiosError.response?.status === 403)
			return 'Неверные учетные данные';
		if (axiosError.response?.status === 404)
			return 'Сервер авторизации недоступен';
		if (axiosError.response?.status && axiosError.response.status >= 500)
			return 'Ошибка сервера. Попробуйте позже';
		
		if (axiosError.message?.includes('Network Error'))
			return 'Ошибка сети. Проверьте подключение';
		
		return defaultMessage;
	}



	/**
	 * Function for user logout
	 */
	static logout() {
		try {
			axios.post('/api/auth/logout');
			this.clearAuthData();
		} finally {
		}
	}








	public static getToken() {
		return localStorage.getItem('token');
	}
	public static hasToken() {
		return !!localStorage.getItem('token');
	}
	
	public static setUser(user: User) {
		if (user) {
			localStorage.setItem('user', JSON.stringify(user));
		}
	}
	public static getUser() {
		const userStr = localStorage.getItem('user');
		return userStr ? JSON.parse(userStr) : null;
	}

	public static clearAuthData() {
		localStorage.removeItem('token');
		localStorage.removeItem('refreshToken');
		localStorage.removeItem('user');
	}










	/**
     * Изменение пароля пользователя
     * @param {string} email - Email пользователя
     * @param {string} authToken - Токен авторизации (например, "Bearer eyJhbGciOi...")
     * @param {string} oldPassword - Текущий пароль
     * @param {string} newPassword - Новый пароль
     * @returns {Promise<Object>} - Результат операции
     */
    static async updatePassword(email: string, authToken: string, oldPassword: string, newPassword: string){
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
			const axiosError = error as AxiosError<{
				message?: string;
				error?: string;
			}>;
            console.error('Update password error:', axiosError);
            if (axiosError.response) {
                // Сервер ответил с ошибкой
                const status = axiosError.response.status;
                const data = axiosError.response.data;
                
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
                
            } else if (axiosError.request) {
                // Запрос был сделан, но ответа нет
                return {
                    success: false,
                    message: 'Ошибка сети: не удалось получить ответ от сервера'
                };
            } else {
                // Ошибка настройки запроса
                return {
                    success: false,
                    message: axiosError.message || 'Ошибка при отправке запроса'
                };
            }
        }
    }
}
