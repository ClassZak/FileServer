import { Injectable } from '@angular/core';
import { User } from '../model/user';
import { CreateConfig } from './create-config';
import { DefaultServiceResult, DefaultServiceResultWithData } from '../model/default-server-result';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';


export interface LoginResult {
	token?: string;
	refreshToken?: string;
	user?: User;
}

export interface CheckAuthResult {
	authenticated: boolean;
	user?: User;
}




/**
 * Interface for /api/auth/login and /api/auth/login-by-snp requests
 */
interface LoginResultServerResponse {
	error?: string;
	token?: string;
	refreshToken?: string;
	user?: User;
}

/**
 * Interface for /api/auth/verify requests
 */
interface ApiAuthVerifyServerResponse {
	valid: boolean;
	user?: User;
}

/**
 * Interface for /api/auth/refresh requests
 */
interface ApiAuthRefreshServerResponse {
	error?: string;
	token?: string;
	refreshToken?: string;
	user?: User;
}




@Injectable({ providedIn: 'root' })
export class AuthService {
	constructor(private http: HttpClient) {}

	/**
	 * Method for login by email
	 * @param email Email for login
	 * @param password User password
	 * @returns 
	 */
	public async loginByEmail(email: string, password: string): Promise<DefaultServiceResultWithData<LoginResult>>{
		try{
			const response = await firstValueFrom(
				this.http.post<LoginResultServerResponse>(
					'/api/auth/login', {
						email,
						password
					}
				)
			);
			
			if (response.token && response.refreshToken && response.user) {
				localStorage.setItem('token', response.token);
				localStorage.setItem('refreshToken', response.refreshToken);
				return {
					success: true,
					data: {
						token: response.token,
						refreshToken: response.refreshToken,
						user: response.user
					}
				};
			}

			return {
				success: false,
				error: 'Ошибка сервера. Попробуйте позже'
			};
		} catch (error) {
			console.error('login error:', error);
			return {
				success: false,
				error: error instanceof HttpErrorResponse ? 
					(error.error as HttpErrorResponse)?.error || error.error?.message || 'Ошибка входа по email' : 
					'Ошибка входа по email'
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
	public async loginBySnp(surname: string, name: string, patronymic: string, password: string): Promise<DefaultServiceResultWithData<LoginResult>>{
		try{
			const response = await firstValueFrom(
				this.http.post<LoginResultServerResponse>(
					'/api/auth/login-by-snp', {
						surname,
						name,
						patronymic,
						password
					}
				)
			);
			
			if (response.token && response.refreshToken && response.user){
				localStorage.setItem('token', response.token);
				localStorage.setItem('refreshToken', response.refreshToken);
				return {
					success: true,
					data: {
						token: response.token,
						refreshToken: response.refreshToken,
						user: response.user
					}
				};
			}

			return {
				success: false,
				error: 'Ошибка сервера. Попробуйте позже'
			};
		} catch (error) {
			console.error('login error:', error);
			return {
				success: false,
				error: error instanceof HttpErrorResponse ? 
					(error.error as HttpErrorResponse)?.error || error.error?.message || 'Ошибка входа по ФИО' : 
					'Ошибка входа по ФИО'
			}
		}
	}



	/**
	 * Function to chech auth token
	 * @returns CheckAuthResult
	 */
	public async checkAuth(): Promise<DefaultServiceResultWithData<CheckAuthResult>>{
		try{
			const token = AuthService.getToken();
			if (!token) {
				return { 
					success: false,
					error: 'Токен отсутствует',
				};
			}
			const response = await firstValueFrom(
				this.http.get<ApiAuthVerifyServerResponse>(
					'/api/auth/verify',
					CreateConfig.createAuthConfig(token)
				)
			);
			if (response.valid && response.user) {
				return {
					success: true,
					message: 'Токен действителен',
					data: {
						authenticated: true,
						user: response.user,
					}
				};
			} else {
				return await this.tryRefreshToken();
			}
		} catch(error) {
			console.error('Check auth error:', error);
			if (error instanceof HttpErrorResponse) {
				if (error.status === 401)
					return await this.tryRefreshToken();
			}
			
			return {
				success: false,
				error: error instanceof HttpErrorResponse ? 
					(error.error as HttpErrorResponse)?.error || error.error?.message || 'Ошибка проверки токена' : 
					'Ошибка проверки токена'
			}
		}
	}
	/**
	 * Function for refresh the token
	 * @returns CheckAuthResult
	 */
	public async tryRefreshToken(): Promise<DefaultServiceResultWithData<CheckAuthResult>> {
		try {
			const refreshToken = localStorage.getItem('refreshToken');
			
			if (!refreshToken) {
				return {
					success: false,
					error: 'Refresh token отсутствует',
				};
			}

			const response =
			await firstValueFrom(
				this.http.post<ApiAuthRefreshServerResponse>(
					'/api/auth/refresh', {
						refreshToken
					}
				)
			);

			if (response.token && response.refreshToken && response.user) {
				localStorage.setItem('token', response.token);
				localStorage.setItem('refreshToken', response.refreshToken);
				
				const userResponse =
				await firstValueFrom(this.http.get<ApiAuthVerifyServerResponse>(
					'/api/auth/verify',
					CreateConfig.createAuthConfig(response.token)
				));
				
				return {
					success: true,
					message: 'Токен обновлен',
					data: {
						authenticated: true,
						user: userResponse.user,
					}
				};
			}
		} catch (refreshError) {
			console.error('Refresh token error:', refreshError);
		}

		AuthService.clearAuthData();
		return {
			success: false,
			error: 'Требуется повторный вход',
		};
	}



	/**
	 * Function for user logout
	 */
	async logout(): Promise<DefaultServiceResult> {
		try {
			AuthService.clearAuthData();
			const response = await firstValueFrom(this.http.post<DefaultServiceResult>(
				'/api/auth/logout',
				{}
			));

			return {success: response.success};
		} catch(error) {
			return {
				success: false,
				error: (error as Error).message
			};
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
}
