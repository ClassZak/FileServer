import axios from "axios";
import User from "../entity/User";

/**
 * Model for group basic information (for lists)
 */
class GroupBasicInfo {
	constructor(name, membersCount, creatorEmail) {
		this.name = name || '';
		this.membersCount = membersCount || 0;
		this.creatorEmail = creatorEmail || '';
	}
}

/**
 * Model for detailed group information (for group page)
 */
class GroupDetails {
	constructor(name, membersCount, creator, members = [], createdAt = null) {
		this.name = name || '';
		this.membersCount = membersCount || 0;
		this.creator = creator || new User();
		this.members = members || [];
		this.createdAt = createdAt ? new Date(createdAt) : null;
	}
}

/**
 * Service for working with groups via API
 * @class
 */
class GroupService {
	
	/**
	 * Get detailed group information with members (for group page)
	 * If user doesn't have access, returns null
	 * 
	 * @param {string} authToken JWT token
	 * @param {string} groupName Group name
	 * @returns {Promise<Object|null>} Object with "group" key or null if no access
	 */
	static async getGroupFullDetails(authToken, groupName) {
		try {
			const response = await axios.get(
				`/api/groups/name/${encodeURIComponent(groupName)}/full`,
				this.createConfig(authToken)
			);
			
			const groupData = response.data.group;
			
			// Transform creator
			const creator = new User(
				groupData.creator.surname,
				groupData.creator.name,
				groupData.creator.patronymic,
				groupData.creator.email
			);
			
			// Transform members
			const members = groupData.members.map(member => 
				new User(
					member.surname,
					member.name,
					member.patronymic,
					member.email
				)
			);
			
			return {
				group: new GroupDetails(
					groupData.name,
					groupData.membersCount,
					creator,
					members,
					groupData.createdAt
				)
			};
		} catch (error) {
			// Handle 404 as "group doesn't exist or no access"
			if (error.response && error.response.status === 404) {
				return null;
			}
			
			// Handle 403 as permission denied
			if (error.response && error.response.status === 403) {
				return { error: "Недостаточно прав" };
			}
			
			throw error;
		}
	}
	
	/**
	 * Get list of user's groups (without members)
	 * 
	 * @param {string} authToken JWT token
	 * @returns {Promise<Array<GroupBasicInfo>|Object>} Array of groups or error object
	 */
	static async getMyGroups(authToken) {
		try {
			const response = await axios.get(
				'/api/groups/my',
				this.createConfig(authToken)
			);
			
			return response.data.groups.map(group => 
				new GroupBasicInfo(
					group.name,
					group.membersCount,
					group.creatorEmail
				)
			);
		} catch (error) {
			if (error.response && error.response.status === 403) {
				return { error: "Недостаточно прав" };
			}
			
			throw error;
		}
	}
	
	/**
	 * Get all groups (admin only, without members)
	 * 
	 * @param {string} authToken JWT token
	 * @returns {Promise<Array<GroupBasicInfo>|Object>} Array of groups or error object
	 */
	static async getAllGroups(authToken) {
		try {
			const response = await axios.get(
				'/api/groups',
				this.createConfig(authToken)
			);
			
			return response.data.groups.map(group => 
				new GroupBasicInfo(
					group.name,
					group.membersCount,
					group.creatorEmail
				)
			);
		} catch (error) {
			if (error.response && error.response.status === 403) {
				return { error: "Требуются права администратора" };
			}
			
			throw error;
		}
	}
	
	/**
	 * Create new group (admin only)
	 * 
	 * @param {string} authToken JWT token
	 * @param {string} groupName Group name
	 * @returns {Promise<Object>} Object with "error" or "success" key
	 */
	static async createGroup(authToken, groupName) {
		try {
			const response = await axios.post(
				'/api/groups',
				{ name: groupName },
				this.createConfig(authToken)
			);
			
			return response.data;
		} catch (error) {
			if (error.response && (error.response.status === 403 || error.response.status === 400)) {
				return error.response.data;
			}
			
			throw error;
		}
	}
	
	/**
	 * Update group information (admin only)
	 * 
	 * @param {string} authToken JWT token
	 * @param {string} groupName Current group name
	 * @param {Object} updateData Object with newName and creatorEmail
	 * @returns {Promise<Object>} Object with "error" or "success" key
	 */
	static async updateGroup(authToken, groupName, updateData) {
		try {
			const response = await axios.put(
				`/api/groups/name/${encodeURIComponent(groupName)}`,
				updateData,
				this.createConfig(authToken)
			);
			
			return response.data;
		} catch (error) {
			if (error.response && (error.response.status === 403 || error.response.status === 400 || error.response.status === 404)) {
				return error.response.data;
			}
			
			throw error;
		}
	}
	
	/**
	 * Delete group (admin only)
	 * 
	 * @param {string} authToken JWT token
	 * @param {string} groupName Group name to delete
	 * @returns {Promise<Object>} Object with "error" or "success" key
	 */
	static async deleteGroup(authToken, groupName) {
		try {
			const response = await axios.delete(
				`/api/groups/name/${encodeURIComponent(groupName)}`,
				this.createConfig(authToken)
			);
			
			return response.data;
		} catch (error) {
			if (error.response && (error.response.status === 403 || error.response.status === 404)) {
				return error.response.data;
			}
			
			throw error;
		}
	}
	
	/**
	 * Add user to group (admin only)
	 * 
	 * @param {string} authToken JWT token
	 * @param {string} groupName Group name
	 * @param {string} userEmail User email to add
	 * @returns {Promise<Object>} Object with "error" or "success" key
	 */
	static async addUserToGroup(authToken, groupName, userEmail) {
		try {
			const response = await axios.post(
				`/api/groups/name/${encodeURIComponent(groupName)}/users/${encodeURIComponent(userEmail)}`,
				{},
				this.createConfig(authToken)
			);
			
			return response.data;
		} catch (error) {
			if (error.response && (error.response.status === 403 || error.response.status === 400 || error.response.status === 404)) {
				return error.response.data;
			}
			
			throw error;
		}
	}
	
	/**
	 * Remove user from group (admin only)
	 * 
	 * @param {string} authToken JWT token
	 * @param {string} groupName Group name
	 * @param {string} userEmail User email to remove
	 * @returns {Promise<Object>} Object with "error" or "success" key
	 */
	static async removeUserFromGroup(authToken, groupName, userEmail) {
		try {
			const response = await axios.delete(
				`/api/groups/name/${encodeURIComponent(groupName)}/users/${encodeURIComponent(userEmail)}`,
				this.createConfig(authToken)
			);
			
			return response.data;
		} catch (error) {
			if (error.response && (error.response.status === 403 || error.response.status === 400 || error.response.status === 404)) {
				return error.response.data;
			}
			
			throw error;
		}
	}
	
	/**
	 * Check if current user has access to group
	 * 
	 * @param {string} authToken JWT token
	 * @param {string} groupName Group name
	 * @returns {Promise<boolean>} True if user has access
	 */
	static async checkGroupAccess(authToken, groupName) {
		try {
			const response = await axios.get(
				`/api/groups/name/${encodeURIComponent(groupName)}/check-access`,
				this.createConfig(authToken)
			);
			
			return response.data.hasAccess;
		} catch (error) {
			console.error("Error checking group access:", error);
			return false;
		}
	}
	
	/**
	 * Search groups by name pattern (admin only)
	 * 
	 * @param {string} authToken JWT token
	 * @param {string} pattern Search pattern
	 * @returns {Promise<Array<GroupBasicInfo>|Object>} Array of groups or error object
	 */
	static async searchGroups(authToken, pattern) {
		try {
			const response = await axios.get(
				`/api/groups/search/${encodeURIComponent(pattern)}`,
				this.createConfig(authToken)
			);
			
			return response.data.groups.map(group => 
				new GroupBasicInfo(
					group.name,
					group.membersCount,
					group.creatorEmail
				)
			);
		} catch (error) {
			if (error.response && error.response.status === 403) {
				return { error: "Требуются права администратора" };
			}
			
			throw error;
		}
	}
	
	/**
	 * Check membership in group
	 * 
	 * @param {string} authToken JWT token
	 * @param {string} groupName Group name
	 * @returns {Promise<Object>} Object with isMember and groupExists
	 */
	static async checkMembership(authToken, groupName) {
		try {
			const response = await axios.get(
				`/api/groups/name/${encodeURIComponent(groupName)}/membership`,
				this.createConfig(authToken)
			);
			
			return response.data;
		} catch (error) {
			console.error("Error checking membership:", error);
			return { isMember: false, groupExists: false };
		}
	}
	
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
}

export default GroupService;