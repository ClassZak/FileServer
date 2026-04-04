import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RemoveUserFromGroupModalComponent } from './remove-user-from-group-modal';
import { User } from '../../../../core/model/user';

describe('RemoveUserFromGroupModalComponent', () => {
	let component: RemoveUserFromGroupModalComponent;
	let fixture: ComponentFixture<RemoveUserFromGroupModalComponent>;

	beforeEach(async () => {
		TestBed.resetTestingModule();
		await TestBed.configureTestingModule({
			imports: [RemoveUserFromGroupModalComponent]
		})
		.compileComponents();

		fixture = TestBed.createComponent(RemoveUserFromGroupModalComponent);
		component = fixture.componentInstance;
		component.user = new User('Trycia', 'Hermiston', 'Florence', 'Trycia@gmail.com');
		await fixture.whenStable();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
