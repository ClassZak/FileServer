import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AuthService } from '../../core/service/auth-service';
import AdminService from '../../core/service/admin-service';
import { UserService } from '../../core/service/user-service';
import { UsersPage } from './users-page';

// Mock static methds before component creating
vi.spyOn(AuthService, 'checkAuthStatic').mockResolvedValue({
	success: true,
	data: { authenticated: true, user: {
		email: 'admin@test.com',
		surname: 'Admin',
		name: 'Test',
		patronymic: 'A.'
	} }
});
vi.spyOn(AuthService, 'getToken').mockReturnValue('fake-token');
vi.spyOn(AdminService, 'isAdminStatic').mockResolvedValue({ success: true });
vi.spyOn(UserService, 'readAllUsersStatic').mockResolvedValue({
	success: true,
	data: { users: [] }
});

describe('UsersPage', () => {
	let component: UsersPage;
	let fixture: ComponentFixture<UsersPage>;

	beforeEach(async () => {
		TestBed.resetTestingModule();
		await TestBed.configureTestingModule({
			imports: [UsersPage],
			providers: [provideRouter([])] // Empty routes for stop routing
		}).compileComponents();

		fixture = TestBed.createComponent(UsersPage);
		component = fixture.componentInstance;
		fixture.detectChanges();
		await fixture.whenStable();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});