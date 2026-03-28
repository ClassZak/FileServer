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
	static async createUserStatic(user: CreateUserModel, authToken: string): Promise<DefaultServiceResult> {
		try {
			const response = await axios.post(
				'/api/users/new',
				user,
				CreateConfig.createAuthConfig(authToken)
			);
			return response.data;
		} catch (error) {
			const axiosError = error as AxiosError<{ message?: string; error?: string }>;
			if (axiosError.response?.status === 403)
				return {
					success: false,
					error: axiosError.response.data.error
				};

			throw axiosError;
		}
	}

	/**
	 * Read a single user by email (admin only)
	 * @param {string} authToken - JWT token
	 * @param {string} userEmail - Email of the user to fetch
	 * @returns {Promise<ReadUserResponse>} Response with user data or error
	 */
	static async readUserStatic(authToken: string, userEmail: string): Promise<DefaultServiceResultWithData<ReadUserResponse>> {
		try {
			const response = await axios.get(
				`/api/users/user/${encodeURIComponent(userEmail)}`,
				CreateConfig.createAuthConfig(authToken)
			);

			const userData = response.data.user;

			// Convert ISO date string to Date object (assuming server sends without timezone)
			const createdAtDate = new Date(userData.createdAt);

			const userModel = new UserAdminModel(
				userData.surname,
				userData.name,
				userData.patronymic,
				userData.email,
				createdAtDate
			);

			return {
				success: true,
				data: {
					user: userModel
				}
			};
		} catch (error) {
			const axiosError = error as AxiosError<{ message?: string; error?: string }>;
			if (axiosError.response && (axiosError.response.status === 403 || axiosError.response.status === 404)) {
				return {
					success: false,
					error: axiosError.response.data.error,
				};
			}
			throw axiosError;
		}
	}

	/**
	 * Update user information (admin only)
	 * @param {string} authToken - JWT token
	 * @param {string} email - Email of the user to update
	 * @param {User} user - Updated user data
	 * @returns {Promise<DefaultServiceResult>} Response with error or success
	 */
	static async updateUserStatic(authToken: string, email: string, user: User): Promise<DefaultServiceResult> {
		try {
			const response = await axios.put(
				`/api/users/update/${encodeURIComponent(email)}`,
				user,
				CreateConfig.createAuthConfig(authToken)
			);
			return {
				success: true
			};
		} catch (error) {
			const axiosError = error as AxiosError<{ message?: string; error?: string }>;
			if (axiosError.response && (axiosError.response.status === 403 || axiosError.response.status === 404)) {
				return {
					success: false,
					error: axiosError.response.data.error
				};
			}
			return {
				success: false,
				error: axiosError.message
			};
		}
	}

	/**
	 * Delete a user (admin only)
	 * @param {string} authToken - JWT token
	 * @param {User} user - User object containing email to delete
	 * @returns {Promise<DefaultServiceResult>} Response with error or success
	 */
	static async deleteUserStatic(authToken: string, user: User): Promise<DefaultServiceResult> {
		try {
			const response = await axios.delete(
				`/api/users/delete/${encodeURIComponent(user.email)}`,
				CreateConfig.createAuthConfig(authToken)
			);
			return {success: response.data.error ? false : response.data.success, error: response.data.error};
		} catch (error) {
			const axiosError = error as AxiosError<{ message?: string; error?: string }>;
			if (axiosError.response && (axiosError.response.status === 403 || axiosError.response.status === 404)) {
				return {success: !(!(axiosError.response.data.error)), error: axiosError.response.data.error};
			}
			return {success: false, error: axiosError.message};
		}
	}

	/**
	 * Read all users (admin only)
	 * @param {string} authToken - JWT token
	 * @returns {Promise<ReadUsersResponse>} Response with array of users or error
	 */
	static async readAllUsersStatic(authToken: string): Promise<DefaultServiceResultWithData<ReadUsersResponse>> {
		try {
			const response = await axios.get(
				'/api/users/users',
				CreateConfig.createAuthConfig(authToken)
			);

			const usersData = response.data.users;
			const userModels = usersData.map((u: any) =>
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
			const axiosError = error as AxiosError<{ message?: string; error?: string }>;
			if (axiosError.response?.status === 403) {
				return {
					success: false,
					error: axiosError.response.data.error,
				}
			}
			throw axiosError;
		}
	}

	/**
	 * Update user password (admin only)
	 * @param {string} authToken - JWT token
	 * @param {string} email - Email of the user
	 * @param {UpdatePasswordRequest} passwordData - Old and new password
	 * @returns {Promise<DefaultServiceResult>} Response with error or success
	 */
	static async updateUserPasswordStatic(
		authToken: string,
		email: string,
		passwordData: UpdatePasswordRequest
	): Promise<DefaultServiceResult> {
		try {
			const response = await axios.put(
				`/api/users/update-password/${encodeURIComponent(email)}`,
				passwordData,
				CreateConfig.createAuthConfig(authToken)
			);
			return response.data as DefaultServiceResult;
		} catch (error) {
			const axiosError = error as AxiosError<{ message?: string; error?: string }>;
			if (axiosError.response && (axiosError.response.status === 403 || axiosError.response.status === 404)) {
				return {
					success: false,
					error: axiosError.response.data.error
				};
			}
			throw axiosError;
		}
	}
















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

			throw error;
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
				this.http.get<{user: any}>(
					`/api/users/user/${encodeURIComponent(userEmail)}`,
					CreateConfig.createAuthConfig(authToken)
				)
			);

			const userData = response.user;

			// Convert ISO date string to Date object (assuming server sends without timezone)
			const createdAtDate = new Date(userData.createdAt);

			const userModel = new UserAdminModel(
				userData.surname,
				userData.name,
				userData.patronymic,
				userData.email,
				createdAtDate
			);

			return {
				success: true,
				data: {
					user: userModel
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

			throw error;
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
			this.http.put(
				`/api/users/update/${encodeURIComponent(email)}`,
				user,
				CreateConfig.createAuthConfig(authToken)
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
				this.http.get<{users: Array<any>}>(
					'/api/users/users',
					CreateConfig.createAuthConfig(authToken)
				)
			);

			const usersData = response.users;
			const userModels = usersData.map((u: any) =>
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

			throw error;
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

			throw error;
		}
	}
}