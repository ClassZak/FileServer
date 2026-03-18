import { ChangeDetectorRef, Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AppHeader } from "../../app-header/app-header";
import { AppFooter } from '../../app-footer/app-footer';
import { AuthService, CheckAuthResult } from '../../core/service/auth-service';

enum LoginFormType {
	Email,
	SNP
}

@Component({
	selector: 'app-login-page',
	imports: [AppHeader, AppFooter, FormsModule], // Добавлен FormsModule
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
			const result = await AuthService.loginByEmail(this.email, this.password);
			if (result.success) {
				const authResult = await AuthService.checkAuth();
				if (authResult.authenticated) {
					this.router.navigate(['/account']);
					return;
				} else {
					this.error = 'Ошибка авторизации после входа';
				}
			} else {
				if (result.message)
					this.error = result.message;
				else
					this.error = 'Неверный email или пароль';
			}
		} catch (error) {
			console.error('Login failed:', error);
			this.error = 'Произошла ошибка при входе';
		} finally {
			this.isSubmiting = false;
		}
		this.cdr.detectChanges();
	}
	async handleSNPLogin(e: Event) {
		this.isSubmiting = true;
		e.preventDefault();
		
		try {
			const result = await AuthService.loginBySnp(
				this.surname, this.name, this.patronymic, this.password
			);
			if (result.success) {
				const authResult = await AuthService.checkAuth();
				if (authResult.authenticated) {
					this.router.navigate(['/account']);
					return;
				} else {
					this.error = 'Ошибка авторизации после входа';
				}
			} else {
				this.error = 'Неверные учётные данные или пароль';
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
			const authResult: CheckAuthResult = await AuthService.checkAuth();
			
			if (authResult.authenticated) {
				this.router.navigate(['/account']);
				return;
			} else {
				console.log('Аутентификация не пройдена:', authResult.message);
				
			}
		} catch (error) {
			this.router.navigate(['/account']);
			return;
		}
	}

	togglePasswordVisibility() {
		this.showPassword = !this.showPassword;
	}
}