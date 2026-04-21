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
import { GroupBasicInfo } from '../../core/model/group_basic_info';
import { ActionType, ModelTableDataObject } from '../../core/model/model-table-types';
import { GroupService } from '../../core/service/group-service';
import { ModelTable } from "../../component/model-table/model-table";
import { NoticeService } from '../../core/view-core/service/notice-service';
import { Notification, NotificationBuilder, NotificationType } from '../../core/view-core/model/notification';

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
	RedirectionButton,
	ModelTable
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
	userGroups: Array<GroupBasicInfo> = [];
	userEmail: string = '';
	isAdmin: boolean = false;
	private paramSubscription?: Subscription;
	error: string = '';
	currentGroupModelTableDataObject: ModelTableDataObject<GroupBasicInfo> = new ModelTableDataObject(
		[
			{header: 'Название', field: 'name'},
			{header: 'Число участников', field: 'membersCount'},
			{header: 'Почта создателя', field: 'creatorEmail'},
		],
		[],
		{
			actionsHeader: 'Действия',
			actionsConfigs: [
				{
					type: ActionType.LINK,
					label: 'Изменить данные',
					class: 'btn btn-blue',
					href: (item: GroupBasicInfo) => !item.name ? '/groups' :`/group/${item.name}`
				}
			]
		}
	);

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
		private userService: UserService,
		private groupService: GroupService,


		private noticeService: NoticeService
	) {}

	async ngOnInit(): Promise<void> {
		try{
			await this.checkAuthentication();
		} catch (error) {
			console.error('Ошибка аутентификации при загрузке страницы:', error);
			this.noticeService.addNotification(new Notification(NotificationType.Error, `Ошибка аутентификации при загрузке страницы: ${error}`));
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
			if(!this.isAdmin) {
				Promise.resolve().then(()=>{this.router.navigate(['/account']);});
				this.paramSubscription.unsubscribe();
				return;
			}
			await this.loadUserData()
			await this.loadUserGroups();
			this.checkIsSelfUserForAdmin();
		} catch (error) {
			this.noticeService.addNotification(new Notification(NotificationType.Error, `Ошибка аутентификации при загрузке страницы: ${(error as Error).message}`));
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
		if (this.authorizedUser?.email === this.user?.email && this.isAdmin)
			this.router.navigate(['/account']);
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
			this.noticeService.addNotification(new Notification(NotificationType.Error, `Ошибка при загрузки данных пользователя: ${this.error}`));
		}
	}
	private async loadUserGroups(): Promise<void> {
		try {
			const token = AuthService.getToken();
			if(token === null)
				throw new Error("У вас нет токена авторизации");
			if(this.isAdmin) {
				const response = await this.groupService.getGroupsForUser(token, this.user?.email!);
				if (!response.success)
					throw new Error(response.error);
				if (Array.isArray(response.data)) {
					this.userGroups = response.data;
					this.currentGroupModelTableDataObject.models = response.data;
				}
			} else {
				return;
			}
		} catch (error) {
			console.error('Ошибка при загрузке групп', error);
			this.noticeService.addNotification(new Notification(NotificationType.Error, `Ошибка при загрузке групп: ${(error as Error).message}`));
		} finally {
			this.cdr.detectChanges();
		}
	}

	async handleUpdateUserModal(newUserData: UpdateUserModel){
		try {
			this.isLoading = true;

			const token = AuthService.getToken();
			if (!token)
				throw new Error('Отсутствует токен авторизации');
			const response = await this.userService.updateUser(
				token, this.userEmail, newUserData as User
			);
			if (!response.success)
				throw new Error(response.error || 'Ошибка Обновления данных пользователя');
			else {
				if (!this.user) {
					this.user = new UserAdminModel(
						newUserData.surname,
						newUserData.name,
						newUserData.patronymic,
						newUserData.email
					);
				} else {
					this.user.surname = newUserData.surname;
					this.user.name = newUserData.name;
					this.user.patronymic = newUserData.patronymic;
					this.user.email = newUserData.email;
				}
			}
			if (this.userEmail != this.user.email) {
				this.userEmail = this.user.email;
				this.setIsUpdateUserModalOpen(false);
				this.router.navigate([`/user/${(this.userEmail)}`]);
				this.cdr.detectChanges();
				return;
			}
			else
				await this.loadUserData();
			console.log('Данные пользователя успешно обновлены');
			this.noticeService.addNotification(new Notification(NotificationType.Success, 'Данные пользователя успешно обновлены'));
			this.setIsUpdateUserModalOpen(false);
			await this.loadUserData();
		} catch (error) {
			console.error('Error updating user data:', error);
			this.noticeService.addNotificationErrorTypeByMessage(`Ошибка обноаления данных пользователя: ${(error as Error).message}`);
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
			console.error('Ошибка обноаления пароля:', error);
			this.noticeService.addNotificationErrorTypeByMessage(`Ошибка обноаления пароля: ${(error as Error).message}`);
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
			console.error('Ошибка удаления пользователя:', error);
			this.noticeService.addNotificationErrorTypeByMessage(`Ошибка удаления пользователя: ${(error as Error).message}`);
		} finally {
			this.isLoading = false;
			this.cdr.detectChanges();
		}
	}
}
