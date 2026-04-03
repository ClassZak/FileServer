import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
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
			checkAuthStatic: vi.fn().mockResolvedValue({
				success: true,
				data: { authenticated: true, user: { email: 'admin@test.com' } }
			}),
			getToken: vi.fn().mockReturnValue('fake-token'),
			logout: vi.fn()
		};

		const adminServiceMock = {
			isAdminStatic: vi.fn().mockResolvedValue({ success: true })
		};

		const userServiceMock = {
			readUserStatic: vi.fn().mockResolvedValue({
				success: true,
				data: { user: { email: 'user@test.com', surname: 'Test', name: 'User', patronymic: 'U.', createdAt: new Date() } }
			}),
			updateUserStatic: vi.fn().mockResolvedValue({ success: true }),
			updateUserPasswordStatic: vi.fn().mockResolvedValue({ success: true }),
			deleteUserStatic: vi.fn().mockResolvedValue({ success: true })
		};




		
		await TestBed.configureTestingModule({
			imports: [UserPage],
			providers: [
				provideRouter([]),
				{ provide: AuthService, useValue: authServiceMock },
				{ provide: AdminService, useValue: adminServiceMock },
				{ provide: UserService, useValue: userServiceMock }
			]
		}).compileComponents();

		fixture = TestBed.createComponent(UserPage);
		component = fixture.componentInstance;

		// Set up email, cause route params since the route parameters are not available
		(component as any).userEmail = 'user@test.com';

		fixture.detectChanges();
		await fixture.whenStable();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});