import { HttpHeaders } from "@angular/common/http"

/**
 * Static class for axios config creation
 */
export class CreateConfig {
	/**
	 * Function to create configuration for request
	 * @param {string} authToken 
	 * @returns {object} Configuration object with headers: {'Authorization': `Bear ...`}
	 */
	public static createAuthConfig(authToken: string): object {
		return { 
			headers: { 'Authorization': `Bearer ${authToken}` }
		}
	}
	/**
	 * Function to create configuration for HttpClient request
	 * @param {string} authToken 
	 * @returns {object} Configuration object with headers: {'Authorization': `Bear ...`}
	 */
	public static createAuthConfigNew(authToken: string): { headers: HttpHeaders } {
		return {
			headers: new HttpHeaders({
				'Authorization': `Bearer ${authToken}`,
				'Content-Type': 'application/json'
			})
		};
	}
	/**
	 * Creates an Axios configuration object suitable for multipart/form-data uploads.
	 *
	 * @param authToken - JWT token.
	 * @returns AxiosRequestConfig for file uploads.
	 */
	static createFileUploadConfigNew(authToken: string): { headers: HttpHeaders } {
		return {
			headers: new HttpHeaders({
				'Authorization': `Bearer ${authToken}`,
				'Content-Type': 'multipart/form-data'
			})
		};
	}
	/**
	 * Function to create configuration for HttpClient request
	 * @param {string} authToken 
	 * @returns {object} Configuration object with headers: {'Authorization': `Bear ...`}
	 */
	public static createAuthConfigBlobNew(authToken: string): {headers: HttpHeaders,responseType: string} {
		return {
			headers: new HttpHeaders({
				'Authorization': `Bearer ${authToken}`,
				'Content-Type': 'application/json',
			}),
			responseType: 'blob'
		};
	}
}
