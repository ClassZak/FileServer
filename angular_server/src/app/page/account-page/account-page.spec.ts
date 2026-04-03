import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AccountPage } from './account-page';
import { AuthService } from '../../core/service/auth-service';
import AdminService from '../../core/service/admin-service';
import { GroupService } from '../../core/service/group-service';
import { UserService } from '../../core/service/user-service';
import { RouterTestingModule } from '@angular/router/testing';
import { Router } from '@angular/router';

describe('AccountPage', () => {
	let component: AccountPage;
	let fixture: ComponentFixture<AccountPage>;
	let router: Router;

	beforeEach(async () => {
		TestBed.resetTestingModule();

		// Моки сервисов
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
		const groupServiceMock = {
			getAllGroupsStatic: vi.fn().mockResolvedValue({
				success: true,
				data: [{ name: 'g1', membersCount: 1, creatorEmail: 'c@test.com' }]
			}),
			createGroupStatic: vi.fn().mockResolvedValue({ success: true })
		};
		const userServiceMock = {
			readAllUsersStatic: vi.fn().mockResolvedValue({ success: true, data: { users: [] } })
		};

		await TestBed.configureTestingModule({
			imports: [
				AccountPage,
				RouterTestingModule.withRoutes([])	// Только RouterTestingModule
			],
			providers: [
				{ provide: AuthService, useValue: authServiceMock },
				{ provide: AdminService, useValue: adminServiceMock },
				{ provide: GroupService, useValue: groupServiceMock },
				{ provide: UserService, useValue: userServiceMock }
			]
		}).compileComponents();

		fixture = TestBed.createComponent(AccountPage);
		component = fixture.componentInstance;
		router = TestBed.inject(Router);

		// Перехватываем navigate, чтобы не было реального перехода
		vi.spyOn(router, 'navigate').mockResolvedValue(true);

		fixture.detectChanges();
		await fixture.whenStable();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});