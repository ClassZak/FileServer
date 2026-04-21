import { ChangeDetectorRef, Component, Injectable, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

// Components
import { AppFooter } from '../../app-footer/app-footer';
import { AppHeader } from "../../app-header/app-header";
import { LoadingSpinner } from "../../component/loading-spinner/loading-spinner";
import { CreateUserModalComponent } from '../../component/modal/user/create-user-modal/create-user-modal';

// Services and models
import { AuthService } from '../../core/service/auth-service';
import { AdminService } from '../../core/service/admin-service';
import { User } from '../../core/model/user';
import { UserService } from '../../core/service/user-service';
import { CreateUserModel } from '../../core/model/create-user-model';
import { UserAdminModel } from '../../core/model/user-admin-model';
import { RedirectionButton } from '../../component/redirection-button/redirection-button';
import { ActionType, ModelTableDataObject } from '../../core/model/model-table-types';
import { ModelTable } from "../../component/model-table/model-table";

// Notifications
import { NoticeService } from '../../core/view-core/service/notice-service';
import { Notification, NotificationType } from '../../core/view-core/model/notification';


@Component({
	selector: 'app-users-page',
	imports: [
		CommonModule,
		AppHeader,
		AppFooter,
		LoadingSpinner,

		CreateUserModalComponent,
		RedirectionButton,
		ModelTable
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
	error: string = '';

	currentUserModelTableDataObjectRef:ModelTableDataObject<User> = new ModelTableDataObject<User>(
		[
			{header: 'Фамилия', field: 'surname'},
			{header: 'Имя', field: 'name'},
			{header: 'Отчество', field: 'patronymic'},
			{header: 'Почта', field: 'email'},
		],
		[],
		{
			actionsHeader: 'Действия',
			actionsConfigs: [
				{
					type: ActionType.LINK,
					label: 'Изменить данные',
					class: 'btn btn-blue',
					href: (item: User) => !item.email ? '/users' : `/user/${encodeURI(item.email)}`
				}
			]
		}
	);

	constructor(
		private router: Router,
		private cdr: ChangeDetectorRef,

		private authService: AuthService,
		private adminService: AdminService,
		private userService: UserService,


		private noticeService: NoticeService
	) {}

	async ngOnInit(): Promise<void> {
		try {
			await this.checkAuthentication();
			await this.checkAdminStatus();
			await this.loadUsers();
		} catch (error) {
			console.error('Ошибка при загрузке страницы:', error);
			this.noticeService.addNotification(new Notification(NotificationType.Error, (error as Error).message));
		} finally {
			this.isLoading = false;
			this.cdr.detectChanges();
		}
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
			this.noticeService.addNotification(new Notification(NotificationType.Error, `Ошибка при проверке аутентификации:, ${error}`));
			this.router.navigate(['/login']);
			return;
		}
		this.cdr.detectChanges();
	}
	private async checkAdminStatus(): Promise<void> {
		try {
			const token = AuthService.getToken();
			if(token === null)
				throw "У вас нет токена авторизации";
			const result = await this.adminService.isAdmin(token);
			if (result.success)
				this.isAdmin = result.data!.isAdmin;
			else if (!result.success && !result.error)
				this.router.navigate(['/account']);
			else
				throw new Error(result.error);
		} catch (error) {
			console.error('Ошибка при проверке статуса администратора:', error);
			this.noticeService.addNotification(new Notification(NotificationType.Error, `Ошибка при проверке статуса администратора:, ${error}`));
			this.isAdmin = false;
			Promise.resolve().then(()=>{this.router.navigate(['/account']);});
		}
	}

	private async loadUsers(){
		try {
			const token = AuthService.getToken();
			if(token === null)
				throw new Error("У вас нет токена авторизации");
			if(this.isAdmin) {
				const response = await this.userService.readAllUsers(token);
				if (!response.success)
					throw new Error(response.error);
				const loadedUsers = response.data?.users as Array<UserAdminModel>;
				this.currentUserModelTableDataObjectRef.models = loadedUsers;
			}
		} catch (error) {
			console.error('Ошибка при загрузке пользователей', error);
			this.noticeService.addNotification(new Notification(NotificationType.Error, `Ошибка при загрузке пользователей:, ${error}`));
		} finally {
			this.cdr.detectChanges();
		}
	}

	public setIsCreateUserModalComponentOpen(state: boolean){
		this.isCreateUserModalComponentOpen = state;
	}
	public async handleConfirmCreateUser(userData: CreateUserModel) : Promise<void>{
		try {
			this.isLoading = true;

			const token = AuthService.getToken();
			if (!token)
				throw new Error('Отсутствует токен авторизации');
			const response = await this.userService.createUser(userData, token);
			if (!response.success)
				throw new Error('Не удалось создать пользователя');

			this.isCreateUserModalComponentOpen = false;
			await this.loadUsers();
			this.cdr.detectChanges();
		} catch (error) {
			console.error('Error updating password:', error);
			this.error = (error as Error).message;
			this.noticeService.addNotification(new Notification(NotificationType.Error, (error as Error).message));
		} finally {
			this.isLoading = false;
			this.cdr.detectChanges();
		}
	}
}
