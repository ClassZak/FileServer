import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { UsersPage } from './users-page';
import { AuthService } from '../../core/service/auth-service';
import AdminService from '../../core/service/admin-service';
import { UserService } from '../../core/service/user-service';

describe('UsersPage', () => {
  let component: UsersPage;
  let fixture: ComponentFixture<UsersPage>;

  beforeEach(async () => {
    TestBed.resetTestingModule();

    // Моки для инжектируемых сервисов
    const authServiceMock = {
      checkAuth: vi.fn().mockResolvedValue({
        success: true,
        data: { authenticated: true, user: { email: 'admin@test.com' } }
      })
    };
    const adminServiceMock = {
      isAdmin: vi.fn().mockResolvedValue({ success: true })
    };
    const userServiceMock = {
      readAllUsers: vi.fn().mockResolvedValue({ success: true, data: { users: [] } })
    };

    // Статические моки (если компонент их использует)
    vi.spyOn(AuthService, 'getToken').mockReturnValue('fake-token');

    await TestBed.configureTestingModule({
      imports: [UsersPage, RouterTestingModule.withRoutes([])],
      providers: [
        { provide: AuthService, useValue: authServiceMock },
        { provide: AdminService, useValue: adminServiceMock },
        { provide: UserService, useValue: userServiceMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(UsersPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});