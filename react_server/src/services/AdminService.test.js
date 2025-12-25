import axios from 'axios';
import AdminService from './AdminService';

// Мокаем axios
jest.mock('axios');

describe('AdminService.isAdmin', () => {
	const mockAuthToken = 'Bearer test.jwt.token';
	const mockHeaders = {
		headers: { Authorization: mockAuthToken }
	};

	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe('Успешные случаи', () => {
		it('должен вернуть true при статусе 200 и isAdmin: true', async () => {
			// Arrange
			const mockResponse = {
				status: 200,
				data: { isAdmin: true }
			};
			axios.get.mockResolvedValue(mockResponse);

			// Act
			const result = await AdminService.isAdmin(mockAuthToken);

			// Assert
			expect(axios.get).toHaveBeenCalledWith('/api/admin/is-admin', mockHeaders);
			expect(result).toEqual({ isAdmin: true });
		});

		it('должен вернуть false при статусе 404 и isAdmin: false', async () => {
			// Arrange
			const mockResponse = {
				status: 404,
				data: { isAdmin: false }
			};
			axios.get.mockResolvedValue(mockResponse);

			// Act
			const result = await AdminService.isAdmin(mockAuthToken);

			// Assert
			expect(axios.get).toHaveBeenCalledWith('/api/admin/is-admin', mockHeaders);
			expect(result).toEqual({ isAdmin: false });
		});
	});

	describe('Ошибки авторизации', () => {
		it('должен обработать 401 ошибку и вернуть false', async () => {
			// Arrange
			const errorResponse = {
				response: {
					status: 401,
					data: { isAdmin: false }
				}
			};
			axios.get.mockRejectedValue(errorResponse);

			// Act
			const result = await AdminService.isAdmin(mockAuthToken);

			// Assert
			expect(axios.get).toHaveBeenCalledWith('/api/admin/is-admin', mockHeaders);
			expect(result).toEqual({ isAdmin: false });
		});

		it('должен обработать случай когда токен не валиден (401 с сервера)', async () => {
			// Arrange
			const mockResponse = {
				status: 401,
				data: { isAdmin: false }
			};
			axios.get.mockResolvedValue(mockResponse);

			// Act
			const result = await AdminService.isAdmin(mockAuthToken);

			// Assert
			expect(axios.get).toHaveBeenCalledWith('/api/admin/is-admin', mockHeaders);
			expect(result).toEqual({ isAdmin: false });
		});
	});

	describe('Сетевые и другие ошибки', () => {
		it('должен пробросить исключение при других ошибках сети', async () => {
			// Arrange
			const networkError = new Error('Network Error');
			axios.get.mockRejectedValue(networkError);

			// Act & Assert
			await expect(AdminService.isAdmin(mockAuthToken)).rejects.toThrow('Network Error');
			expect(axios.get).toHaveBeenCalledWith('/api/admin/is-admin', mockHeaders);
		});

		it('должен пробросить исключение при 500 ошибке сервера', async () => {
			// Arrange
			const serverError = {
				response: {
					status: 500,
					data: { message: 'Internal Server Error' }
				}
			};
			axios.get.mockRejectedValue(serverError);

			// Act & Assert
			await expect(AdminService.isAdmin(mockAuthToken)).rejects.toEqual(serverError);
			expect(axios.get).toHaveBeenCalledWith('/api/admin/is-admin', mockHeaders);
		});
	});

	describe('Пограничные случаи', () => {
		it('должен корректно работать с пустым токеном', async () => {
			// Arrange
			const emptyToken = '';
			const mockResponse = {
				status: 401,
				data: { isAdmin: false }
			};
			axios.get.mockResolvedValue(mockResponse);

			// Act
			const result = await AdminService.isAdmin(emptyToken);

			// Assert
			expect(axios.get).toHaveBeenCalledWith(
				'/api/admin/is-admin',
				{ headers: { Authorization: '' } }
			);
			expect(result).toEqual({ isAdmin: false });
		});

		it('должен корректно работать с токеном без Bearer префикса', async () => {
			// Arrange
			const tokenWithoutBearer = 'raw.jwt.token';
			const mockResponse = {
				status: 200,
				data: { isAdmin: true }
			};
			axios.get.mockResolvedValue(mockResponse);

			// Act
			const result = await AdminService.isAdmin(tokenWithoutBearer);

			// Assert
			expect(axios.get).toHaveBeenCalledWith(
				'/api/admin/is-admin',
				{ headers: { Authorization: tokenWithoutBearer } }
			);
			expect(result).toEqual({ isAdmin: true });
		});
	});
});