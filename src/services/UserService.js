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
	static async newUser(user, authToken) {
		try{
			const config = {
				headers: { Authorization: authToken }
			};

			const response = await axios.post('/api/users/new', user, config);

			return response.data;
		} catch (error) {
			// Process 401 for UserController
			if(error.response && (error.response.status === 403))
				return error.response.status;
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
			const config = {
				headers: { Authorization: authToken }
			};

			const response = await axios.get(`/api/user/${encodeURI(userEmail)}`, config);

			return response.data;
		} catch (error) {
			// Process 403 and 404 for UserController
			if(error.response && (error.response.status === 403 || error.response.status === 404))
				return error.response.status;
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
			const config = {
				headers: { Authorization: authToken }
			};

			const response = await axios.get(`/api/update/${encodeURI(user.email)}`, config);

			return response.data;
		} catch (error) {
			// Process 403 and 404 for UserController
			if(error.response && (error.response.status === 403 || error.response.status === 404))
				return error.response.status;
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
			const config = {
				headers: { Authorization: authToken }
			};

			const response = await axios.get(`/api/delete/${encodeURI(user.email)}`, config);

			return response.data;
		} catch (error) {
			// Process 403 and 404 for UserController
			if(error.response && (error.response.status === 403 || error.response.status === 404))
				return error.response.status;
			// Other errors throw next
			throw error;
		}
	}
	
}

export default UserService;
