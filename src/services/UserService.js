import axios from "axios";
import '../entity/User'

/**
 * Class for User database entity
 */
class UserService{

	/**
	 * Function for create new user
	 * @param {User} user data for new user
	 * @param {string} authToken Authorization token for admin role checking
	 * @returns {Promise<Object>} Object with "error" or "success" key
	 */
	static async createUser(user, authToken) {
		try{
			const response = await axios.post(
				'/api/users/new', user, UserService.createConfig(authToken)
			);

			return response.data;
		} catch (error) {
			// Process 403 for UserController
			if(error.response && (error.response.status === 403))
				return error.response.data;
			// Other errors throw next
			throw error;
		}
	}


	/**
	 * Function for read user data
	 * @param {string} userEmail email for get user data
	 * @param {string} authToken Authorization token for admin role checking
	 * @returns {Promise<Object>} 
	 * Object with "error" or "user" key. "user" key is used for data storing
	 */
	static async readUser(authToken, userEmail){
		try{
			const response = await axios.get(
				`/api/user/${encodeURI(userEmail)}`, UserService.createConfig(authToken)
			);

			return response.data;
		} catch (error) {
			// Process 403 and 404 for UserController
			if(error.response && (error.response.status === 403 || error.response.status === 404))
				return error.response.data;
			// Other errors throw next
			throw error;
		}
	}


	/**
	 * Function for update user data
	 * @param {User} user data for update
	 * @param {string} authToken Authorization token for admin role checking
	 * @returns {Promise<Object>} Object with "error" or "success" key
	 */
	static async updateUser(authToken, user){
		try{
			const response = await axios.get(
				`/api/update/${encodeURI(user.email)}`, UserService.createConfig(authToken)
			);

			return response.data;
		} catch (error) {
			// Process 403 and 404 for UserController
			if(error.response && (error.response.status === 403 || error.response.status === 404))
				return error.response.data;
			// Other errors throw next
			throw error;
		}
	}


	/**
	 * Function for update user data	 
	 * @param {string} userEmail email for delete user
	 * @param {string} authToken Authorization token for admin role checking
	 * @returns {Promise<Object>} Object with "error" or "success" key
	 */
	static async deleteUser(authToken, user){
		try{
			const response = await axios.get(
				`/api/delete/${encodeURI(user.email)}`, UserService.createConfig(authToken)
			);

			return response.data;
		} catch (error) {
			// Process 403 and 404 for UserController
			if(error.response && (error.response.status === 403 || error.response.status === 404))
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

export default UserService;
