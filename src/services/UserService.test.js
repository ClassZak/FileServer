import axios from 'axios';
import UserService from './UserService';

// Mock axios
jest.mock('axios');

describe('UserService', () => {
	const mockAuthToken = 'Bearer mock-jwt-token';
	const mockUser = {
		surname: 'Doe',
		name: 'John',
		patronymic: 'Smith',
		email: 'john@example.com',
		password: 'password123'
	};
	
	const mockUserResponse = {
		id: 1,
		name: 'John',
		surname: 'Doe',
		patronymic: 'Smith',
		email: 'john@example.com',
		createdAt: '2024-01-15T10:30:00Z'
	};

	afterEach(() => {
		jest.clearAllMocks();
	});
	
	describe('newUser', () => {
		it('успешно создает пользователя и возвращает данные', async () => {
			// Arrange
			const mockResponse = {
				data: { success: true },
				status: 200
			};
			axios.post.mockResolvedValue(mockResponse);

			// Act
			const result = await UserService.newUser(mockUser, mockAuthToken);

			// Assert
			expect(axios.post).toHaveBeenCalledWith(
				'/api/users/new',
				mockUser,
				{
					headers: { Authorization: mockAuthToken }
				}
			);
			expect(result).toEqual({ success: true });
		});

		it('возвращает статус 403 при отсутствии прав администратора', async () => {
			// Arrange
			const errorResponse = {
				response: {
					status: 403,
					data: { error: 'You are not admin!' }
				}
			};
			axios.post.mockRejectedValue(errorResponse);

			// Act
			const result = await UserService.newUser(mockUser, mockAuthToken);

			// Assert
			expect(result).toBe(403);
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
			await expect(UserService.newUser(mockUser, mockAuthToken))
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
				`/api/user/${encodeURI(userEmail)}`,
				{
					headers: { Authorization: mockAuthToken }
				}
			);
			expect(result).toEqual({ user: mockUserResponse });
		});

		it('возвращает статус 403 при отсутствии прав администратора', async () => {
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
			expect(result).toBe(403);
		});

		it('возвращает статус 404 при отсутствии пользователя', async () => {
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
			expect(result).toBe(404);
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
				`/api/user/${encodeURI(emailWithSpecialChars)}`,
				expect.any(Object)
			);
		});
	});

	describe('updateUser', () => {
		it('успешно обновляет пользователя', async () => {
			// Arrange
			const mockResponse = {
				data: { success: true },
				status: 200
			};
			axios.get.mockResolvedValue(mockResponse);

			// Act
			const result = await UserService.updateUser(mockAuthToken, mockUser);

			// Assert
			expect(axios.get).toHaveBeenCalledWith(
				`/api/update/${encodeURI(mockUser.email)}`,
				{
					headers: { Authorization: mockAuthToken }
				}
			);
			expect(result).toEqual({ success: true });
		});

		it('возвращает статус 403 при отсутствии прав администратора', async () => {
			// Arrange
			const errorResponse = {
				response: {
					status: 403,
					data: { error: 'You are not admin!' }
				}
			};
			axios.get.mockRejectedValue(errorResponse);

			// Act
			const result = await UserService.updateUser(mockAuthToken, mockUser);

			// Assert
			expect(result).toBe(403);
		});

		it('возвращает статус 404 при отсутствии пользователя', async () => {
			// Arrange
			const errorResponse = {
				response: {
					status: 404,
					data: { error: 'User not found' }
				}
			};
			axios.get.mockRejectedValue(errorResponse);

			// Act
			const result = await UserService.updateUser(mockAuthToken, mockUser);

			// Assert
			expect(result).toBe(404);
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
			await expect(UserService.updateUser(mockAuthToken, mockUser))
				.rejects.toEqual(errorResponse);
		});
	});

	describe('deleteUser', () => {
		it('успешно удаляет пользователя', async () => {
			// Arrange
			const mockResponse = {
				data: { success: true },
				status: 200
			};
			axios.get.mockResolvedValue(mockResponse);

			// Act
			const result = await UserService.deleteUser(mockAuthToken, mockUser);

			// Assert
			expect(axios.get).toHaveBeenCalledWith(
				`/api/delete/${encodeURI(mockUser.email)}`,
				{
					headers: { Authorization: mockAuthToken }
				}
			);
			expect(result).toEqual({ success: true });
		});

		it('возвращает статус 403 при отсутствии прав администратора', async () => {
			// Arrange
			const errorResponse = {
				response: {
					status: 403,
					data: { error: 'You are not admin!' }
				}
			};
			axios.get.mockRejectedValue(errorResponse);

			// Act
			const result = await UserService.deleteUser(mockAuthToken, mockUser);

			// Assert
			expect(result).toBe(403);
		});

		it('возвращает статус 404 при отсутствии пользователя', async () => {
			// Arrange
			const errorResponse = {
				response: {
					status: 404,
					data: { error: 'User not found' }
				}
			};
			axios.get.mockRejectedValue(errorResponse);

			// Act
			const result = await UserService.deleteUser(mockAuthToken, mockUser);

			// Assert
			expect(result).toBe(404);
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
			await expect(UserService.deleteUser(mockAuthToken, mockUser))
				.rejects.toEqual(errorResponse);
		});
	});

	describe('Общие тесты', () => {
		it('корректно формирует заголовки с токеном авторизации', async () => {
			// Arrange
			const customToken = 'Bearer custom-token-123';
			const mockResponse = { data: { success: true } };
			
			// Для каждого метода
			axios.post.mockResolvedValue(mockResponse);
			axios.get.mockResolvedValue(mockResponse);

			// Act & Assert для каждого метода
			await UserService.newUser(mockUser, customToken);
			expect(axios.post).toHaveBeenCalledWith(
				expect.any(String),
				expect.any(Object),
				{ headers: { Authorization: customToken } }
			);

			await UserService.readUser(customToken, 'test@example.com');
			expect(axios.get).toHaveBeenCalledWith(
				expect.any(String),
				{ headers: { Authorization: customToken } }
			);
		});

		it('обрабатывает сетевые ошибки', async () => {
			// Arrange
			const networkError = new Error('Network Error');
			axios.post.mockRejectedValue(networkError);
			axios.get.mockRejectedValue(networkError);

			// Act & Assert для каждого метода
			await expect(UserService.newUser(mockUser, mockAuthToken))
				.rejects.toThrow('Network Error');
			
			await expect(UserService.readUser(mockAuthToken, 'test@example.com'))
				.rejects.toThrow('Network Error');
		});

		it('не обрабатывает ошибки без response объекта', async () => {
			// Arrange
			const errorWithoutResponse = new Error('Some error');
			axios.post.mockRejectedValue(errorWithoutResponse);

			// Act & Assert
			await expect(UserService.newUser(mockUser, mockAuthToken))
				.rejects.toThrow('Some error');
		});

		it('обрабатывает успешный ответ без данных', async () => {
			// Arrange
			const emptyResponse = {
				data: {},
				status: 200
			};
			axios.post.mockResolvedValue(emptyResponse);

			// Act
			const result = await UserService.newUser(mockUser, mockAuthToken);

			// Assert
			expect(result).toEqual({});
		});
	});
});