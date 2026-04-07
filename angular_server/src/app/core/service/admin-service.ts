import { Injectable } from '@angular/core';
import axios, { AxiosError } from "axios";
import { CreateConfig } from './create-config';
import { DefaultServiceResult, DefaultServiceResultWithData } from '../model/default-server-result';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';


/**
 * Interface for response for isAdmin method
 */
export interface IsAdminServerResponse{
	isAdmin: boolean
};




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
	public async isAdmin(authToken: string): Promise<DefaultServiceResultWithData<IsAdminServerResponse>>{
		try {
			const response = await firstValueFrom(
				this.http.get<IsAdminServerResponse>(
					'/api/admin/is-admin',
					CreateConfig.createAuthConfigNew(authToken)
				)
			);
			
			return {
				success: true,
				data: {
					isAdmin: response.isAdmin
				}
			};
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