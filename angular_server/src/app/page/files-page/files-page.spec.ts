import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';
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
		// Service mocks
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

		const userServiceMock = {};

		const fileServiceMock = {
			loadDirectoryStatic: vi.fn().mockResolvedValue({
				success: true,
				data: { files: [], folders: [] }
			}),
			findStatic: vi.fn().mockResolvedValue({
				success: true,
				data: { totalResults: 0, files: [], folders: [] }
			}),
			existsStatic: vi.fn().mockResolvedValue({ success: true }),
			uploadStatic: vi.fn().mockResolvedValue({ success: true, data: {} }),
			createFolderStatic: vi.fn().mockResolvedValue({ success: true }),
			deleteItemStatic: vi.fn().mockResolvedValue({ success: true }),
			downloadFileStatic: vi.fn().mockResolvedValue({
				success: true,
				data: { blob: new Blob(), contentType: 'text/plain' }
			})
		};




		await TestBed.configureTestingModule({
			imports: [
				FilesPageComponent,
				RouterTestingModule.withRoutes([]) // For RouterLink correct work
			],
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