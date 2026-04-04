import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { User } from '../../core/model/user';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AppFooter } from '../../app-footer/app-footer';
import { AppHeader } from '../../app-header/app-header';
import { LoadingSpinner } from '../../component/loading-spinner/loading-spinner';
import { UpdateUserModalComponent, UpdateUserModel } from '../../component/modal/user/update-user-modal/update-user-modal';
import { UpdateUserPasswordModalComponent } from '../../component/modal/user/update-user-password-modal/update-user-password-modal';
import { DeleteUserModalComponent } from '../../component/modal/user/delete-user-modal/delete-user-modal';
import { UserAdminModel } from '../../core/model/user-admin-model';
import { AuthService, CheckAuthResult } from '../../core/service/auth-service';
import AdminService from '../../core/service/admin-service';
import { Subscription } from 'rxjs';
import { UserService } from '../../core/service/user-service';
import { UpdatePasswordRequest } from '../../core/model/update-password-request';
import { UpdatePasswordModalModel } from '../../core/model/update-password-modal-model';
import { RedirectionButton } from '../../component/redirection-button/redirection-button';

@Component({
	selector: 'app-user-page',
	imports: [
		CommonModule,
		AppHeader,
		AppFooter,
		LoadingSpinner,

		UpdateUserModalComponent,
		UpdateUserPasswordModalComponent,
		DeleteUserModalComponent,
		
		RedirectionButton
	],
	templateUrl: './user-page.html',
	styleUrl: './user-page.css',
})
export class UserPage implements OnInit, OnDestroy {
	public isLoading: boolean = true;
	isUpdateUserModalOpen : boolean = false;
	isUpdateUserPasswordModalOpen : boolean = false;
	isDeleteUserModalOpen : boolean = false;
	isAuthenticated: boolean = false;
	authorizedUser?: User;
	user?: UserAdminModel;
	userEmail: string = '';
	myUserData?: User;
	isAdmin: boolean = false;
	private paramSubscription?: Subscription;
	error: string = '';

	setIsUpdateUserModalOpen(status: boolean){
		this.isUpdateUserModalOpen = status;
	}
	setIsUpdateUserPasswordModalOpen(status: boolean){
		this.isUpdateUserPasswordModalOpen = status;
	}
	setIsDeleteUserModalOpen(status: boolean){
		this.isDeleteUserModalOpen = status;
	}


	constructor(
		private router: Router,
		private cdr: ChangeDetectorRef,
		private route: ActivatedRoute,

		private authService: AuthService,
		private adminService: AdminService,
		private userService: UserService
	) {}

	async ngOnInit(): Promise<void> {
		try{
			await this.checkAuthentication();
		} catch (error) {
			console.error('Ошибка аутентификации при загрузке страницы:', error); // TODO: notice
		}
		this.paramSubscription = this.route.paramMap.subscribe(params => {
			this.userEmail = params.get('email') || '';
			if(this.userEmail == '') {
				this.router.navigate(['/account']);
				return;
			}
		});
		try{
			await this.checkAdminStatus();
			await this.loadUserData();
			this.checkIsSelfUserForAdmin()
		} catch (error) {
			// TODO: notice
		} finally {
			this.isLoading = false;
			this.cdr.detectChanges();
		}
	}
	ngOnDestroy(): void {
		this.paramSubscription?.unsubscribe();
	}




	private async checkAuthentication(): Promise<void> {
		try {
			const authResult = await this.authService.checkAuth();
			
			if (!authResult.success || !authResult.data?.authenticated) {
				console.error('Аутентификация не пройдена:', authResult.error);
				this.router.navigate(['/login']);
				return;
			} else {
				console.log('Аутентификация прошла успешно');
				this.isAuthenticated = true;
				this.authorizedUser = authResult.data?.user;
			}
		} catch (error) {
			console.error('Ошибка при проверке аутентификации:', error);
			this.router.navigate(['/login']);
			return;
		}
	}
	private checkIsSelfUserForAdmin(): void{
		if (this.myUserData?.email === this.user?.email && this.isAdmin)
			this.router.navigate(['/account']);
	}
	private async checkAdminStatus(): Promise<void> {
		try {
			const token = AuthService.getToken();
			if(token === null)
				throw "У вас нет токена авторизации";
			const result = await this.adminService.isAdmin(token);
			if (result.success)
				this.isAdmin = true;
			else if (!result.success && !result.error)
				this.router.navigate(['/account']);
			else
				throw new Error(result.error);
		} catch (error) {
			console.error('Ошибка при проверке статуса администратора:', error);
			this.isAdmin = false;
			Promise.resolve().then(()=>{this.router.navigate(['/account']);});
		}
	}
	private async loadUserData(): Promise<void> {
		try {
			const token = AuthService.getToken();
			if(token === null)
				throw new Error('У вас нет токена авторизации');
			if(!this.isAdmin)
				throw new Error('Вы не являетесь администратором');
			const response = await this.userService.readUser(token, this.userEmail);
			if (!response.success)
				throw new Error(response.error);
			const user = response.data?.user;
			if (!user)
				throw new Error(
					response.message ? 
					response.message: 'Не удалось загрузить данные пользователя'
				);
			else
				this.user = user;
		} catch (error) {
			console.error('Ошибка при загрузки данных пользователя:', error);
			this.error = (error as Error).message;
			// TODO: notice
		}
	}

	async handleUpdateUserModal(newUserData: UpdateUserModel){
		try {
			this.isLoading = true;

			const token = AuthService.getToken();
			if (!token)
				throw new Error('Отсутствует токен авторизации');
			const response = await this.userService.updateUser(token, this.userEmail, newUserData as User);
			if (response.error)
				throw new Error(response.error);
			if (!response.success)
				throw new Error('Ошибка Обновления данных пользователя');
			else if (this.userEmail != newUserData.email){
				this.router.navigate([`/user/${encodeURIComponent(newUserData.email)}`]);
				return;
			}
			else
				await this.loadUserData();
			console.log('Данные пользователя успешно обновлены');
			// TODO: notice
			this.setIsUpdateUserModalOpen(false);
			await this.loadUserData();
		} catch (error) {
			console.error('Error updating user data:', error);
			// TODO: notice
		} finally {
			this.isLoading = false;
			this.cdr.detectChanges();
		}
	}
	async handleUpdateUserPasswordModal(passwordData: UpdatePasswordModalModel){
		try {
			this.isLoading = true;

			if (passwordData.newPassword !== passwordData.newPasswordConfirm)
				throw new Error('Новый пароль и его подтверждение не совпадают');
			const token = AuthService.getToken();
			if (!token)
				throw new Error('Отсутствует токен авторизации');
			if (!this.user)
				throw new Error('Объект данных пользователя не определён');
			const result = await this.userService.updateUserPassword(
				token, this.user.email, 
				new UpdatePasswordRequest(passwordData.oldPassword, passwordData.newPassword)
			);
			if (!result.success)
				throw new Error(result.error);

			this.setIsUpdateUserPasswordModalOpen(false);
			await this.loadUserData();
		} catch (error) {
			console.error('Error updating password:', error);
			// TODO: notice
		} finally {
			this.isLoading = false;
			this.cdr.detectChanges();
		}
	}
	async handleDeleteUserModal(){
		try {
			this.isLoading = true;

			const token = AuthService.getToken();
			if (!token)
				throw new Error('Отсутствует токен авторизации');
			if (!this.user)
				throw new Error('Объект данных пользователя не определён');
			const response = await this.userService.deleteUser(token, this.user);
			if (response.error)
				throw new Error(response.error);
			if (!response.success)
				throw new Error('Ошибка удаления пользователя');
			this.router.navigate(['/users']);
		} catch (error) {
			console.error('Error updating password:', error);
			// TODO: notice
		} finally {
			this.isLoading = false;
			this.cdr.detectChanges();
		}
	}
}
