import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { FilesPageComponent } from './files-page';
import { AuthService } from '../../core/service/auth-service';
import AdminService from '../../core/service/admin-service';
import { UserService } from '../../core/service/user-service';
import { FileService } from '../../core/service/file-service';

describe('FilesPage', () => {
	let component: FilesPageComponent;
	let fixture: ComponentFixture<FilesPageComponent>;

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
		const userServiceMock = {};
		const fileServiceMock = {
			loadDirectory: vi.fn().mockResolvedValue({ success: true, data: { files: [], folders: [] } }),
			find: vi.fn().mockResolvedValue({ success: true, data: { totalResults: 0, files: [], folders: [] } }),
			exists: vi.fn().mockResolvedValue({ success: true }),
			upload: vi.fn().mockResolvedValue({ success: true, data: {} }),
			createFolder: vi.fn().mockResolvedValue({ success: true }),
			deleteItem: vi.fn().mockResolvedValue({ success: true }),
			downloadFile: vi.fn().mockResolvedValue({ success: true, data: { blob: new Blob(), contentType: 'text/plain' } })
		};

		vi.spyOn(AuthService, 'getToken').mockReturnValue('fake-token');

		await TestBed.configureTestingModule({
			imports: [FilesPageComponent, RouterTestingModule.withRoutes([])],
			providers: [
				{ provide: AuthService, useValue: authServiceMock },
				{ provide: AdminService, useValue: adminServiceMock },
				{ provide: UserService, useValue: userServiceMock },
				{ provide: FileService, useValue: fileServiceMock }
			]
		}).compileComponents();

		fixture = TestBed.createComponent(FilesPageComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
		await fixture.whenStable();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});