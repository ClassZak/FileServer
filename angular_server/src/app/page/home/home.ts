import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { AppFooter } from '../../app-footer/app-footer'
import { AppHeader } from "../../app-header/app-header";
import { Router } from '@angular/router';
import { AuthService, CheckAuthResult } from '../../core/service/auth-service';
import { NoticeService } from '../../core/view-core/service/notice-service';
import { DefaultServiceResultWithData } from '../../core/model/default-server-result';
import AdminService from '../../core/service/admin-service';

@Component({
	selector: 'app-home',
	imports: [AppFooter, AppHeader],
	templateUrl: './home.html',
	styleUrl: './home.css',
})
export class Home implements OnInit {
	isAdmin: boolean = false;

	constructor(
		private cdr: ChangeDetectorRef,
		private authService: AuthService,
		private adminService: AdminService
	) {}

	
	async ngOnInit(): Promise<void> {
		this.checkAuthentication();
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
