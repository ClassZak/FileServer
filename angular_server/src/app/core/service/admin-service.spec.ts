import { TestBed } from '@angular/core/testing';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { AdminService } from './admin-service';

describe('AdminService (instance)', () => {
	let service: AdminService;
	let httpMock: HttpTestingController;

	beforeEach(() => {
		TestBed.resetTestingModule();
		TestBed.configureTestingModule({
			providers: [
				AdminService,
				provideHttpClient(),
				provideHttpClientTesting()
			]
		});
		service = TestBed.inject(AdminService);
		httpMock = TestBed.inject(HttpTestingController);
	});

	afterEach(() => {
		httpMock.verify();
	});

	it('should return success true when user is admin', async () => {
		const token = 'fake-token';

		const resultPromise = service.isAdmin(token);

		const req = httpMock.expectOne('/api/admin/is-admin');
		expect(req.request.method).toBe('GET');
		expect(req.request.headers.get('Authorization')).toBe(`Bearer ${token}`);
		req.flush({ isAdmin: true });

		const result = await resultPromise;
		expect(result.success).toBe(true);
	});

	it('should return success true and isAdmin false when user is not admin', async () => {
		const token = 'fake-token';

		const resultPromise = service.isAdmin(token);

		const req = httpMock.expectOne('/api/admin/is-admin');
		req.flush({ isAdmin: false });

		const result = await resultPromise;
		expect(result.success).toBe(true);
		expect(result.data?.isAdmin).toBe(false);
	});

	it('should handle error and return failure', async () => {
		const token = 'fake-token';

		const resultPromise = service.isAdmin(token);

		const req = httpMock.expectOne('/api/admin/is-admin');
		req.flush({ error: 'Forbidden' }, { status: 403, statusText: 'Forbidden' });

		const result = await resultPromise;
		expect(result.success).toBe(false);
		expect(result.error).toBeDefined();
	});
});