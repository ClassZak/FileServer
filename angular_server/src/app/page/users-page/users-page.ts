import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

// Components
import { AppFooter } from '../../app-footer/app-footer';
import { AppHeader } from "../../app-header/app-header";
import { LoadingSpinner } from "../../component/loading-spinner/loading-spinner";
import { GroupTable } from '../../component/group-table/group-table';
import { CreateUserModalComponent } from '../../component/modal/user/create-user-modal/create-user-modal';

// Services and models
import { AuthService } from '../../core/service/auth-service';
import { AdminService } from '../../core/service/admin-service';
import { GroupService } from '../../core/service/group-service';
import { User } from '../../core/model/user';
import { UserService } from '../../core/service/user-service';
import { CreateUserModel } from '../../core/model/create-user-model';
import { UserAdminModel } from '../../core/model/user-admin-model';
import { UserTable } from '../../component/user-table/user-table';
import { RedirectionButton } from '../../component/redirection-button/redirection-button';

@Component({
	selector: 'app-users-page',
	imports: [
		CommonModule,
		AppHeader,
		AppFooter,
		LoadingSpinner,
		UserTable,
		CreateUserModalComponent,
		
		RedirectionButton
	],
	templateUrl: './users-page.html',
	styleUrl: './users-page.css',
})
export class UsersPage implements OnInit {
	public isLoading: boolean = true;
	isCreateUserModalComponentOpen: boolean = false;
	isAuthenticated: boolean = false;
	authorizedUser?: User;
	isAdmin: boolean = false;
	users: Array<User>=[];
	error: string = '';

	constructor(
		private router: Router,
		private cdr: ChangeDetectorRef
	) {}

	async ngOnInit(): Promise<void> {
		try {
			await this.checkAuthentication();
			await this.checkAdminStatus();
			await this.loadUsers();
		} catch (error) {
			console.error('Ошибка при загрузке страницы:', error);
			// TODO: notice
		}
	}




	private async checkAuthentication(): Promise<void> {
		try {
			const authResult = await AuthService.checkAuth();
			
			if (authResult.authenticated) {
				console.log('Аутентификация прошла успешно');
				this.isAuthenticated = true;
				this.authorizedUser = authResult.user;
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
			this.isLoading = true;
			const token = AuthService.getToken();
			if(token === null)
				throw "У вас нет токена авторизации";
			const isAdmin = await AdminService.isAdmin(token);
			if (!isAdmin)
				this.router.navigate(['/account']);
			else
				this.isAdmin = isAdmin;
		} catch (error) {
			console.error('Ошибка при проверке статуса администратора:', error);
			this.isAdmin = false;
			setTimeout(()=>{
				this.router.navigate(['/account']);
			}, 50);
		}
	}

	private async loadUsers(){
		try {
			this.isLoading = true;
			const token = AuthService.getToken();
			if(token === null)
				throw "У вас нет токена авторизации";
			if(this.isAdmin) {
				this.users = (await UserService.readAllUsers(token))
					.users as Array<UserAdminModel>;
			}
		} catch (error) {
			console.error('Ошибка при загрузке пользователей', error);
		} finally {
			this.isLoading = false;
			this.cdr.detectChanges();
		}
	}

	public setIsCreateUserModalComponentOpen(state: boolean){
		this.isCreateUserModalComponentOpen = state;
	}
	public async handleComfirmCreateUser(userData: CreateUserModel) : Promise<void>{
		try {
			const token = AuthService.getToken();
			if (!token)
				throw Error('Отсутствует токен авторизации');
			const response = await UserService.createUser(userData, token);
			if (!response.success)
				throw Error('Не удалось создать пользователя');

			this.isCreateUserModalComponentOpen = false;
			await this.loadUsers();
			this.cdr.detectChanges();
		} catch (error: any) {
			console.error('Error updating password:', error);
			this.error = error.toString();
		}
	}
}
