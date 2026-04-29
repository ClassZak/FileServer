import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HistoryPage } from './history-page';
import AdminService from '../../core/service/admin-service';
import { AuthService } from '../../core/service/auth-service';
import { UserService } from '../../core/service/user-service';
import { FileService } from '../../core/service/file-service';

describe('HistoryPage', () => {
	let component: HistoryPage;
	let fixture: ComponentFixture<HistoryPage>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [HistoryPage],
			providers: [
				{ provide: AuthService, useValue: authServiceMock },
				{ provide: AdminService, useValue: adminServiceMock },
				{ provide: UserService, useValue: userServiceMock },
				{ provide: FileService, useValue: fileServiceMock }
			]
		})
		.compileComponents();

		fixture = TestBed.createComponent(HistoryPage);
		component = fixture.componentInstance;
		await fixture.whenStable();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
