import { ChangeDetectorRef, Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AppHeader } from "../../app-header/app-header";
import { AppFooter } from '../../app-footer/app-footer';
import { AuthService, CheckAuthResult } from '../../core/service/auth-service';
import { DefaultServiceResult, DefaultServiceResultWithData } from '../../core/model/default-server-result';

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
		private cdr: ChangeDetectorRef
	) {}

	async ngOnInit(): Promise<void> {
		this.checkAuthentication();
	}

	async handleEmailLogin(e: Event) {
		e.preventDefault();
		this.isSubmiting = true;
		
		try {
			const result = await AuthService.loginByEmailStatic(this.email, this.password);
			if (result.success) {
				const authResult = await AuthService.checkAuthStatic();
				if (!authResult.success)
					this.error = authResult.error;
				else
				{
					if (authResult.data?.authenticated) {
						this.router.navigate(['/account']);
						return;
					} else
						this.error = 'Ошибка авторизации после входа';
				}
			} else {
				if (result.error)
					this.error = result.error;
				else
					this.error = 'Неверный email или пароль';
			}
		} catch (error) {
			console.error('Login failed:', error);
			this.error = 'Произошла ошибка при входе';
			// TODO: notice
		} finally {
			this.isSubmiting = false;
		}
		this.cdr.detectChanges();
	}
	async handleSNPLogin(e: Event) {
		this.isSubmiting = true;
		e.preventDefault();
		
		try {
			const result = await AuthService.loginBySnpStatic(
				this.surname, this.name, this.patronymic, this.password
			);
			if (result.success) {
				const authResult = await AuthService.checkAuthStatic();
				if (!authResult.success)
					this.error = 'Ошибка авторизации после входа';
				else
				if (authResult.data?.authenticated) {
					this.router.navigate(['/account']);
					return;
				} else {
					this.error = 'Ошибка авторизации после входа';
				}
			} else {
				this.error = result.error;
			}
		} catch (error) {
			console.log('Авторизация не удалась:', error);
			this.error = 'Произошла ошибка при входе';
		} finally {
			this.isSubmiting = false;
		}
		this.cdr.detectChanges();
	}

	private async checkAuthentication(): Promise<void> {
		try {
			const authResult: DefaultServiceResultWithData<CheckAuthResult> = await AuthService.checkAuthStatic();
			
			if (!authResult.success || !authResult.data?.authenticated)
				throw new Error(`Аутентификация не пройдена:${authResult.error}`);
			else {
				this.router.navigate(['/account']);
				return;
			}
		} catch (error) {
			console.error(error);
			return;
			// TODO: notice
		}
	}

	togglePasswordVisibility() {
		this.showPassword = !this.showPassword;
	}
}