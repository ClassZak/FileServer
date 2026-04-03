import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
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
		// Services mocks
		const authServiceMock = {
			checkAuthStatic: vi.fn().mockResolvedValue({
				success: true,
				data: {
					authenticated: true,
					user: { email: 'admin@test.com' }
				}
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
			imports: [GroupsPage],
			providers: [
				provideRouter([]),
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