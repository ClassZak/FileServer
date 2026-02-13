import { Injectable } from '@angular/core';
import { User } from '../model/user';
import { CreateUserModel } from '../model/create-user-model';
import { UpdatePasswordRequest } from '../model/update-password-request';
import axios, { AxiosError } from 'axios';
import { CreateConfig } from './create-config';


export class UpdatePasswordResponse{
	public success: boolean = false;
	public error?: string = '';
	public message?: string = '';
}


@Injectable({
	providedIn: 'root',
})
/**
 * Class for User database entity
 */
export class UserService {

	/**
	 * Function for create new user
	 * @param {User} user data for new user
	 * @param {string} authToken Authorization token for admin role checking
	 * @returns {Promise<Object>} Object with "error" : <message> or "success" : true
	 */
	static async createUser(user:CreateUserModel, authToken:string) {
		try {
			const response = await axios.post(
				'/api/users/new', user, CreateConfig.createAuthConfig(authToken)
			);

			return response.data;
		} catch (error) {
			const axiosError = error as AxiosError<{
				message?: string;
				error?: string;
			}>;
			// Process 403 for UserController
			if (axiosError.response && (axiosError.response.status === 403))
				return axiosError.response.data;
			// Other errors throw next
			throw axiosError;
		}
	}


	/**
	 * Function for read user data
	 * @param {string} authToken Authorization token for admin role checking
	 * @param {string} userEmail email for get user data
	 * @returns {Promise<Object>}
	 * Object with "error" or "user" key. "user" key is used for data storing
	 */
	static async readUser(authToken:string, userEmail:string) {
		try {
			const response = await axios.get(
				`/api/users/user/${encodeURI(userEmail)}`, CreateConfig.createAuthConfig(authToken)
			);

			return response.data;
		} catch (error) {
			const axiosError = error as AxiosError<{
				message?: string;
				error?: string;
			}>;
			// Process 403 and 404 for UserController
			if (axiosError.response && (axiosError.response.status === 403 || axiosError.response.status === 404))
				return axiosError.response.data;
			// Other errors throw next
			throw axiosError;
		}
	}


	/**
	 * Function for update user data
	 * @param {string} authToken Authorization token for admin role checking
	 * @param {string} email email of user to update
	 * @param {User} user data for update
	 * @returns {Promise<Object>} Object with "error" or "success" key
	 */
	static async updateUser(authToken:string, email:string, user:User) {
		try {
			const response = await axios.put(
				`/api/users/update/${encodeURI(email)}`, user, CreateConfig.createAuthConfig(authToken)
			);

			return response.data;
		} catch (error) {
			const axiosError = error as AxiosError<{
				message?: string;
				error?: string;
			}>;
			// Process 403 and 404 for UserController
			if (axiosError.response && (axiosError.response.status === 403 || axiosError.response.status === 404))
				return axiosError.response.data;
			// Other errors throw next
			throw axiosError;
		}
	}


	/**
	 * Function for delete user
	 * @param {string} authToken Authorization token for admin role checking
	 * @param {User} user user object with email to delete
	 * @returns {Promise<Object>} Object with "error" or "success" key
	 */
	static async deleteUser(authToken:string, user:User) {
		try {
			const response = await axios.delete(
				`/api/users/delete/${encodeURI(user.email)}`, CreateConfig.createAuthConfig(authToken)
			);

			return response.data;
		} catch (error) {
			const axiosError = error as AxiosError<{
				message?: string;
				error?: string;
			}>;
			// Process 403 and 404 for UserController
			if (axiosError.response && (axiosError.response.status === 403 || axiosError.response.status === 404))
				return axiosError.response.data;
			// Other errors throw next
			throw axiosError;
		}
	}


	/**
	 * Function for read all users
	 * @param {string} authToken Authorization token for admin role checking
	 * @returns {Promise<Object>}
	 * Object with "error" or "users" key. "users" key is used for users list storing
	 */
	static async readAllUsers(authToken:string) {
		try {
			const response = await axios.get(
				`/api/users/users`, CreateConfig.createAuthConfig(authToken)
			);

			return response.data;
		} catch (error) {
			const axiosError = error as AxiosError<{
				message?: string;
				error?: string;
			}>;
			// Process 403 for UserController
			if (axiosError.response && (axiosError.response.status === 403))
				return axiosError.response.data;
			// Other errors throw next
			throw axiosError;
		}
	}


	/**
	 * Function for update user password
	 * @param {string} authToken Authorization token for admin role checking
	 * @param {string} email email of user to update password
	 * @param {Object} passwordData object with oldPassword and newPassword
	 * @returns {Promise<Object>} Object with "error" or "success" key
	 */
	static async updateUserPassword(authToken:string, email:string, passwordData:UpdatePasswordRequest): Promise<UpdatePasswordResponse> {
		try {
			const response = await axios.put(
				`/api/users/update-password/${encodeURI(email)}`,
				passwordData,
				CreateConfig.createAuthConfig(authToken)
			);

			return response.data as UpdatePasswordResponse;
		} catch (error) {
			const axiosError = error as AxiosError<{
				message?: string;
				error?: string;
			}>;
			// Process 403 and 404 for UserController
			if (axiosError.response && (axiosError.response.status === 403 || axiosError.response.status === 404))
				return axiosError.response.data as UpdatePasswordResponse;
			// Other errors throw next
			throw axiosError;
		}
	}
}