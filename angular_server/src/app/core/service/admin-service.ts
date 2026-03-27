import { Injectable } from '@angular/core';
import axios, { AxiosError } from "axios";
import { CreateConfig } from './create-config';
import { DefaultServiceResult } from '../model/default-server-result';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';


/**
 * Class for Adminstrator database entity
 */
@Injectable({ providedIn: 'root' })
export class AdminService {
	constructor(private http: HttpClient) {}
	/**
	 * Checking is user administrator or not
	 * @param {string} authToken Authorization token for admin role checking
	 * @returns {Promise<Object>} Operation result with isAdmin key
	 */
	public static async isAdminStatic(authToken: string): Promise<DefaultServiceResult>{
		try {
			const response = await axios.get('/api/admin/is-admin',CreateConfig.createAuthConfig(authToken));
			
			return {success: response.data.isAdmin};
		} catch (error) {
			const axiosError = error as AxiosError<{
				message?: string;
				error?: string;
			}>;
			// Process 401 and 404 errors for AdministratorController
			if (axiosError.response && (axiosError.response.status === 401 || axiosError.response.status === 404))
				return {success: false};
			// Other errors failure returns
			return {
				success: false,
				error: axiosError.message
			};
		}
	}



	
	/**
	 * Checking is user administrator or not
	 * @param {string} authToken Authorization token for admin role checking
	 * @returns {Promise<Object>} Operation result with isAdmin key
	 */
	public async isAdmin(authToken: string): Promise<DefaultServiceResult>{
		try {
			const response = await firstValueFrom(
				this.http.get<{isAdmin: boolean}>(
					'/api/admin/is-admin',
					CreateConfig.createAuthConfigNew(authToken)
				)
			);
			this.http.get('/api/admin/is-admin', CreateConfig.createAuthConfigNew(authToken));
			
			return {success: response.isAdmin };
		} catch (error) {
			if (error instanceof HttpErrorResponse) {
				if (error.status === 401 || error.status === 404)
					return {success: false};
				return {
					success: false,
					error: error.error?.message || error.message || 'Ошибка проверки прав администратора'
				};
			}
			return {success: false};
		}
	}
}

export default AdminService;