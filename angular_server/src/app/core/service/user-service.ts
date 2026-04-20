import { Injectable } from '@angular/core';
import axios, { AxiosError } from 'axios';
import { User } from '../model/user';
import { CreateUserModel } from '../model/create-user-model';
import { UpdatePasswordRequest } from '../model/update-password-request';
import { CreateConfig } from './create-config';
import { UserAdminModel } from '../model/user-admin-model';
import { DefaultServiceResult, DefaultServiceResultWithData } from '../model/default-server-result';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export class ReadUsersResponse {
	public users?: UserAdminModel[];
}

export class ReadUserResponse {
	public user?: UserAdminModel;
}




/**
 * Imterface for /api/users/users requests
 */
interface ApiUsersUsersServerResponse {
	error?: string;
	users?: Array<UserAdminModel>
}

/**
 * Imterface for /api/users/user/${encodeURIComponent(userEmail)} requests
 */
interface ApiUsersUserUserEmailServerResponse {
	error?: string;
	user?: UserAdminModel
}




/**
 * Service for user management operations
 */
@Injectable({providedIn: 'root'})
export class UserService {
	constructor(private http: HttpClient) {}

	/**
	 * Create a new user (admin only)
	 * @param {CreateUserModel} user - User data
	 * @param {string} authToken - JWT token
	 * @returns {Promise<Object>} Response with error or success
	 */
	async createUser(user: CreateUserModel, authToken: string): Promise<DefaultServiceResult> {
		try {
			const response = await firstValueFrom(
				this.http.post<DefaultServiceResult>(
					'/api/users/new',
					user,
					CreateConfig.createAuthConfig(authToken)
				)
			);

			return response;
		} catch (error) {
			if (error instanceof HttpErrorResponse) {
				if (error.status === 403)
					return {
						success: false,
						error: error.error.error || error.message
					};
			}

			return {
				success: false,
				error: (error as Error).message
			}
		}
	}

	/**
	 * Read a single user by email (admin only)
	 * @param {string} authToken - JWT token
	 * @param {string} userEmail - Email of the user to fetch
	 * @returns {Promise<ReadUserResponse>} Response with user data or error
	 */
	async readUser(authToken: string, userEmail: string): Promise<DefaultServiceResultWithData<ReadUserResponse>> {
		try {
			const response = await firstValueFrom(
				this.http.get<ApiUsersUserUserEmailServerResponse>(
					`/api/users/user/${encodeURIComponent(userEmail)}`,
					CreateConfig.createAuthConfig(authToken)
				)
			);

			if (response.error || !response.user)
				throw new Error(response.error || 'Ошибка получения ответа от сервера');
			
			return {
				success: true,
				data: {
					user: response.user
				}
			};
		} catch (error) {
			if (error instanceof HttpErrorResponse) {
				if (error.status === 403 || error.status === 404)
					return {
						success: false,
						error: error.error.error || error.message
					};
			}

			return {
				success: false,
				error: (error as Error).message
			}
		}
	}

	/**
	 * Update user information (admin only)
	 * @param {string} authToken - JWT token
	 * @param {string} email - Email of the user to update
	 * @param {User} user - Updated user data
	 * @returns {Promise<DefaultServiceResult>} Response with error or success
	 */
	async updateUser(authToken: string, email: string, user: User): Promise<DefaultServiceResult> {
		try {
			await firstValueFrom(
				this.http.put(
					`/api/users/update/${encodeURIComponent(email)}`,
					user,
					CreateConfig.createAuthConfig(authToken)
				)
			);
			return {
				success: true
			};
		} catch (error) {
			if (error instanceof HttpErrorResponse) {
				if (error.status === 403 || error.status === 404)
					return {
						success: false,
						error: error.error.error || error.message
					};
			}

			return {
				success: false,
				error: (error as Error).message
			}
		}
	}

	/**
	 * Delete a user (admin only)
	 * @param {string} authToken - JWT token
	 * @param {User} user - User object containing email to delete
	 * @returns {Promise<DefaultServiceResult>} Response with error or success
	 */
	async deleteUser(authToken: string, user: User): Promise<DefaultServiceResult> {
		try {
			const response = await firstValueFrom(
				this.http.delete<DefaultServiceResult>(
					`/api/users/delete/${encodeURIComponent(user.email)}`,
					CreateConfig.createAuthConfig(authToken)
				)
			);

			return {success: response.error ? false : response.success, error: response.error};
		} catch (error) {
			if (error instanceof HttpErrorResponse) {
				if (error.status === 403 || error.status === 404)
					return {
						success: false,
						error: error.error.error || error.message
					};
			}

			return {
				success: false,
				error: (error as Error).message
			}
		}
	}

	/**
	 * Read all users (admin only)
	 * @param {string} authToken - JWT token
	 * @returns {Promise<ReadUsersResponse>} Response with array of users or error
	 */
	async readAllUsers(authToken: string): Promise<DefaultServiceResultWithData<ReadUsersResponse>> {
		try {
			const response = await firstValueFrom(
				this.http.get<ApiUsersUsersServerResponse>(
					'/api/users/users',
					CreateConfig.createAuthConfig(authToken)
				)
			);
			if (response.error || !response.users)
				return {
					success: false,
					error: response.error
				};

			const usersData = response.users;
			const userModels = usersData.map((u: UserAdminModel) =>
				new UserAdminModel(
					u.surname,
					u.name,
					u.patronymic,
					u.email,
					new Date(u.createdAt)
				)
			);

			return {
				success: true,
				data: {
					users: userModels
				}
			};
		} catch (error) {
			if (error instanceof HttpErrorResponse) {
				if (error.status === 403)
					return {
						success: false,
						error: error.error.error || error.message
					};
			}

			return {
				success: false,
				error: (error as Error).message
			}
		}
	}

	/**
	 * Update user password (admin only)
	 * @param {string} authToken - JWT token
	 * @param {string} email - Email of the user
	 * @param {UpdatePasswordRequest} passwordData - Old and new password
	 * @returns {Promise<DefaultServiceResult>} Response with error or success
	 */
	async updateUserPassword(
		authToken: string,
		email: string,
		passwordData: UpdatePasswordRequest
	): Promise<DefaultServiceResult> {
		try {
			const response = await firstValueFrom(
				this.http.put<DefaultServiceResult>(
					`/api/users/update-password/${encodeURIComponent(email)}`,
					passwordData,
					CreateConfig.createAuthConfig(authToken)
				)
			);
			return response as DefaultServiceResult;
		} catch (error) {
			if (error instanceof HttpErrorResponse) {
				if (error.status === 403 || error.status === 404)
					return {
						success: false,
						error: error.error.error || error.message
					};
			}

			return {
				success: false,
				error: (error as Error).message
			}
		}
	}
}