import { TestBed } from '@angular/core/testing';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { UserService } from './user-service';
import { CreateUserModel } from '../model/create-user-model';
import { User } from '../model/user';

describe('UserService (instance)', () => {
	let service: UserService;
	let httpMock: HttpTestingController;

	beforeEach(() => {
		TestBed.resetTestingModule();
		TestBed.configureTestingModule({
			providers: [
				UserService,
				provideHttpClient(),
				provideHttpClientTesting()
			]
		});
		service = TestBed.inject(UserService);
		httpMock = TestBed.inject(HttpTestingController);
	});

	afterEach(() => {
		httpMock.verify();
	});

	it('should create a user', async () => {
		const userData = new CreateUserModel('Doe', 'John', 'James', 'john@test.com', 'password');
		const token = 'fake-token';

		const resultPromise = service.createUser(userData, token);

		const req = httpMock.expectOne('/api/users/new');
		expect(req.request.method).toBe('POST');
		expect(req.request.headers.get('Authorization')).toBe(`Bearer ${token}`);
		expect(req.request.body).toEqual(userData);
		req.flush({ success: true });

		const result = await resultPromise;
		expect(result.success).toBe(true);
	});

	it('should read a user by email', async () => {
		const token = 'fake-token';
		const email = 'john@test.com';
		const mockUser = {
			surname: 'Doe',
			name: 'John',
			patronymic: 'James',
			email: email,
			createdAt: '2025-01-01T00:00:00'
		};

		const resultPromise = service.readUser(token, email);

		const req = httpMock.expectOne(`/api/users/user/${encodeURIComponent(email)}`);
		expect(req.request.method).toBe('GET');
		expect(req.request.headers.get('Authorization')).toBe(`Bearer ${token}`);
		req.flush({ user: mockUser });

		const result = await resultPromise;
		expect(result.success).toBe(true);
		expect(result.data?.user?.email).toBe(email);
	});

	it('should update a user', async () => {
		const token = 'fake-token';
		const email = 'john@test.com';
		const update: User = { surname: 'Smith', name: 'John', patronymic: 'James', email };

		const resultPromise = service.updateUser(token, email, update);

		const req = httpMock.expectOne(`/api/users/update/${encodeURIComponent(email)}`);
		expect(req.request.method).toBe('PUT');
		expect(req.request.body).toEqual(update);
		req.flush({});

		const result = await resultPromise;
		expect(result.success).toBe(true);
	});

	it('should delete a user', async () => {
		const token = 'fake-token';
		const user = new User('Doe', 'John', 'James', 'john@test.com');

		const resultPromise = service.deleteUser(token, user);

		const req = httpMock.expectOne(`/api/users/delete/${encodeURIComponent(user.email)}`);
		expect(req.request.method).toBe('DELETE');
		req.flush({ success: true });

		const result = await resultPromise;
		expect(result.success).toBe(true);
	});

	it('should read all users', async () => {
		const token = 'fake-token';
		const mockUsers = [{ surname: 'Doe', name: 'John', patronymic: 'James', email: 'john@test.com', createdAt: '2025-01-01' }];

		const resultPromise = service.readAllUsers(token);

		const req = httpMock.expectOne('/api/users/users');
		expect(req.request.method).toBe('GET');
		req.flush({ users: mockUsers });

		const result = await resultPromise;
		expect(result.success).toBe(true);
		expect(result.data?.users?.length).toBe(1);
	});

	it('should update user password', async () => {
		const token = 'fake-token';
		const email = 'john@test.com';
		const passwordData = { oldPassword: 'old', newPassword: 'new' };

		const resultPromise = service.updateUserPassword(token, email, passwordData);

		const req = httpMock.expectOne(`/api/users/update-password/${encodeURIComponent(email)}`);
		expect(req.request.method).toBe('PUT');
		expect(req.request.body).toEqual(passwordData);
		req.flush({ success: true });

		const result = await resultPromise;
		expect(result.success).toBe(true);
	});
});