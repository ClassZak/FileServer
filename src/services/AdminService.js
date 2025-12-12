import axios from "axios";


/**
 * Class for Adminstrator database entity
 */
class AdminService{
	/**
	 * Checking is user administrator or not
	 * @param {string} authToken - Authorization token for admin role checking
	 * @returns {Promise<Object>} - Operation result
	 */
	static async isAdmin(authToken){
		try {
			const config = {
				headers: { Authorization: authToken }
			};
			
			const response = await axios.get('/api/admin/is-admin', config);
			
			return response.data;
		} catch (error) {
			// Process 401 and 404 errors for AdministratorController
			if (error.response && (error.response.status === 401 || error.response.status === 404)) {
				return error.response.data;
			}
			// Other errors throw next
			throw error;
		}
	}
}

export default AdminService;