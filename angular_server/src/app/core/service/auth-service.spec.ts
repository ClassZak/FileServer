import { TestBed } from '@angular/core/testing';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { AuthService } from './auth-service';

describe('AuthService (instance)', () => {
	let service: AuthService;
	let httpMock: HttpTestingController;

	beforeEach(() => {
		TestBed.resetTestingModule();
		TestBed.configureTestingModule({
			providers: [
				AuthService,
				provideHttpClient(),
				provideHttpClientTesting()
			]
		});
		service = TestBed.inject(AuthService);
		httpMock = TestBed.inject(HttpTestingController);
		localStorage.clear();
	});

	afterEach(() => {
		httpMock.verify();
	});

	describe('tryRefreshToken', () => {
		it('should refresh token successfully', async () => {
			localStorage.setItem('refreshToken', 'valid-refresh');
			const mockRefreshResponse = {
				token: 'new-token',
				refreshToken: 'new-refresh',
				user: { email: 'test@test.com', surname: 'Test', name: 'User', patronymic: 'U.' }
			};
			const mockUserResponse = { valid: true, user: { email: 'test@test.com' } };

			const resultPromise = service.tryRefreshToken();

			// 1-й запрос: refresh
			const refreshReq = httpMock.expectOne('/api/auth/refresh');
			expect(refreshReq.request.method).toBe('POST');
			expect(refreshReq.request.body).toEqual({ refreshToken: 'valid-refresh' });
			refreshReq.flush(mockRefreshResponse);

			// Даём время на отправку второго запроса
			await new Promise(resolve => setTimeout(resolve, 0));

			// 2-й запрос: verify
			const verifyReq = httpMock.expectOne('/api/auth/verify');
			expect(verifyReq.request.method).toBe('GET');
			verifyReq.flush(mockUserResponse);

			const result = await resultPromise;
			expect(result.success).toBe(true);
			expect(result.data?.authenticated).toBe(true);
			expect(localStorage.getItem('token')).toBe('new-token');
			expect(localStorage.getItem('refreshToken')).toBe('new-refresh');
		});

		it('should handle missing refresh token', async () => {
			localStorage.removeItem('refreshToken');
			const result = await service.tryRefreshToken();
			expect(result.success).toBe(false);
			expect(result.error).toBe('Refresh token отсутствует');
			httpMock.expectNone('/api/auth/refresh');
			httpMock.expectNone('/api/auth/verify');
		});

		it('should handle failed refresh request', async () => {
			localStorage.setItem('refreshToken', 'invalid-refresh');
			const resultPromise = service.tryRefreshToken();
			const refreshReq = httpMock.expectOne('/api/auth/refresh');
			refreshReq.flush({ error: 'Invalid token' }, { status: 400, statusText: 'Bad Request' });
			const result = await resultPromise;
			expect(result.success).toBe(false);
			expect(result.error).toBe('Требуется повторный вход');
			expect(localStorage.getItem('token')).toBeNull();
			expect(localStorage.getItem('refreshToken')).toBeNull();
		});
	});
});