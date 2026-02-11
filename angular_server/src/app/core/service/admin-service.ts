import { Injectable } from '@angular/core';
import axios, { AxiosError } from "axios";
import { CreateConfig } from './create-config';


@Injectable({
providedIn: 'root',
})
/**
 * Class for Adminstrator database entity
 */
export class AdminService {
	/**
	 * Checking is user administrator or not
	 * @param {string} authToken Authorization token for admin role checking
	 * @returns {Promise<Object>} Operation result with isAdmin key
	 */
	public static async isAdmin(authToken: string): Promise<boolean>{
		try {
			const response = await axios.get('/api/admin/is-admin',CreateConfig.createAuthConfig(authToken));
			
			return response.data.isAdmin;
		} catch (error) {
			const axiosError = error as AxiosError<{
				message?: string;
				error?: string;
			}>;
			// Process 401 and 404 errors for AdministratorController
			if (axiosError.response && (axiosError.response.status === 401 || axiosError.response.status === 404))
				return false;
			// Other errors throw next
			throw error;
		}
	}
}

export default AdminService;