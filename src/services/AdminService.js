import axios from "axios";


/**
 * Class for Adminstrator database entity
 */
class AdminService{
	/**
	 * Checking is user administrator or not
	 * @param {string} authToken Authorization token for admin role checking
	 * @returns {Promise<Object>} Operation result with isAdmin key
	 */
	static async isAdmin(authToken){
		try {
			const response = await axios.get('/api/admin/is-admin',AdminService.createConfig(authToken));
			
			return response.data;
		} catch (error) {
			// Process 401 and 404 errors for AdministratorController
			if (error.response && (error.response.status === 401 || error.response.status === 404))
				return error.response.data;
			// Other errors throw next
			throw error;
		}
	}
	/**
	 * Function to create configuration for request
	 * @param {string} authToken 
	 * @returns {Object} Configuration object with headers: {'Authorization': `Bear ...`}
	 */
	static createConfig(authToken) {
		return { 
			headers: { 'Authorization': `Bearer ${authToken}` }
		}
	}
}

export default AdminService;