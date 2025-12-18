import axios from 'axios';
import UserService from './UserService';

// Mock axios
jest.mock('axios');

describe('UserService', () => {
	const mockAuthToken = 'mock-jwt-token';
	const mockUser = {
		surname: 'Doe',
		name: 'John',
		patronymic: 'Smith',
		email: 'john@example.com',
		password: 'password123'
	};
	
	const mockUserResponse = {
		name: 'John',
		surname: 'Doe',
		patronymic: 'Smith',
		email: 'john@example.com'
	};

	const mockUsersResponse = {
		users: [{
			name: "Иван",
			patronymic: "Иванович",
			surname: "Иванов",
		}]
	};

	const mockPasswordData = {
		oldPassword: 'oldPassword123',
		newPassword: 'newPassword123'
	};

	afterEach(() => {
		jest.clearAllMocks();
	});
	
	describe('createUser', () => {
		it('успешно создает пользователя и возвращает данные', async () => {
			// Arrange
			const mockResponse = {
				data: { success: true },
				status: 200
			};
			axios.post.mockResolvedValue(mockResponse);

			// Act
			const result = await UserService.createUser(mockUser, mockAuthToken);

			// Assert
			expect(axios.post).toHaveBeenCalledWith(
				'/api/users/new',
				mockUser, 
				UserService.createConfig(mockAuthToken)
			);
			expect(result).toEqual({ success: true });
		});

		it('возвращает сообщение об ошибке при отсутствии прав администратора (403)', async () => {
			// Arrange
			const errorResponse = {
				response: {
					status: 403,
					data: { error: 'You are not admin!' }
				}
			};
			axios.post.mockRejectedValue(errorResponse);

			// Act
			const result = await UserService.createUser(mockUser, mockAuthToken);

			// Assert
			expect(result).toEqual({ error: 'You are not admin!' });
		});

		it('пробрасывает ошибку при других кодах ошибок', async () => {
			// Arrange
			const errorResponse = {
				response: {
					status: 500,
					data: { error: 'Internal server error' }
				}
			};
			axios.post.mockRejectedValue(errorResponse);

			// Act & Assert
			await expect(UserService.createUser(mockUser, mockAuthToken))
				.rejects.toEqual(errorResponse);
		});
	});

	describe('readUser', () => {
		const userEmail = 'test@example.com';

		it('успешно получает данные пользователя', async () => {
			// Arrange
			const mockResponse = {
				data: { user: mockUserResponse },
				status: 200
			};
			axios.get.mockResolvedValue(mockResponse);

			// Act
			const result = await UserService.readUser(mockAuthToken, userEmail);

			// Assert
			expect(axios.get).toHaveBeenCalledWith(
				`/api/users/user/${encodeURI(userEmail)}`, 
				UserService.createConfig(mockAuthToken)
			);
			expect(result).toEqual({ user: mockUserResponse });
		});

		it('возвращает сообщение об ошибке при отсутствии прав администратора (403)', async () => {
			// Arrange
			const errorResponse = {
				response: {
					status: 403,
					data: { error: 'You are not admin!' }
				}
			};
			axios.get.mockRejectedValue(errorResponse);

			// Act
			const result = await UserService.readUser(mockAuthToken, userEmail);

			// Assert
			expect(result).toEqual({ error: 'You are not admin!' });
		});

		it('возвращает сообщение об ошибке при отсутствии пользователя (404)', async () => {
			// Arrange
			const errorResponse = {
				response: {
					status: 404,
					data: { error: 'User not found' }
				}
			};
			axios.get.mockRejectedValue(errorResponse);

			// Act
			const result = await UserService.readUser(mockAuthToken, userEmail);

			// Assert
			expect(result).toEqual({ error: 'User not found' });
		});

		it('пробрасывает ошибку при других кодах ошибок', async () => {
			// Arrange
			const errorResponse = {
				response: {
					status: 500,
					data: { error: 'Internal server error' }
				}
			};
			axios.get.mockRejectedValue(errorResponse);

			// Act & Assert
			await expect(UserService.readUser(mockAuthToken, userEmail))
				.rejects.toEqual(errorResponse);
		});

		it('корректно кодирует email в URL', async () => {
			// Arrange
			const emailWithSpecialChars = 'test+user@example.com';
			const mockResponse = {
				data: { user: mockUserResponse }
			};
			axios.get.mockResolvedValue(mockResponse);

			// Act
			await UserService.readUser(mockAuthToken, emailWithSpecialChars);

			// Assert
			expect(axios.get).toHaveBeenCalledWith(
				`/api/users/user/${encodeURI(emailWithSpecialChars)}`,
				UserService.createConfig(mockAuthToken)
			);
		});
	});

	describe('updateUser', () => {
		const userEmail = 'john@example.com';
		
		it('успешно обновляет пользователя', async () => {
			// Arrange
			const mockResponse = {
				data: { success: true },
				status: 200
			};
			axios.put.mockResolvedValue(mockResponse);

			// Act
			const result = await UserService.updateUser(mockAuthToken, userEmail, mockUser);

			// Assert
			expect(axios.put).toHaveBeenCalledWith(
				`/api/users/update/${encodeURI(userEmail)}`, 
				mockUser, 
				UserService.createConfig(mockAuthToken)
			);
			expect(result).toEqual({ success: true });
		});

		it('возвращает сообщение об ошибке при отсутствии прав администратора (403)', async () => {
			// Arrange
			const errorResponse = {
				response: {
					status: 403,
					data: { error: 'You are not admin!' }
				}
			};
			axios.put.mockRejectedValue(errorResponse);

			// Act
			const result = await UserService.updateUser(mockAuthToken, userEmail, mockUser);

			// Assert
			expect(result).toEqual({ error: 'You are not admin!' });
		});

		it('возвращает сообщение об ошибке при отсутствии пользователя (404)', async () => {
			// Arrange
			const errorResponse = {
				response: {
					status: 404,
					data: { error: 'User not found' }
				}
			};
			axios.put.mockRejectedValue(errorResponse);

			// Act
			const result = await UserService.updateUser(mockAuthToken, userEmail, mockUser);

			// Assert
			expect(result).toEqual({ error: 'User not found' });
		});

		it('пробрасывает ошибку при других кодах ошибок', async () => {
			// Arrange
			const errorResponse = {
				response: {
					status: 500,
					data: { error: 'Internal server error' }
				}
			};
			axios.put.mockRejectedValue(errorResponse);

			// Act & Assert
			await expect(UserService.updateUser(mockAuthToken, userEmail, mockUser))
				.rejects.toEqual(errorResponse);
		});

		it('корректно кодирует email в URL', async () => {
			// Arrange
			const emailWithSpecialChars = 'test+user@example.com';
			const mockResponse = {
				data: { success: true }
			};
			axios.put.mockResolvedValue(mockResponse);

			// Act
			await UserService.updateUser(mockAuthToken, emailWithSpecialChars, mockUser);

			// Assert
			expect(axios.put).toHaveBeenCalledWith(
				`/api/users/update/${encodeURI(emailWithSpecialChars)}`,
				mockUser,
				UserService.createConfig(mockAuthToken)
			);
		});
	});

	describe('deleteUser', () => {
		it('успешно удаляет пользователя', async () => {
			// Arrange
			const mockResponse = {
				data: { success: true },
				status: 200
			};
			axios.delete.mockResolvedValue(mockResponse);

			// Act
			const result = await UserService.deleteUser(mockAuthToken, mockUser);

			// Assert
			expect(axios.delete).toHaveBeenCalledWith(
				`/api/users/delete/${encodeURI(mockUser.email)}`, 
				UserService.createConfig(mockAuthToken)
			);
			expect(result).toEqual({ success: true });
		});

		it('возвращает сообщение об ошибке при отсутствии прав администратора (403)', async () => {
			// Arrange
			const errorResponse = {
				response: {
					status: 403,
					data: { error: 'You are not admin!' }
				}
			};
			axios.delete.mockRejectedValue(errorResponse);

			// Act
			const result = await UserService.deleteUser(mockAuthToken, mockUser);

			// Assert
			expect(result).toEqual({ error: 'You are not admin!' });
		});

		it('возвращает сообщение об ошибке при отсутствии пользователя (404)', async () => {
			// Arrange
			const errorResponse = {
				response: {
					status: 404,
					data: { error: 'User not found' }
				}
			};
			axios.delete.mockRejectedValue(errorResponse);

			// Act
			const result = await UserService.deleteUser(mockAuthToken, mockUser);

			// Assert
			expect(result).toEqual({ error: 'User not found' });
		});

		it('пробрасывает ошибку при других кодах ошибок', async () => {
			// Arrange
			const errorResponse = {
				response: {
					status: 500,
					data: { error: 'Internal server error' }
				}
			};
			axios.delete.mockRejectedValue(errorResponse);

			// Act & Assert
			await expect(UserService.deleteUser(mockAuthToken, mockUser))
				.rejects.toEqual(errorResponse);
		});

		it('корректно кодирует email в URL', async () => {
			// Arrange
			const userWithSpecialEmail = {
				...mockUser,
				email: 'test+delete@example.com'
			};
			const mockResponse = {
				data: { success: true }
			};
			axios.delete.mockResolvedValue(mockResponse);

			// Act
			await UserService.deleteUser(mockAuthToken, userWithSpecialEmail);

			// Assert
			expect(axios.delete).toHaveBeenCalledWith(
				`/api/users/delete/${encodeURI(userWithSpecialEmail.email)}`,
				UserService.createConfig(mockAuthToken)
			);
		});
	});

	describe('readAllUsers', () => {
		it('успешно получает данные пользователей', async () => {
			// Arrange
			const mockResponse = {
				data: { users: [{surname: 'Иванов', name: 'Иван', patronymic: 'Иванович'}] },
				status: 200
			};
			axios.get.mockResolvedValue(mockResponse);

			// Act
			const result = await UserService.readAllUsers(mockAuthToken);

			// Assert
			expect(axios.get).toHaveBeenCalledWith(
				'/api/users/users', 
				UserService.createConfig(mockAuthToken)
			);
			expect(result).toEqual(mockUsersResponse);
		});

		it('возвращает сообщение об ошибке при отсутствии прав администратора (403)', async () => {
			// Arrange
			const errorResponse = {
				response: {
					status: 403,
					data: { error: 'You are not admin!' }
				}
			};
			axios.get.mockRejectedValue(errorResponse);

			// Act
			const result = await UserService.readAllUsers(mockAuthToken);

			// Assert
			expect(result).toEqual({ error: 'You are not admin!' });
		});

		it('пробрасывает ошибку при других кодах ошибок', async () => {
			// Arrange
			const errorResponse = {
				response: {
					status: 500,
					data: { error: 'Internal server error' }
				}
			};
			axios.get.mockRejectedValue(errorResponse);

			// Act & Assert
			await expect(UserService.readAllUsers(mockAuthToken))
				.rejects.toEqual(errorResponse);
		});
	});

	describe('updateUserPassword', () => {
		const userEmail = 'john@example.com';
		
		it('успешно обновляет пароль пользователя', async () => {
			// Arrange
			const mockResponse = {
				data: { success: true },
				status: 200
			};
			axios.put.mockResolvedValue(mockResponse);

			// Act
			const result = await UserService.updateUserPassword(mockAuthToken, userEmail, mockPasswordData);

			// Assert
			expect(axios.put).toHaveBeenCalledWith(
				`/api/users/update-password/${encodeURI(userEmail)}`,
				mockPasswordData,
				UserService.createConfig(mockAuthToken)
			);
			expect(result).toEqual({ success: true });
		});

		it('возвращает сообщение об ошибке при отсутствии прав (403)', async () => {
			// Arrange
			const errorResponse = {
				response: {
					status: 403,
					data: { error: 'Недостаточно прав' }
				}
			};
			axios.put.mockRejectedValue(errorResponse);

			// Act
			const result = await UserService.updateUserPassword(mockAuthToken, userEmail, mockPasswordData);

			// Assert
			expect(result).toEqual({ error: 'Недостаточно прав' });
		});

		it('возвращает сообщение об ошибке при отсутствии пользователя (404)', async () => {
			// Arrange
			const errorResponse = {
				response: {
					status: 404,
					data: { error: 'User not found' }
				}
			};
			axios.put.mockRejectedValue(errorResponse);

			// Act
			const result = await UserService.updateUserPassword(mockAuthToken, userEmail, mockPasswordData);

			// Assert
			expect(result).toEqual({ error: 'User not found' });
		});

		it('пробрасывает ошибку при других кодах ошибок', async () => {
			// Arrange
			const errorResponse = {
				response: {
					status: 500,
					data: { error: 'Internal server error' }
				}
			};
			axios.put.mockRejectedValue(errorResponse);

			// Act & Assert
			await expect(UserService.updateUserPassword(mockAuthToken, userEmail, mockPasswordData))
				.rejects.toEqual(errorResponse);
		});

		it('корректно кодирует email в URL', async () => {
			// Arrange
			const emailWithSpecialChars = 'test+password@example.com';
			const mockResponse = {
				data: { success: true }
			};
			axios.put.mockResolvedValue(mockResponse);

			// Act
			await UserService.updateUserPassword(mockAuthToken, emailWithSpecialChars, mockPasswordData);

			// Assert
			expect(axios.put).toHaveBeenCalledWith(
				`/api/users/update-password/${encodeURI(emailWithSpecialChars)}`,
				mockPasswordData,
				UserService.createConfig(mockAuthToken)
			);
		});
	});

	describe('createConfig', () => {
		it('корректно формирует заголовки с токеном авторизации', () => {
			// Arrange
			const customToken = 'custom-token-123';
			
			// Act
			const result = UserService.createConfig(customToken);

			// Assert
			expect(result).toEqual({
				headers: { 
					Authorization: `Bearer ${customToken}` 
				}
			});
		});

		it('возвращает объект с заголовками для разных токенов', () => {
			// Arrange & Act
			const config1 = UserService.createConfig('token1');
			const config2 = UserService.createConfig('token2');
			const emptyConfig = UserService.createConfig('');

			// Assert
			expect(config1.headers.Authorization).toBe('Bearer token1');
			expect(config2.headers.Authorization).toBe('Bearer token2');
			expect(emptyConfig.headers.Authorization).toBe('Bearer ');
		});
	});

	describe('Общие тесты', () => {
		it('корректно формирует заголовки с токеном авторизации для всех методов', async () => {
			// Arrange
			const customToken = 'custom-token-123';
			const mockResponse = { data: { success: true } };
			
			// Мокаем все методы axios
			axios.post.mockResolvedValue(mockResponse);
			axios.get.mockResolvedValue(mockResponse);
			axios.put.mockResolvedValue(mockResponse);
			axios.delete.mockResolvedValue(mockResponse);

			// Act & Assert для каждого метода
			await UserService.createUser(mockUser, customToken);
			expect(axios.post).toHaveBeenCalledWith(
				expect.any(String),
				expect.any(Object),
				{ headers: { Authorization: `Bearer ${customToken}` } }
			);

			await UserService.readUser(customToken, 'test@example.com');
			expect(axios.get).toHaveBeenCalledWith(
				expect.any(String),
				{ headers: { Authorization: `Bearer ${customToken}` } }
			);

			await UserService.updateUser(customToken, 'test@example.com', mockUser);
			expect(axios.put).toHaveBeenCalledWith(
				expect.any(String),
				expect.any(Object),
				{ headers: { Authorization: `Bearer ${customToken}` } }
			);

			await UserService.deleteUser(customToken, mockUser);
			expect(axios.delete).toHaveBeenCalledWith(
				expect.any(String),
				{ headers: { Authorization: `Bearer ${customToken}` } }
			);

			await UserService.readAllUsers(customToken);
			expect(axios.get).toHaveBeenCalledWith(
				expect.any(String),
				{ headers: { Authorization: `Bearer ${customToken}` } }
			);

			await UserService.updateUserPassword(customToken, mockUser.email, mockPasswordData);
			expect(axios.put).toHaveBeenCalledWith(
				`/api/users/update-password/${encodeURI(mockUser.email)}`,
				mockPasswordData,
				{ headers: { Authorization: `Bearer ${customToken}` } }
			);
		});

		it('пробрасывает сетевые ошибки', async () => {
			// Arrange
			const networkError = new Error('Network Error');
			axios.post.mockRejectedValue(networkError);
			axios.get.mockRejectedValue(networkError);
			axios.put.mockRejectedValue(networkError);
			axios.delete.mockRejectedValue(networkError);

			// Act & Assert для каждого метода
			await expect(UserService.createUser(mockUser, mockAuthToken))
				.rejects.toThrow('Network Error');
			
			await expect(UserService.readUser(mockAuthToken, 'test@example.com'))
				.rejects.toThrow('Network Error');
			
			await expect(UserService.updateUser(mockAuthToken, 'test@example.com', mockUser))
				.rejects.toThrow('Network Error');
			
			await expect(UserService.deleteUser(mockAuthToken, mockUser))
				.rejects.toThrow('Network Error');
			
			await expect(UserService.readAllUsers(mockAuthToken))
				.rejects.toThrow('Network Error');
			
			await expect(UserService.updateUserPassword(mockAuthToken, mockUser.email, mockPasswordData))
				.rejects.toThrow('Network Error');
		});

		it('не обрабатывает ошибки без response объекта', async () => {
			// Arrange
			const errorWithoutResponse = new Error('Some error');
			axios.post.mockRejectedValue(errorWithoutResponse);
			axios.get.mockRejectedValue(errorWithoutResponse);
			axios.put.mockRejectedValue(errorWithoutResponse);
			axios.delete.mockRejectedValue(errorWithoutResponse);

			// Act & Assert для каждого метода
			await expect(UserService.createUser(mockUser, mockAuthToken))
				.rejects.toThrow('Some error');
			
			await expect(UserService.readUser(mockAuthToken, 'test@example.com'))
				.rejects.toThrow('Some error');
			
			await expect(UserService.updateUser(mockAuthToken, 'test@example.com', mockUser))
				.rejects.toThrow('Some error');
			
			await expect(UserService.deleteUser(mockAuthToken, mockUser))
				.rejects.toThrow('Some error');
			
			await expect(UserService.readAllUsers(mockAuthToken))
				.rejects.toThrow('Some error');
			
			await expect(UserService.updateUserPassword(mockAuthToken, mockUser.email, mockPasswordData))
				.rejects.toThrow('Some error');
		});

		it('обрабатывает успешный ответ без данных', async () => {
			// Arrange
			const emptyResponse = {
				data: {},
				status: 200
			};
			axios.post.mockResolvedValue(emptyResponse);
			axios.get.mockResolvedValue(emptyResponse);
			axios.put.mockResolvedValue(emptyResponse);
			axios.delete.mockResolvedValue(emptyResponse);

			// Act & Assert для каждого метода
			const createResult = await UserService.createUser(mockUser, mockAuthToken);
			expect(createResult).toEqual({});

			const readResult = await UserService.readUser(mockAuthToken, 'test@example.com');
			expect(readResult).toEqual({});

			const updateResult = await UserService.updateUser(mockAuthToken, 'test@example.com', mockUser);
			expect(updateResult).toEqual({});

			const deleteResult = await UserService.deleteUser(mockAuthToken, mockUser);
			expect(deleteResult).toEqual({});

			const readAllResult = await UserService.readAllUsers(mockAuthToken);
			expect(readAllResult).toEqual({});

			const updatePasswordResult = await UserService.updateUserPassword(mockAuthToken, mockUser.email, mockPasswordData);
			expect(updatePasswordResult).toEqual({});
		});

		it('корректно обрабатывает ошибки с нестандартной структурой', async () => {
			// Arrange
			const malformedError = {
				response: {
					status: 400,
					data: 'Просто строка вместо объекта'
				}
			};
			axios.post.mockRejectedValue(malformedError);

			// Act & Assert
			await expect(UserService.createUser(mockUser, mockAuthToken))
				.rejects.toEqual(malformedError);
		});
	});
});