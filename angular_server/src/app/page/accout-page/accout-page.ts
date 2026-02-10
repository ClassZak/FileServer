import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

// Компоненты
import { AppFooter } from '../../app-footer/app-footer';
import { AppHeader } from "../../app-header/app-header";
import { LoadingSpinner } from "../../component/loading-spinner/loading-spinner";
import { RedirectionButton } from '../../component/redirection-button/redirection-button';

// Сервисы и модели
import { AuthService } from '../../core/service/auth-service';
import { AdminService } from '../../core/service/admin-service';
import { GroupService } from '../../core/service/group-service';
import { User } from '../../core/model/user';

interface Group {
	name: string;
	membersCount: number;
	creatorEmail: string;
}

@Component({
	selector: 'app-account-page',
	standalone: true,
	imports: [
		CommonModule,
		AppFooter, 
		AppHeader, 
		LoadingSpinner,
		RedirectionButton
	],
	templateUrl: './accout-page.html',
	styleUrl: './accout-page.css'
})
export class AccountPage implements OnInit {
	public isLoading: boolean = true;
	isLoadingGroups: boolean = true;
	isAuthenticated: boolean = false;
	isAdmin: boolean = false;
	isPasswordModalOpen: boolean = false;
	user: User | undefined;
	groups: Group[] = [];

	constructor(
		private router: Router,
		private cdr: ChangeDetectorRef
	) {}

	async ngOnInit(): Promise<void> {
		try {
			await this.checkAuthentication();
		} catch (error) {
			console.error('Ошибка при загрузке страницы:', error);
		}
	}

	private async checkAuthentication(): Promise<void> {
		try {
			const authResult = await AuthService.checkAuth();
			
			if (authResult.authenticated) {
				console.log('Аутентификация прошла успешно');
				this.isAuthenticated = true;
				this.user = authResult.user;
				
				// Загружаем дополнительную информацию
				await this.checkAdminStatus()
				await this.loadGroups()
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
		this.cdr.detectChanges();
	}

	private async checkAdminStatus(): Promise<void> {
		try {
			const token = AuthService.getToken();
			if(token == null)
				throw "You have not a token";
			this.isAdmin = await AdminService.isAdmin(token);
		} catch (error) {
			console.error('Ошибка при проверке статуса администратора:', error);
		}
	}

	private async loadGroups(): Promise<void> {
		try {
			const token = AuthService.getToken();
			if (!token)
				throw Error('No token');
			const groupsResult = await GroupService.getMyGroups(token);
			
			if (groupsResult.error) {
				console.error('Ошибка загрузки групп:', groupsResult.error);
			} else {
				this.groups = groupsResult;
			}
		} catch (error) {
			console.error('Ошибка при загрузке групп:', error);
		} finally {
			this.isLoadingGroups = false;
		}
	}

	public handleLogout(): void {
		AuthService.logout();
		this.router.navigate(['/login']);
	}

	public setPasswordModalIsOpen(state: boolean): void {
		this.isPasswordModalOpen = state;
	}

	public navigateToGroup(groupName: string): void {
		this.router.navigate(['/group', encodeURIComponent(groupName)]);
	}
	public navigateToUsers(): void {
		this.router.navigate(['/users']);
	}
}