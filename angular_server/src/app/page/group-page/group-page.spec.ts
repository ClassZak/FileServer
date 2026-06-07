import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
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

		const authServiceMock = {
			checkAuth: vi.fn().mockResolvedValue({
				success: true,
				data: { authenticated: true, user: { email: 'test@test.com' } }
			})
		};
		const adminServiceMock = {
			isAdmin: vi.fn().mockResolvedValue({ success: true })
		};
		const groupServiceMock = {
			getGroupFullDetails: vi.fn().mockResolvedValue({
				success: true,
				data: { group: { name: 'test', membersCount: 1, head: {}, members: [] } }
			}),
			getGroupFullDetailsAdmin: vi.fn().mockResolvedValue({
				success: true,
				data: { group: { name: 'test', membersCount: 1, head: {}, members: [] } }
			}),
			addUserToGroup: vi.fn().mockResolvedValue({ success: true }),
			deleteGroup: vi.fn().mockResolvedValue({ success: true }),
			removeUserFromGroup: vi.fn().mockResolvedValue({ success: true }),
			updateGroup: vi.fn().mockResolvedValue({ success: true })
		};
		const userServiceMock = {
			readAllUsers: vi.fn().mockResolvedValue({ success: true, data: { users: [] } })
		};

		vi.spyOn(AuthService, 'getToken').mockReturnValue('fake-token');

		await TestBed.configureTestingModule({
			imports: [GroupPage, RouterTestingModule.withRoutes([])],
			providers: [
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