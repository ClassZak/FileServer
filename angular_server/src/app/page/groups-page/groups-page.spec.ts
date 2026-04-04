import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { GroupsPage } from './groups-page';
import { AuthService } from '../../core/service/auth-service';
import AdminService from '../../core/service/admin-service';
import { GroupService } from '../../core/service/group-service';
import { UserService } from '../../core/service/user-service';

describe('GroupsPage', () => {
	let component: GroupsPage;
	let fixture: ComponentFixture<GroupsPage>;

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
		const groupServiceMock = {
			getAllGroups: vi.fn().mockResolvedValue({
				success: true,
				data: [{ name: 'g1', membersCount: 1, creatorEmail: 'c@test.com' }]
			}),
			createGroup: vi.fn().mockResolvedValue({ success: true })
		};
		const userServiceMock = {
			readAllUsers: vi.fn().mockResolvedValue({ success: true, data: { users: [] } })
		};

		vi.spyOn(AuthService, 'getToken').mockReturnValue('fake-token');

		await TestBed.configureTestingModule({
			imports: [GroupsPage, RouterTestingModule.withRoutes([])],
			providers: [
				{ provide: AuthService, useValue: authServiceMock },
				{ provide: AdminService, useValue: adminServiceMock },
				{ provide: GroupService, useValue: groupServiceMock },
				{ provide: UserService, useValue: userServiceMock }
			]
		}).compileComponents();

		fixture = TestBed.createComponent(GroupsPage);
		component = fixture.componentInstance;
		fixture.detectChanges();
		await fixture.whenStable();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});