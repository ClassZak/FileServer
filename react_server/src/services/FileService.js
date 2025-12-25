import axios from 'axios';
import AuthService from './AuthService';


export class FileService {
	static async exists(file, token) {
		try {
			const response = await axios.get(`/api/files/exists?path=${file}`, {
				headers: { 'Authorization': `Bearer ${token}` }
			});
			return response.data.exists;
		} catch (error) {
			console.error('Login error:', error);
			return false;
		}
	}
	

	static async find(query, path = '', token) {
		try {
			const response = await axios.get(
				`/api/files/search?q=${encodeURIComponent(query)}&path=${encodeURIComponent(path)}`,
				{
					headers: { 'Authorization': `Bearer ${token}` }
				}
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
	static async upload(authToken, file, currentPath) {
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
			const errorData = error.response?.data;
			
			console.error('Upload error:', error);
			
			if (errorData?.error)
				throw errorData.error;
			else if (error.response?.status === 403)
				throw 'У вас нет прав на загрузку файлов в эту директорию';
			else if (error.response?.status === 400)
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
	static createConfig(authToken) {
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
	 * @param {string} authToken JWT token
	 * @returns {Object} Axios configuration object
	 */
	static createConfigForFiles(authToken) {
		return {
			headers: { 
				'Authorization': `Bearer ${authToken}`,
				'Content-Type': 'multipart/form-data'
			}
		};
	}
}