import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PermissionsPage } from './permissions-page';

describe('PermissionsPage', () => {
  let component: PermissionsPage;
  let fixture: ComponentFixture<PermissionsPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PermissionsPage]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PermissionsPage);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
