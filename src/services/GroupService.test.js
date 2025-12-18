// GroupService.test.js
import axios from "axios";
import GroupService from "./GroupService";
import User from "../entity/User";

// Mock axios
jest.mock("axios");

describe("GroupService", () => {
	const authToken = "test-jwt-token";
	const groupName = "test-group";
	const userEmail = "test@example.com";
	
	beforeEach(() => {
		jest.clearAllMocks();
	});
	
	describe("createConfig", () => {
		it("should create config with authorization header", () => {
			const config = GroupService.createConfig(authToken);
			
			expect(config).toEqual({
				headers: {
					'Authorization': 'Bearer test-jwt-token',
					'Content-Type': 'application/json'
				}
			});
		});
	});
	
	describe("getGroupFullDetails", () => {
		it("should return group details with members", async () => {
			const mockResponse = {
				data: {
					group: {
						name: "developers",
						membersCount: 5,
						creator: {
							surname: "Иванов",
							name: "Иван",
							patronymic: "Иванович",
							email: "ivanov@example.com"
						},
						members: [
							{
								surname: "Иванов",
								name: "Иван",
								patronymic: "Иванович",
								email: "ivanov@example.com"
							},
							{
								surname: "Петров",
								name: "Петр",
								patronymic: "Петрович",
								email: "petrov@example.com"
							}
						],
						createdAt: "2024-01-15T10:30:00"
					}
				}
			};
			
			axios.get.mockResolvedValue(mockResponse);
			
			const result = await GroupService.getGroupFullDetails(authToken, groupName);
			
			expect(axios.get).toHaveBeenCalledWith(
				`/api/groups/name/${encodeURIComponent(groupName)}/full`,
				GroupService.createConfig(authToken)
			);
			
			expect(result.group).toBeInstanceOf(Object);
			expect(result.group.name).toBe("developers");
			expect(result.group.membersCount).toBe(5);
			expect(result.group.creator).toBeInstanceOf(User);
			expect(result.group.members).toHaveLength(2);
			expect(result.group.members[0]).toBeInstanceOf(User);
		});
		
		it("should return null when access denied (404)", async () => {
			const mockError = {
				response: {
					status: 404
				}
			};
			
			axios.get.mockRejectedValue(mockError);
			
			const result = await GroupService.getGroupFullDetails(authToken, groupName);
			
			expect(result).toBeNull();
		});
		
		it("should return error object on 403", async () => {
			const mockError = {
				response: {
					status: 403,
					data: { error: "Недостаточно прав" }
				}
			};
			
			axios.get.mockRejectedValue(mockError);
			
			const result = await GroupService.getGroupFullDetails(authToken, groupName);
			
			expect(result).toEqual({ error: "Недостаточно прав" });
		});
		
		it("should throw error on network failure", async () => {
			const mockError = new Error("Network error");
			axios.get.mockRejectedValue(mockError);
			
			await expect(GroupService.getGroupFullDetails(authToken, groupName))
				.rejects.toThrow("Network error");
		});
	});
	
	describe("getMyGroups", () => {
		it("should return user groups list", async () => {
			const mockResponse = {
				data: {
					groups: [
						{ name: "developers", membersCount: 5, creatorEmail: "admin@example.com" },
						{ name: "designers", membersCount: 3, creatorEmail: "user@example.com" }
					]
				}
			};
			
			axios.get.mockResolvedValue(mockResponse);
			
			const result = await GroupService.getMyGroups(authToken);
			
			expect(axios.get).toHaveBeenCalledWith(
				'/api/groups/my',
				GroupService.createConfig(authToken)
			);
			
			expect(result).toHaveLength(2);
			expect(result[0].name).toBe("developers");
			expect(result[1].name).toBe("designers");
		});
	});
	
	describe("getAllGroups", () => {
		it("should return all groups for admin", async () => {
			const mockResponse = {
				data: {
					groups: [
						{ name: "group1", membersCount: 10, creatorEmail: "admin@example.com" }
					]
				}
			};
			
			axios.get.mockResolvedValue(mockResponse);
			
			const result = await GroupService.getAllGroups(authToken);
			
			expect(result).toHaveLength(1);
			expect(result[0].name).toBe("group1");
		});
		
		it("should return error when not admin", async () => {
			const mockError = {
				response: {
					status: 403,
					data: { error: "Требуются права администратора" }
				}
			};
			
			axios.get.mockRejectedValue(mockError);
			
			const result = await GroupService.getAllGroups(authToken);
			
			expect(result).toEqual({ error: "Требуются права администратора" });
		});
	});
	
	describe("createGroup", () => {
		it("should create group successfully", async () => {
			const mockResponse = {
				data: { success: true, group: { name: "new-group" } }
			};
			
			axios.post.mockResolvedValue(mockResponse);
			
			const result = await GroupService.createGroup(authToken, "new-group");
			
			expect(axios.post).toHaveBeenCalledWith(
				'/api/groups',
				{ name: "new-group" },
				GroupService.createConfig(authToken)
			);
			
			expect(result.success).toBe(true);
		});
		
		it("should handle validation error", async () => {
			const mockError = {
				response: {
					status: 400,
					data: { error: "Группа с таким именем уже существует" }
				}
			};
			
			axios.post.mockRejectedValue(mockError);
			
			const result = await GroupService.createGroup(authToken, "existing-group");
			
			expect(result.error).toBe("Группа с таким именем уже существует");
		});
	});
	
	describe("updateGroup", () => {
		it("should update group successfully", async () => {
			const mockResponse = {
				data: { success: true, message: "Группа обновлена" }
			};
			
			const updateData = {
				newName: "updated-group",
				creatorEmail: "newadmin@example.com"
			};
			
			axios.put.mockResolvedValue(mockResponse);
			
			const result = await GroupService.updateGroup(authToken, groupName, updateData);
			
			expect(axios.put).toHaveBeenCalledWith(
				`/api/groups/name/${encodeURIComponent(groupName)}`,
				updateData,
				GroupService.createConfig(authToken)
			);
			
			expect(result.success).toBe(true);
		});
	});
	
	describe("deleteGroup", () => {
		it("should delete group successfully", async () => {
			const mockResponse = {
				data: { success: true, message: "Группа удалена" }
			};
			
			axios.delete.mockResolvedValue(mockResponse);
			
			const result = await GroupService.deleteGroup(authToken, groupName);
			
			expect(axios.delete).toHaveBeenCalledWith(
				`/api/groups/name/${encodeURIComponent(groupName)}`,
				GroupService.createConfig(authToken)
			);
			
			expect(result.success).toBe(true);
		});
	});
	
	describe("addUserToGroup", () => {
		it("should add user to group successfully", async () => {
			const mockResponse = {
				data: { 
					success: true, 
					message: "Пользователь test@example.com добавлен в группу 'test-group'" 
				}
			};
			
			axios.post.mockResolvedValue(mockResponse);
			
			const result = await GroupService.addUserToGroup(authToken, groupName, userEmail);
			
			expect(axios.post).toHaveBeenCalledWith(
				`/api/groups/name/${encodeURIComponent(groupName)}/users/${encodeURIComponent(userEmail)}`,
				{},
				GroupService.createConfig(authToken)
			);
			
			expect(result.success).toBe(true);
		});
	});
	
	describe("removeUserFromGroup", () => {
		it("should remove user from group successfully", async () => {
			const mockResponse = {
				data: { 
					success: true, 
					message: "Пользователь test@example.com исключен из группы 'test-group'" 
				}
			};
			
			axios.delete.mockResolvedValue(mockResponse);
			
			const result = await GroupService.removeUserFromGroup(authToken, groupName, userEmail);
			
			expect(axios.delete).toHaveBeenCalledWith(
				`/api/groups/name/${encodeURIComponent(groupName)}/users/${encodeURIComponent(userEmail)}`,
				GroupService.createConfig(authToken)
			);
			
			expect(result.success).toBe(true);
		});
	});
	
	describe("checkGroupAccess", () => {
		it("should return true when user has access", async () => {
			const mockResponse = {
				data: { hasAccess: true }
			};
			
			axios.get.mockResolvedValue(mockResponse);
			
			const result = await GroupService.checkGroupAccess(authToken, groupName);
			
			expect(result).toBe(true);
		});
		
		it("should return false on error", async () => {
			const mockError = new Error("Network error");
			axios.get.mockRejectedValue(mockError);
			
			const result = await GroupService.checkGroupAccess(authToken, groupName);
			
			expect(result).toBe(false);
		});
	});
	
	describe("searchGroups", () => {
		it("should search groups successfully", async () => {
			const mockResponse = {
				data: {
					groups: [
						{ name: "developers", membersCount: 5, creatorEmail: "admin@example.com" }
					],
					pattern: "dev"
				}
			};
			
			axios.get.mockResolvedValue(mockResponse);
			
			const result = await GroupService.searchGroups(authToken, "dev");
			
			expect(result).toHaveLength(1);
			expect(result[0].name).toBe("developers");
		});
	});
	
	describe("checkMembership", () => {
		it("should check membership successfully", async () => {
			const mockResponse = {
				data: {
					isMember: true,
					groupExists: true,
					groupName: "test-group"
				}
			};
			
			axios.get.mockResolvedValue(mockResponse);
			
			const result = await GroupService.checkMembership(authToken, groupName);
			
			expect(result.isMember).toBe(true);
			expect(result.groupExists).toBe(true);
		});
		
		it("should return default values on error", async () => {
			const mockError = new Error("Network error");
			axios.get.mockRejectedValue(mockError);
			
			const result = await GroupService.checkMembership(authToken, groupName);
			
			expect(result.isMember).toBe(false);
			expect(result.groupExists).toBe(false);
		});
	});
});