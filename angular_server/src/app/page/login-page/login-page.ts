import { ChangeDetectorRef, Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AppHeader } from "../../app-header/app-header";
import { AppFooter } from '../../app-footer/app-footer';
import { AuthService, CheckAuthResult } from '../../core/service/auth-service';
import { DefaultServiceResult, DefaultServiceResultWithData } from '../../core/model/default-server-result';


import { NoticeService } from '../../core/view-core/service/notice-service';
import { Notification, NotificationType } from '../../core/view-core/model/notification';


enum LoginFormType {
	Email,
	SNP
}

@Component({
	selector: 'app-login-page',
	imports: [AppHeader, AppFooter, FormsModule], // Add FormsModule
	templateUrl: './login-page.html',
	styleUrl: './login-page.css',
})
export class LoginPage {
	email: string = '';
	password: string = '';
	surname: string = '';
	name: string = '';
	patronymic: string = '';
	error?: string;
	showPassword: boolean = false;
	LoginFormType = LoginFormType;
	formType: LoginFormType = LoginFormType.Email;
	isSubmiting: boolean = false;

	constructor(
		private router: Router,
		private cdr: ChangeDetectorRef,
		private authService: AuthService,


		private noticeService: NoticeService
	) {}

	async ngOnInit(): Promise<void> {
		this.checkAuthentication();
	}

	async handleEmailLogin(e: Event) {
		e.preventDefault();
		this.isSubmiting = true;
		
		try {
			const result = await this.authService.loginByEmail(this.email, this.password);
			if (result.success) {
				const authResult = await this.authService.checkAuth();
				if (!authResult.success)
					throw new Error(authResult.error ?? 'Ошибка авторизации после входа');
				
				if (authResult.data?.authenticated) {
					this.noticeService.addNotification(new Notification(NotificationType.Success, 'Вы успешно авторизировались'));
					this.router.navigate(['/account']);
					return;
				} else
					throw new Error('Ошибка авторизации после входа');
			} else {
				const errorMessage = result.error ?? 'Неверный email или пароль';
				this.noticeService.addNotification(new Notification(NotificationType.Error, errorMessage));

				throw new Error(errorMessage);
			}
		} catch (error) {
			console.error('Login failed:', error);
			this.error = 'Произошла ошибка при входе';
			this.noticeService.addNotification(new Notification(NotificationType.Error, this.error));
		} finally {
			this.isSubmiting = false;
		}
		this.cdr.detectChanges();
	}
	async handleSNPLogin(e: Event) {
		this.isSubmiting = true;
		e.preventDefault();
		
		try {
			const result = await this.authService.loginBySnp(
				this.surname, this.name, this.patronymic, this.password
			);
			if (result.success) {
				const authResult = await this.authService.checkAuth();
				if (!authResult.success)
					throw new Error(authResult.error ?? 'Ошибка авторизации после входа');
				else
				if (authResult.data?.authenticated) {
					this.noticeService.addNotification(new Notification(NotificationType.Success, 'Вы успешно авторизировались'));
					this.router.navigate(['/account']);
					return;
				} else
					throw new Error('Ошибка авторизации после входа');
			} else
				throw new Error(result.error);
		} catch (error) {
			console.log('Авторизация не удалась:', error);
			this.error = 'Произошла ошибка при входе';
			this.noticeService.addNotification(new Notification(NotificationType.Error, `Авторизация не удалась: ${error}`));
		} finally {
			this.isSubmiting = false;
		}
		this.cdr.detectChanges();
	}

	private async checkAuthentication(): Promise<void> {
		try {
			const authResult: DefaultServiceResultWithData<CheckAuthResult> = await this.authService.checkAuth();
			
			if (!authResult.success || !authResult.data?.authenticated)
				throw new Error(`Аутентификация не пройдена:${authResult.error}`);
			else {
				this.router.navigate(['/account']);
				return;
			}
		} catch (error) {
			console.error(error);
			return;
		}
	}

	togglePasswordVisibility() {
		this.showPassword = !this.showPassword;
	}
}