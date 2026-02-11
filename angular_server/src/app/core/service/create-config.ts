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
}
