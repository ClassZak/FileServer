import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UpdateGroupModalComponent } from './update-group-modal';
import { GroupDetails } from '../../../../core/model/group-details';
import { UserAdminModel } from '../../../../core/model/user-admin-model';

describe('UpdateGroupModalComponent', () => {
	let component: UpdateGroupModalComponent;
	let fixture: ComponentFixture<UpdateGroupModalComponent>;

	beforeEach(async () => {
		TestBed.resetTestingModule();
		await TestBed.configureTestingModule({
			imports: [UpdateGroupModalComponent]
		})
		.compileComponents();

		fixture = TestBed.createComponent(UpdateGroupModalComponent);
		component = fixture.componentInstance;
		component.currentGroup = new GroupDetails<UserAdminModel>('shxz', 455, new UserAdminModel('Torrance', 'Stanton', 'Delton', 'sus@mail.ru', new Date()), []);
		await fixture.whenStable();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
