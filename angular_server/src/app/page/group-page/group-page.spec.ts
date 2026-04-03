import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { GroupPage } from './group-page';
import { AuthService } from '../../core/service/auth-service';
import AdminService from '../../core/service/admin-service';
import { GroupService } from '../../core/service/group-service';
import { UserService } from '../../core/service/user-service';

describe('GroupPage', () => {
	let component: GroupPage;
	let fixture: ComponentFixture<GroupPage>;

	beforeEach(async () => {
		TestBed.resetTestingModule();
		// Services mocks
		const authServiceMock = {
			checkAuthStatic: vi.fn().mockResolvedValue({
				success: true,
				data: { authenticated: true, user: { email: 'test@test.com' } }
			}),
			getToken: vi.fn().mockReturnValue('fake-token'),
			logout: vi.fn()
		};

		const adminServiceMock = {
			isAdminStatic: vi.fn().mockResolvedValue({ success: true })
		};

		const groupServiceMock = {
			getGroupFullDetailsStatic: vi.fn().mockResolvedValue({
				success: true,
				data: { group: { name: 'test', membersCount: 1, creator: {}, members: [] } }
			}),
			getGroupFullDetailsAdminStatic: vi.fn().mockResolvedValue({
				success: true,
				data: { group: { name: 'test', membersCount: 1, creator: {}, members: [] } }
			}),
			addUserToGroupStatic: vi.fn().mockResolvedValue({ success: true }),
			deleteGroupStatic: vi.fn().mockResolvedValue({ success: true }),
			removeUserFromGroupStatic: vi.fn().mockResolvedValue({ success: true }),
			updateGroupStatic: vi.fn().mockResolvedValue({ success: true })
		};

		const userServiceMock = {
			readAllUsersStatic: vi.fn().mockResolvedValue({ success: true, data: { users: [] } })
		};



		
		await TestBed.configureTestingModule({
			imports: [GroupPage],
			providers: [
				provideRouter([]), // Init router without real routes
				{ provide: AuthService, useValue: authServiceMock },
				{ provide: AdminService, useValue: adminServiceMock },
				{ provide: GroupService, useValue: groupServiceMock },
				{ provide: UserService, useValue: userServiceMock }
			]
		}).compileComponents();

		fixture = TestBed.createComponent(GroupPage);
		component = fixture.componentInstance;
		fixture.detectChanges();
		await fixture.whenStable();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});