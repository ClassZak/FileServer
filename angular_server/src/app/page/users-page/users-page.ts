import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

// Components
import { AppFooter } from '../../app-footer/app-footer';
import { AppHeader } from "../../app-header/app-header";
import { LoadingSpinner } from "../../component/loading-spinner/loading-spinner";
import { RedirectionButton } from '../../component/redirection-button/redirection-button';
import { GroupTable } from '../../component/group-table/group-table';
import { CreateUserModalComponent } from '../../component/modal/user/create-user-modal/create-user-modal';

// Services and models
import { AuthService } from '../../core/service/auth-service';
import { AdminService } from '../../core/service/admin-service';
import { GroupService } from '../../core/service/group-service';
import { User } from '../../core/model/user';
import { UserService } from '../../core/service/user-service';
import { CreateUserModel } from '../../component/modal/user/create-user-modal/create-user-modal';
import { UserAdminModel } from '../../core/model/user-admin-model';
import { UserTable } from '../../component/user-table/user-table';

@Component({
	selector: 'app-users-page',
	imports: [
		CommonModule,
		AppHeader,
		AppFooter,
		LoadingSpinner,
		UserTable,
		CreateUserModalComponent
	],
	templateUrl: './users-page.html',
	styleUrl: './users-page.css',
})
export class UsersPage implements OnInit {
	public isLoading: boolean = true;
	isCreateUserModalComponentOpen: boolean = false;
	isAdmin: boolean = false;
	users: Array<User>=[];

	constructor(
		private router: Router,
		private cdr: ChangeDetectorRef
	) {}

	async ngOnInit(): Promise<void> {
		try {
			await this.checkAdminStatus();
			await this.loadUsers();
		} catch (error) {
			console.error('Ошибка при загрузке страницы:', error);
		}
	}

	private async checkAdminStatus(): Promise<void> {
		try {
			this.isLoading = true;
			const token = AuthService.getToken();
			if(token == null)
				throw "You have not a token";
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
			if(token == null)
				throw "You have not a token";
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
}
