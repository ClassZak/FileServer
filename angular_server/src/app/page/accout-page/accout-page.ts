import { Component, OnInit } from '@angular/core';
import { AppFooter } from '../../app-footer/app-footer'
import { AppHeader } from "../../app-header/app-header";
import { LoadingSpinner } from "../../component/loading-spinner/loading-spinner";
import { Router } from '@angular/router';
import { CheckAuthResult, LoginResult } from '../../core/service/auth-service';
import { User } from '../../core/model/user';
import { AuthService } from '../../core/service/auth-service';


@Component({
	selector: 'app-accout-page',
	imports: [AppFooter, AppHeader, LoadingSpinner],
	templateUrl: './accout-page.html',
	styleUrl: './accout-page.css',
})
export class AccoutPage implements OnInit {
	
	isLoading: boolean = true;
	isAuthenticated: boolean = false;

	constructor(private router: Router) {}

	async ngOnInit(): Promise<void> {
		setTimeout(async () => {
			await this.checkAuthentication();
		}, 1000);
	}

	private async checkAuthentication(): Promise<void> {
		try {
			const authResult: CheckAuthResult = await AuthService.checkAuth();
			
			if (authResult.authenticated) {
				console.log('Аутентификация прошла успешно');
				this.isAuthenticated = true;
				// TODO: add account data component loading
			} else {
				console.log('Аутентификация не пройдена:', authResult.message);
				this.router.navigate(['/login']);
			}
		} catch (error) {
			console.error('Ошибка при проверке аутентификации:', error);
			this.router.navigate(['/login']);
		} finally {
			this.isLoading = false;
		}
	}
}
