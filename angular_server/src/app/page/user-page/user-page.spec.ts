import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { UserPage } from './user-page';
import { AuthService } from '../../core/service/auth-service';
import AdminService from '../../core/service/admin-service';
import { UserService } from '../../core/service/user-service';

describe('UserPage', () => {
	let component: UserPage;
	let fixture: ComponentFixture<UserPage>;

	beforeEach(async () => {
		TestBed.resetTestingModule();

		const authServiceMock = {
			checkAuth: vi.fn().mockResolvedValue({
				success: true,
				data: { authenticated: true, user: { email: 'admin@test.com' } }
			})
		};
		const adminServiceMock = {
			isAdmin: vi.fn().mockResolvedValue({ success: true })
		};
		const userServiceMock = {
			readUser: vi.fn().mockResolvedValue({
				success: true,
				data: { user: { email: 'user@test.com', surname: 'Test', name: 'User', patronymic: 'U.', createdAt: new Date() } }
			}),
			updateUser: vi.fn().mockResolvedValue({ success: true }),
			updateUserPassword: vi.fn().mockResolvedValue({ success: true }),
			deleteUser: vi.fn().mockResolvedValue({ success: true })
		};

		vi.spyOn(AuthService, 'getToken').mockReturnValue('fake-token');

		await TestBed.configureTestingModule({
			imports: [UserPage, RouterTestingModule.withRoutes([])],
			providers: [
				{ provide: AuthService, useValue: authServiceMock },
				{ provide: AdminService, useValue: adminServiceMock },
				{ provide: UserService, useValue: userServiceMock }
			]
		}).compileComponents();

		fixture = TestBed.createComponent(UserPage);
		component = fixture.componentInstance;
		// Устанавливаем email, так как параметры маршрута не доступны
		(component as any).userEmail = 'user@test.com';
		fixture.detectChanges();
		await fixture.whenStable();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});