import { Component } from '@angular/core';
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
	error?: string;
	showPassword: boolean = false;
	formType: LoginFormType = LoginFormType.Email;

	constructor(private router: Router) {}

	async ngOnInit(): Promise<void> {
		setTimeout(async () => {
			await this.checkAuthentication();
		}, 1000);
	}

	async handleEmailLogin(e: Event) {
		e.preventDefault();
		console.log('Login attempt with:', this.email, this.password);
		
		try {
			const result = await AuthService.loginByEmail(this.email, this.password);
			if (result.success) {
				const authResult = await AuthService.checkAuth(); // Исправлена опечатка: checkAuth -> checkAuth
				if (authResult.authenticated) {
					this.router.navigate(['/account']);
				} else {
					this.error = 'Ошибка авторизации после входа';
				}
			} else {
				this.error = 'Неверный email или пароль';
			}
		} catch (error) {
			console.log('Login failed:', error);
			this.error = 'Произошла ошибка при входе';
		}
	}

	private async checkAuthentication(): Promise<void> {
		try {
			const authResult: CheckAuthResult = await AuthService.checkAuth();
			
			if (authResult.authenticated) {
				this.router.navigate(['/account']);
			} else {
				console.log('Аутентификация не пройдена:', authResult.message);
				
			}
		} catch (error) {
			this.router.navigate(['/account']);
		}
	}

	togglePasswordVisibility() {
		this.showPassword = !this.showPassword;
	}
}