import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RedirectionButton } from './redirection-button';

describe('RedirectionButton', () => {
  let component: RedirectionButton;
  let fixture: ComponentFixture<RedirectionButton>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RedirectionButton]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RedirectionButton);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
