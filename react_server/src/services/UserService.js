import axios from "axios";
import User from "../entity/User";
import UserModelAdminResponse from "../entity/UserModelAdminResponse";

/**
 * Class for User database entity
 */
class UserService {

	/**
	 * Function for create new user
	 * @param {User} user data for new user
	 * @param {string} authToken Authorization token for admin role checking
	 * @returns {Promise<Object>} Object with "error" or "success" key
	 */
	static async createUser(user, authToken) {
		try {
			const response = await axios.post(
				'/api/users/new', user, UserService.createConfig(authToken)
			);

			return response.data;
		} catch (error) {
			// Process 403 for UserController
			if (error.response && (error.response.status === 403))
				return error.response.data;
			// Other errors throw next
			throw error;
		}
	}


	/**
	 * Function for read user data
	 * @param {string} authToken Authorization token for admin role checking
	 * @param {string} userEmail email for get user data
	 * @returns {Promise<Object>}
	 * Object with "error" or "user" key. "user" key is used for data storing
	 */
	static async readUser(authToken, userEmail) {
		try {
			const response = await axios.get(
				`/api/users/user/${encodeURI(userEmail)}`, UserService.createConfig(authToken)
			);

			return response.data;
		} catch (error) {
			// Process 403 and 404 for UserController
			if (error.response && (error.response.status === 403 || error.response.status === 404))
				return error.response.data;
			// Other errors throw next
			throw error;
		}
	}


	/**
	 * Function for update user data
	 * @param {string} authToken Authorization token for admin role checking
	 * @param {string} email email of user to update
	 * @param {User} user data for update
	 * @returns {Promise<Object>} Object with "error" or "success" key
	 */
	static async updateUser(authToken, email, user) {
		try {
			const response = await axios.put(
				`/api/users/update/${encodeURI(email)}`, user, UserService.createConfig(authToken)
			);

			return response.data;
		} catch (error) {
			// Process 403 and 404 for UserController
			if (error.response && (error.response.status === 403 || error.response.status === 404))
				return error.response.data;
			// Other errors throw next
			throw error;
		}
	}


	/**
	 * Function for delete user
	 * @param {string} authToken Authorization token for admin role checking
	 * @param {User} user user object with email to delete
	 * @returns {Promise<Object>} Object with "error" or "success" key
	 */
	static async deleteUser(authToken, user) {
		try {
			const response = await axios.delete(
				`/api/users/delete/${encodeURI(user.email)}`, UserService.createConfig(authToken)
			);

			return response.data;
		} catch (error) {
			// Process 403 and 404 for UserController
			if (error.response && (error.response.status === 403 || error.response.status === 404))
				return error.response.data;
			// Other errors throw next
			throw error;
		}
	}


	/**
	 * Function for read all users
	 * @param {string} authToken Authorization token for admin role checking
	 * @returns {Promise<Object>}
	 * Object with "error" or "users" key. "users" key is used for users list storing
	 */
	static async readAllUsers(authToken) {
		try {
			const response = await axios.get(
				`/api/users/users`, UserService.createConfig(authToken)
			);

			return response.data;
		} catch (error) {
			// Process 403 for UserController
			if (error.response && (error.response.status === 403))
				return error.response.data;
			// Other errors throw next
			throw error;
		}
	}


	/**
	 * Function for update user password
	 * @param {string} authToken Authorization token for admin role checking
	 * @param {string} email email of user to update password
	 * @param {Object} passwordData object with oldPassword and newPassword
	 * @returns {Promise<Object>} Object with "error" or "success" key
	 */
	static async updateUserPassword(authToken, email, passwordData) {
		try {
			const response = await axios.put(
				`/api/users/update-password/${encodeURI(email)}`,
				passwordData,
				UserService.createConfig(authToken)
			);

			return response.data;
		} catch (error) {
			// Process 403 and 404 for UserController
			if (error.response && (error.response.status === 403 || error.response.status === 404))
				return error.response.data;
			// Other errors throw next
			throw error;
		}
	}




	/**
	 * Function to create configuration for request
	 * @param {string} authToken
	 * @returns {Object} Configuration object with headers: {'Authorization': `Bearer ...`}
	 */
	static createConfig(authToken) {
		return {
			headers: { 'Authorization': `Bearer ${authToken}` }
		}
	}
}

export default UserService;