import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { User } from '../../core/model/user';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AppFooter } from '../../app-footer/app-footer';
import { AppHeader } from '../../app-header/app-header';
import { LoadingSpinner } from '../../component/loading-spinner/loading-spinner';
import { UserTable } from '../../component/user-table/user-table';
import { UpdateUserModalComponent, UpdateUserModel } from '../../component/modal/user/update-user-modal/update-user-modal';
import { UpdateUserPasswordModalComponent } from '../../component/modal/user/update-user-password-modal/update-user-password-modal';
import { DeleteUserModalComponent } from '../../component/modal/user/delete-user-modal/delete-user-modal';
import { UserAdminModel } from '../../core/model/user-admin-model';
import { AuthService } from '../../core/service/auth-service';
import AdminService from '../../core/service/admin-service';
import { Subscription } from 'rxjs';
import { UserService } from '../../core/service/user-service';
import { UpdatePasswordRequest } from '../../core/model/update-password-request';
import { UpdatePasswordModalModel } from '../../core/model/update-password-modal-model';

@Component({
	selector: 'app-user-page',
	imports: [
		CommonModule,
		AppHeader,
		AppFooter,
		LoadingSpinner,
		UserTable,

		UpdateUserModalComponent,
		UpdateUserPasswordModalComponent,
		DeleteUserModalComponent
	],
	templateUrl: './user-page.html',
	styleUrl: './user-page.css',
})
export class UserPage implements OnInit {
  	public isLoading: boolean = true;
	isUpdateUserModalOpen : boolean = false;
	isUpdateUserPasswordModalOpen : boolean = false;
	isDeleteUserModalOpen : boolean = false;
	user?: UserAdminModel;
	userEmail: string = '';
	myUserData?: User;
	isAdmin: boolean = false;
	private paramSubscription?: Subscription;

	setIsUpdateUserModalOpen(status: boolean){
		this.isUpdateUserModalOpen = status;
	}
	setIsUpdateUserPasswordModalOpen(status: boolean){
		this.isUpdateUserPasswordModalOpen = status;
	}
	setIsDeleteUserModalOpen(status: boolean){
		this.isDeleteUserModalOpen = status;
	}

	error: string = '';

	constructor(
		private router: Router,
		private cdr: ChangeDetectorRef,
		private route: ActivatedRoute
	) {}

	async ngOnInit(): Promise<void> {
		this.paramSubscription = this.route.paramMap.subscribe(params => {
			this.userEmail = params.get('email') || '';
			if(this.userEmail == '')
				this.router.navigate(['/account']);
		});
		try{
			await this.checkAdminStatus();
			await this.loadUserData();
		} catch (error) {

		} finally {
			this.cdr.detectChanges();
		}
	}
	ngOnDestroy(): void {
		this.paramSubscription?.unsubscribe();
	}
	private async checkAdminStatus(): Promise<void> {
		try {
			this.isLoading = true;
			const response = await AuthService.checkAuth();
			const user = response.user;
			if (!user)
				throw Error(
					response.message ? 
					response.message: 'Не удалось загрузить данные пользователя'
				);
			const token = AuthService.getToken();
			if(token == null)
				throw "У вас нет токена авторизации";
			const isAdmin = await AdminService.isAdmin(token);
			if (!isAdmin)
				this.router.navigate(['/account']);
			else {
				this.isAdmin = isAdmin;
				this.myUserData = user;
			}


			if (this.myUserData?.email == this.userEmail)
				this.router.navigate(['/account']);
		} catch (error) {
			console.error('Ошибка при проверке статуса администратора:', error);
			this.isAdmin = false;
			setTimeout(()=>{
				this.router.navigate(['/account']);
			}, 50);
		}
	}
	private async loadUserData(): Promise<void> {
		try {
			this.isLoading = true;
			const token = AuthService.getToken();
			if(token == null)
				throw Error('У вас нет токена авторизации');
			if(!this.isAdmin)
				throw Error('Вы не являетесь администратором');
			const response = await UserService.readUser(token, this.userEmail);
			if (response.error)
				throw Error(response.error);
			const user = response.user;
			if (!user)
				throw Error(
					response.message ? 
					response.message: 'Не удалось загрузить данные пользователя'
				);
			else
				this.user = user;
		} catch (error: any) {
			console.error('Ошибка при загрузки данных пользователя:', error);
			this.error = error.toString();
		} finally {
			this.isLoading = false;
		}
	}

	async handleUpdateUserModal(newUserData: UpdateUserModel){
		try {
			const token = AuthService.getToken();
			if (!token)
				throw Error('Отсутствует токен авторизации');
			const response = await UserService.updateUser(token, this.userEmail, newUserData as User);
			if (response.error)
				throw Error(response.error);
			if (!response.success)
				throw Error('Ошибка удаления пользователя');
			this.setIsUpdateUserModalOpen(false);
			this.loadUserData();
		} catch (error) {
			console.error('Error updating password:', error);
			// TODO: notice
		}
	}
	async handleUpdateUserPasswordModal(passwordData: UpdatePasswordModalModel){
		try {
			if (passwordData.newPassword !== passwordData.newPasswordConfirm)
				throw Error('Новый пароль и его подтверждение не совпадают');
			const token = AuthService.getToken();
			if (!token)
				throw Error('Отсутствует токен авторизации');
			if (!this.user)
				throw Error('Объект данных пользователя не определён');
			UserService.updateUserPassword(
				token, this.user.email, 
				new UpdatePasswordRequest(passwordData.oldPassword, passwordData.newPassword)
			);
			this.setIsUpdateUserPasswordModalOpen(false);
			this.loadUserData();
		} catch (error) {
			console.error('Error updating password:', error);
			// TODO: notice
		}
	}
	async handleDeleteUserModal(){
		try {
			const token = AuthService.getToken();
			if (!token)
				throw Error('Отсутствует токен авторизации');
			if (!this.user)
				throw Error('Объект данных пользователя не определён');
			const response = await UserService.deleteUser(token, this.user);
			if (response.error)
				throw Error(response.error);
			if (!response.success)
				throw Error('Ошибка удаления пользователя');
			this.router.navigate(['/users']);
		} catch (error) {
			console.error('Error updating password:', error);
			// TODO: notice
		}
	}
}
