import { Injectable } from '@angular/core';
import axios, { AxiosError } from 'axios';
import { User } from '../model/user';
import { CreateUserModel } from '../model/create-user-model';
import { UpdatePasswordRequest } from '../model/update-password-request';
import { CreateConfig } from './create-config';
import { UserAdminModel } from '../model/user-admin-model';

export class UpdatePasswordResponse {
	public success: boolean = false;
	public error?: string = '';
	public message?: string = '';
}

export class DeleteUserResponse {
	public success: boolean = false;
	public error?: string = '';
	public users?: UserAdminModel[];
}

export class ReadUsersResponse {
	public success: boolean = false;
	public error?: string = '';
	public users?: UserAdminModel[];
}

export class ReadUserResponse {
	public success: boolean = false;
	public error?: string = '';
	public message?: string = '';
	public user?: UserAdminModel;
}

@Injectable({
	providedIn: 'root',
})
/**
 * Service for user management operations
 */
export class UserService {

	/**
	 * Create a new user (admin only)
	 * @param {CreateUserModel} user - User data
	 * @param {string} authToken - JWT token
	 * @returns {Promise<Object>} Response with error or success
	 */
	static async createUser(user: CreateUserModel, authToken: string): Promise<any> {
		try {
			const response = await axios.post(
				'/api/users/new',
				user,
				CreateConfig.createAuthConfig(authToken)
			);
			return response.data;
		} catch (error) {
			const axiosError = error as AxiosError<{ message?: string; error?: string }>;
			if (axiosError.response?.status === 403) {
				return axiosError.response.data;
			}
			throw axiosError;
		}
	}

	/**
	 * Read a single user by email (admin only)
	 * @param {string} authToken - JWT token
	 * @param {string} userEmail - Email of the user to fetch
	 * @returns {Promise<ReadUserResponse>} Response with user data or error
	 */
	static async readUser(authToken: string, userEmail: string): Promise<ReadUserResponse> {
		try {
			const response = await axios.get(
				`/api/users/user/${encodeURIComponent(userEmail)}`,
				CreateConfig.createAuthConfig(authToken)
			);

			const userData = response.data.user;

			// Convert ISO date string to Date object (assuming server sends without timezone)
			const createdAtDate = new Date(userData.createdAt + 'Z');

			const userModel = new UserAdminModel(
				userData.surname,
				userData.name,
				userData.patronymic,
				userData.email,
				createdAtDate
			);

			const result = new ReadUserResponse();
			result.success = true;
			result.user = userModel;
			return result;
		} catch (error) {
			const axiosError = error as AxiosError<{ message?: string; error?: string }>;
			if (axiosError.response && (axiosError.response.status === 403 || axiosError.response.status === 404)) {
				return {
					success: false,
					error: axiosError.response.data.error,
					message: axiosError.response.data.message,
				} as ReadUserResponse;
			}
			throw axiosError;
		}
	}

	/**
	 * Update user information (admin only)
	 * @param {string} authToken - JWT token
	 * @param {string} email - Email of the user to update
	 * @param {User} user - Updated user data
	 * @returns {Promise<any>} Response with error or success
	 */
	static async updateUser(authToken: string, email: string, user: User): Promise<any> {
		try {
			const response = await axios.put(
				`/api/users/update/${encodeURIComponent(email)}`,
				user,
				CreateConfig.createAuthConfig(authToken)
			);
			return response.data;
		} catch (error) {
			const axiosError = error as AxiosError<{ message?: string; error?: string }>;
			if (axiosError.response && (axiosError.response.status === 403 || axiosError.response.status === 404)) {
				return axiosError.response.data;
			}
			throw axiosError;
		}
	}

	/**
	 * Delete a user (admin only)
	 * @param {string} authToken - JWT token
	 * @param {User} user - User object containing email to delete
	 * @returns {Promise<any>} Response with error or success
	 */
	static async deleteUser(authToken: string, user: User): Promise<any> {
		try {
			const response = await axios.delete(
				`/api/users/delete/${encodeURIComponent(user.email)}`,
				CreateConfig.createAuthConfig(authToken)
			);
			return response.data;
		} catch (error) {
			const axiosError = error as AxiosError<{ message?: string; error?: string }>;
			if (axiosError.response && (axiosError.response.status === 403 || axiosError.response.status === 404)) {
				return axiosError.response.data;
			}
			throw axiosError;
		}
	}

	/**
	 * Read all users (admin only)
	 * @param {string} authToken - JWT token
	 * @returns {Promise<ReadUsersResponse>} Response with array of users or error
	 */
	static async readAllUsers(authToken: string): Promise<ReadUsersResponse> {
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
					new Date(u.createdAt + 'Z')
				)
			);

			const result = new ReadUsersResponse();
			result.success = true;
			result.users = userModels;
			return result;
		} catch (error) {
			const axiosError = error as AxiosError<{ message?: string; error?: string }>;
			if (axiosError.response?.status === 403) {
				return axiosError.response.data as ReadUsersResponse;
			}
			throw axiosError;
		}
	}

	/**
	 * Update user password (admin only)
	 * @param {string} authToken - JWT token
	 * @param {string} email - Email of the user
	 * @param {UpdatePasswordRequest} passwordData - Old and new password
	 * @returns {Promise<UpdatePasswordResponse>} Response with error or success
	 */
	static async updateUserPassword(
		authToken: string,
		email: string,
		passwordData: UpdatePasswordRequest
	): Promise<UpdatePasswordResponse> {
		try {
			const response = await axios.put(
				`/api/users/update-password/${encodeURIComponent(email)}`,
				passwordData,
				CreateConfig.createAuthConfig(authToken)
			);
			return response.data as UpdatePasswordResponse;
		} catch (error) {
			const axiosError = error as AxiosError<{ message?: string; error?: string }>;
			if (axiosError.response && (axiosError.response.status === 403 || axiosError.response.status === 404)) {
				return axiosError.response.data as UpdatePasswordResponse;
			}
			throw axiosError;
		}
	}
}