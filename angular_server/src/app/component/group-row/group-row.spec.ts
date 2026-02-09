import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GroupRow } from './group-row';

describe('GroupRow', () => {
  let component: GroupRow;
  let fixture: ComponentFixture<GroupRow>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GroupRow]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GroupRow);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
