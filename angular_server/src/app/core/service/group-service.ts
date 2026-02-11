import { Injectable } from '@angular/core';
import axios, { AxiosError } from 'axios';
import { User } from '../model/user';
import { GroupDetails } from '../model/group-details';
import { UserModelAdminResponse } from '../model/user-model-admin-response';
import { GroupBasicInfo } from '../model/group_basic_info';
import { GroupCreateModel } from '../model/group-create-model';
import { GroupUpdateModel } from '../model/group-update-model';
import { CreateConfig } from './create-config';


@Injectable({
	providedIn: 'root',
})
/**
 * Service for working with groups via API
 * @class
 */
export class GroupService {
	
	/**
	 * Get detailed group information with members (for group page)
	 * If user doesn't have access, returns null
	 * 
	 * @param {string} authToken JWT token
	 * @param {string} groupName Group name
	 * @returns {Promise<Object|null>} Object with "group" key or null if no access
	 */
	static async getGroupFullDetails(authToken:string, groupName:string) {
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
			const members = groupData.members.map((member: { surname: string | undefined; name: string | undefined; patronymic: string | undefined; email: string | undefined; }) => 
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
					members
				)
			};
		} catch (error) {
			const axiosError = error as AxiosError<{
				message?: string;
				error?: string;
			}>;
			// Handle 404 as "group doesn't exist or no access"
			if (axiosError.response && axiosError.response.status === 404) {
				return null;
			}
			
			// Handle 403 as permission denied
			if (axiosError.response && axiosError.response.status === 403) {
				return { axiosError: "Недостаточно прав" };
			}
			
			throw axiosError;
		}
	}
	/**
	 * Get detailed group information with members (for group page)
	 * If user doesn't have access, returns null
	 * 
	 * @param {string} authToken JWT token
	 * @param {string} groupName Group name
	 * @returns {Promise<Object|null>} Object with "group" key or null if no access
	 */
	static async getGroupFullDetailsAdmin(authToken:string, groupName:string) {
		try {
			const response = await axios.get(
				`/api/groups/name/${encodeURIComponent(groupName)}/full`,
				this.createConfig(authToken)
			);
			
			const groupData = response.data.group;
			
			// Transform creator
			const creator = new UserModelAdminResponse(
				groupData.creator.surname,
				groupData.creator.name,
				groupData.creator.patronymic,
				groupData.creator.email,
				groupData.creator.createdAt
			);
			
			// Transform members
			const members = groupData.members.map((member: { surname: string | undefined; name: string | undefined; patronymic: string | undefined; email: string | undefined; createdAt: string | undefined; }) => 
				new UserModelAdminResponse(
					member.surname,
					member.name,
					member.patronymic,
					member.email,
					member.createdAt
				)
			);
			
			return {
				group: new GroupDetails(
					groupData.name,
					groupData.membersCount,
					creator,
					members
				)
			};
		} catch (error) {
			const axiosError = error as AxiosError<{
				message?: string;
				error?: string;
			}>;
			// Handle 404 as "group doesn't exist or no access"
			if (axiosError.response && axiosError.response.status === 404) {
				return null;
			}
			
			// Handle 403 as permission denied
			if (axiosError.response && axiosError.response.status === 403) {
				return { axiosError: "Недостаточно прав" };
			}
			
			throw axiosError;
		}
	}
	
	/**
	 * Get list of user's groups (without members)
	 * 
	 * @param {string} authToken JWT token
	 * @returns {Promise<Array<GroupBasicInfo>|Object>} Array of groups or error object
	 */
	static async getMyGroups(authToken:string) {
		try {
			const response = await axios.get(
				'/api/groups/my',
				this.createConfig(authToken)
			);
			
			return response.data.groups.map((group: { name: any; membersCount: any; creatorEmail: any; }) => 
				new GroupBasicInfo(
					group.name,
					group.membersCount,
					group.creatorEmail
				)
			);
		} catch (error) {
			const axiosError = error as AxiosError<{
				message?: string;
				error?: string;
			}>;
			if (axiosError.response && axiosError.response.status === 403) {
				return { axiosError: "Недостаточно прав" };
			}
			
			throw axiosError;
		}
	}
	
	/**
	 * Get all groups (admin only, without members)
	 * 
	 * @param {string} authToken JWT token
	 * @returns {Promise<Array<GroupBasicInfo>|Object>} Array of groups or error object
	 */
	static async getAllGroups(authToken: string) {
		try {
			const response = await axios.get(
				'/api/groups',
				this.createConfig(authToken)
			);
			
			return response.data.groups.map((group: { name: string; membersCount: number; creatorEmail: string; }) => 
				new GroupBasicInfo(
					group.name,
					group.membersCount,
					group.creatorEmail
				)
			);
		} catch (error) {
			const axiosError = error as AxiosError<{
				message?: string;
				error?: string;
			}>;
			if (axiosError.response && axiosError.response.status === 403) {
				return { axiosError: "Требуются права администратора" };
			}
			
			throw axiosError;
		}
	}
	
	/**
	 * Create new group (admin only)
	 * 
	 * @param {string} authToken JWT token
	 * @param {GroupCreateModel} groupCreateModel Group data for creation
	 * @returns {Promise<Object>} Object with "error" or "success" key
	 */
	static async createGroup(authToken: string, groupCreateModel: GroupCreateModel) {
		try {
			const response = await axios.post(
				'/api/groups',
				groupCreateModel,
				this.createConfig(authToken)
			);
			
			return response.data;
		} catch (error) {
			const axiosError = error as AxiosError<{
				message?: string;
				error?: string;
			}>;
			if (axiosError.response && (axiosError.response.status === 403 || axiosError.response.status === 400)) {
				return axiosError.response.data;
			}
			
			throw axiosError;
		}
	}
	
	/**
	 * Update group information (admin only)
	 * 
	 * @param {string} authToken JWT token
	 * @param {string} groupName Current group name
	 * @param {GroupUpdateModel} updateData Object with newName and creatorEmail
	 * @returns {Promise<Object>} Object with "error" or "success" key
	 */
	static async updateGroup(authToken:string, groupName:string, updateData: GroupUpdateModel) {
		try {
			const response = await axios.put(
				`/api/groups/name/${encodeURIComponent(groupName)}`,
				updateData,
				this.createConfig(authToken)
			);
			
			return response.data;
		} catch (error) {
			const axiosError = error as AxiosError<{
				message?: string;
				error?: string;
			}>;
			if (axiosError.response && (axiosError.response.status === 403 || axiosError.response.status === 400 || axiosError.response.status === 404)) {
				return axiosError.response.data;
			}
			
			throw axiosError;
		}
	}
	
	/**
	 * Delete group (admin only)
	 * 
	 * @param {string} authToken JWT token
	 * @param {string} groupName Group name to delete
	 * @returns {Promise<Object>} Object with "error" or "success" key
	 */
	static async deleteGroup(authToken:string, groupName:string) {
		try {
			const response = await axios.delete(
				`/api/groups/name/${encodeURIComponent(groupName)}`,
				this.createConfig(authToken)
			);
			
			return response.data;
		} catch (error) {
			const axiosError = error as AxiosError<{
				message?: string;
				error?: string;
			}>;
			if (axiosError.response && (axiosError.response.status === 403 || axiosError.response.status === 404)) {
				return axiosError.response.data;
			}
			
			throw axiosError;
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
	static async addUserToGroup(authToken:string, groupName:string, userEmail:string) {
		try {
			const response = await axios.post(
				`/api/groups/name/${encodeURIComponent(groupName)}/users/${encodeURIComponent(userEmail)}`,
				{},
				this.createConfig(authToken)
			);
			
			return response.data;
		} catch (error) {
			const axiosError = error as AxiosError<{
				message?: string;
				error?: string;
			}>;
			if (axiosError.response && (axiosError.response.status === 403 || axiosError.response.status === 400 || axiosError.response.status === 404)) {
				return axiosError.response.data;
			}
			
			throw axiosError;
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
	static async removeUserFromGroup(authToken:string, groupName:string, userEmail:string) {
		try {
			const response = await axios.delete(
				`/api/groups/name/${encodeURIComponent(groupName)}/users/${encodeURIComponent(userEmail)}`,
				this.createConfig(authToken)
			);
			
			return response.data;
		} catch (error) {
			const axiosError = error as AxiosError<{
				message?: string;
				error?: string;
			}>;
			if (axiosError.response && (axiosError.response.status === 403 || axiosError.response.status === 400 || axiosError.response.status === 404)) {
				return axiosError.response.data;
			}
			
			throw axiosError;
		}
	}
	
	/**
	 * Check if current user has access to group
	 * 
	 * @param {string} authToken JWT token
	 * @param {string} groupName Group name
	 * @returns {Promise<boolean>} True if user has access
	 */
	static async checkGroupAccess(authToken:string, groupName:string) {
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
	static async searchGroups(authToken:string, pattern:string) {
		try {
			const response = await axios.get(
				`/api/groups/search/${encodeURIComponent(pattern)}`,
				this.createConfig(authToken)
			);
			
			return response.data.groups.map((group: { name: string; membersCount: number; creatorEmail: string; }) => 
				new GroupBasicInfo(
					group.name,
					group.membersCount,
					group.creatorEmail
				)
			);
		} catch (error) {
			const axiosError = error as AxiosError<{
				message?: string;
				error?: string;
			}>;
			if (axiosError.response && axiosError.response.status === 403) {
				return { error: "Требуются права администратора" };
			}
			
			throw axiosError;
		}
	}
	
	/**
	 * Check membership in group
	 * 
	 * @param {string} authToken JWT token
	 * @param {string} groupName Group name
	 * @returns {Promise<Object>} Object with isMember and groupExists
	 */
	static async checkMembership(authToken:string, groupName:string) {
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
	static createConfig(authToken:string) {
		return {
			headers: { 
				'Authorization': `Bearer ${authToken}`,
				'Content-Type': 'application/json'
			}
		};
	}
}