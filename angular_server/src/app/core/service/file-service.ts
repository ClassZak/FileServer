import { Injectable } from '@angular/core';
import axios, { AxiosError } from 'axios';
import { CreateConfig } from './create-config';

@Injectable({
	providedIn: 'root',
})
export class FileService {
	public static async exists(file: string, token: string) {
		try {
			const response = await axios.get(`/api/files/exists?path=${file}`, CreateConfig.createAuthConfig(token));
			return response.data.exists;
		} catch (error) {
			console.error('Login error:', error);
			return false;
		}
	}
	

	public static async find(query:string, path = '', token:string) {
		try {
			const response = await axios.get(
				`/api/files/search?q=${encodeURIComponent(query)}&path=${encodeURIComponent(path)}`,
				CreateConfig.createAuthConfig(token)
			);
			return response.data;
		} catch (error) {
			console.error('Search error:', error);
			throw error;
		}
	}


	/**
	 * Function for files uploading
	 * @param {string} authToken JWT token
	 * @param {File} file File object for uploading
	 * @param {string} currentPath target path for uploading
	 * @returns FileInfo from server 
	 * @throws axios error from server
	 */
	public static async upload(authToken: string, file: File, currentPath: string) {
		const formData = new FormData();
		formData.append('file', file);
		try {
			const response = await axios.post(
				`/api/files/upload?path=${encodeURIComponent(currentPath)}`,
				formData,
				FileService.createConfigForFiles(authToken)
			);

			return response.data;
		} catch (error) {
			const axiosError = error as AxiosError<{
				message?: string;
				error?: string;
			}>;
			const errorData = axiosError.response?.data;
			
			console.error('Upload error:', axiosError);
			
			if (errorData?.error)
				throw errorData.error;
			else if (axiosError.response?.status === 403)
				throw 'У вас нет прав на загрузку файлов в эту директорию';
			else if (axiosError.response?.status === 400)
				throw 'Ошибка при загрузке файла: ' + (errorData?.error || 'неизвестная ошибка');
			else
				throw 'Ошибка при загрузке файла';
		}
	};




	/**
	 * Create axios configuration with authorization header
	 * 
	 * @param {string} authToken JWT token
	 * @returns {Object} Axios configuration object
	 */
	public static createConfig(authToken: string) {
		return {
			headers: { 
				'Authorization': `Bearer ${authToken}`,
				'Content-Type': 'application/json'
			}
		};
	}

	/**
	 * Create axios configuration with authorization header for files
	 * 
	 * @param {String} authToken JWT token
	 * @returns {Object} Axios configuration object
	 */
	public static createConfigForFiles(authToken: string): object {
		return {
			headers: { 
				'Authorization': `Bearer ${authToken}`,
				'Content-Type': 'multipart/form-data'
			}
		};
	}
}
