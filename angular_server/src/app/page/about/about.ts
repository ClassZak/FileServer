import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { AppFooter } from '../../app-footer/app-footer'
import { AppHeader } from "../../app-header/app-header";
import { RouterLink } from "@angular/router";
import { AuthService, CheckAuthResult } from '../../core/service/auth-service';
import AdminService from '../../core/service/admin-service';
import { DefaultServiceResultWithData } from '../../core/model/default-server-result';
import { Title } from '@angular/platform-browser';

@Component({
	
	selector: 'app-about',
	imports: [AppFooter, AppHeader, RouterLink],
	templateUrl: './about.html',
	styleUrl: './about.css',
})
export class About {
	// Title
	private titleService = inject(Title);
	
	isAdmin: boolean = false;

	constructor(
		private cdr: ChangeDetectorRef,
		private authService: AuthService,
		private adminService: AdminService
	) {}

	
	async ngOnInit(): Promise<void> {
		this.checkAuthentication();
		this.titleService.setTitle('О проекте');
	}


	private async checkAuthentication(): Promise<void> {
		try {
			const authResult: DefaultServiceResultWithData<CheckAuthResult> = await this.authService.checkAuth();
			
			if (!authResult.success || !authResult.data?.authenticated)
				throw new Error(`Аутентификация не пройдена:${authResult.error}`);
			else
				this.checkAdminStatus();
		} catch (error) {
			console.error(error);
		}
	}

	private async checkAdminStatus(): Promise<void> {
		try {
			const token = AuthService.getToken();
			if (!token) throw new Error('Нет токена авторизации');
			const result = await this.adminService.isAdmin(token);
			if (result.success) {
				this.isAdmin = result.data!.isAdmin;
				this.cdr.detectChanges();
			} else {
				throw new Error(result.error || 'Не удалось проверить права администратора');
			}
		} catch (error) {
			const message = `Ошибка проверки прав администратора: ${(error as Error).message}`;
			console.error(message);
		}
	}
}
