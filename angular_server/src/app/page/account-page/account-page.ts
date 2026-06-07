import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

// Components
import { AppFooter } from '../../app-footer/app-footer';
import { AppHeader } from "../../app-header/app-header";
import { LoadingSpinner } from "../../component/loading-spinner/loading-spinner";
import { RedirectionButton } from '../../component/redirection-button/redirection-button';
import { UpdateUserPasswordModalComponent } from '../../component/modal/user/update-user-password-modal/update-user-password-modal';
import { AddAdminToGroupModalComponent } from '../../component/modal/group/add-admin-to-group-modal/add-admin-to-group-modal';

// Services and models
import { AuthService } from '../../core/service/auth-service';
import { AdminService } from '../../core/service/admin-service';
import { GroupService } from '../../core/service/group-service';
import { User } from '../../core/model/user';
import { GroupBasicInfo } from '../../core/model/group_basic_info';
import { UpdatePasswordModalModel } from '../../core/model/update-password-modal-model';
import { UserService } from '../../core/service/user-service';
import { UpdatePasswordRequest } from '../../core/model/update-password-request';
import { ActionType, ModelTableDataObject } from '../../core/model/model-table-types';
import { ModelTable } from '../../component/model-table/model-table';
import { NoticeService } from '../../core/view-core/service/notice-service';
import { Notification, NotificationType } from '../../core/view-core/model/notification';
import { Title } from '@angular/platform-browser';

@Component({
	selector: 'app-account-page',
	standalone: true,
	imports: [
		CommonModule,
		AppFooter, 
		AppHeader, 
		LoadingSpinner,

		ModelTable,

		UpdateUserPasswordModalComponent,
		AddAdminToGroupModalComponent
	],
	templateUrl: './account-page.html',
	styleUrl: './account-page.css'
})
export class AccountPage implements OnInit {
	// Title
	private titleService = inject(Title);

	public isLoading: boolean = true;
	isLoadingGroups: boolean = true;
	isLoadingMyGroups: boolean = true;
	isAuthenticated: boolean = false;
	isAdmin: boolean = false;
	isPasswordModalOpen: boolean = false;
	isAddAdminToGroupModalOpen: boolean = false;
	user: User | undefined;
	groups: GroupBasicInfo[] = [];
	currentGroupModelTableDataObjectRef?:ModelTableDataObject<GroupBasicInfo>;
	defaultGroupModelTableDataObject:	ModelTableDataObject<GroupBasicInfo> = new ModelTableDataObject(
		[
			{header: 'Название', field: 'name'},
			{header: 'Число участников', field: 'membersCount'},
			{header: 'Почта главы группы', field: 'headEmail'},
		],
		[],
		{
			actionsHeader: 'Действия',
			actionsConfigs: [
				{
					type: ActionType.LINK,
					label: 'Просмотр',
					class: 'btn btn-blue',
					href: (item: GroupBasicInfo) => !item.name ? '/groups' :`/group/${item.name}`
				}
			]
		}
	);
	adminGroupModelTableDataObject:		ModelTableDataObject<GroupBasicInfo> = new ModelTableDataObject(
		[
			{header: 'Название', field: 'name'},
			{header: 'Число участников', field: 'membersCount'},
			{header: 'Почта главы группы', field: 'headEmail'},
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

	constructor(
		private router: Router,
		private cdr: ChangeDetectorRef,

		private authService: AuthService,
		private adminService: AdminService,
		private groupService: GroupService,
		private userService: UserService,


		private noticeService: NoticeService
	) {}

	async ngOnInit(): Promise<void> {
		this.titleService.setTitle('Аккаунт');
		try {
			await this.checkAuthentication();
			if (this.isAdmin)
				await this.loadGroups();
		} catch (error) {
			console.error('Ошибка при загрузке страницы:', error);
			this.noticeService.addNotification(new Notification(NotificationType.Error, `Ошибка при загрузке страницы:', '${error}'`));
		} finally {
			this.isLoading = false;
			this.cdr.detectChanges();
		}
	}

	private async checkAuthentication(): Promise<void> {
		try {
			const authResult = await this.authService.checkAuth();
			
			if (!authResult.success) {
				console.error(authResult.error);
				this.router.navigate(['/login']);
				return;
			}

			if (authResult.data?.authenticated) {
				this.isAuthenticated = true;
				this.user = authResult.data.user;
				
				// Load addition information
				await this.checkAdminStatus()
				await this.loadMyGroups()
			} else {
				console.error('Аутентификация не пройдена:', authResult.error);
				this.router.navigate(['/login']);
				return;
			}
		} catch (error) {
			console.error('Ошибка при проверке аутентификации:', error);
			this.noticeService.addNotification(new Notification(NotificationType.Error, `Ошибка при проверке аутентификации: '${error}'`));
			this.router.navigate(['/login']);
			return;
		}
	}

	private async checkAdminStatus(): Promise<void> {
		try {
			const token = AuthService.getToken();
			if(token === null)
				throw "У вас нет токена авторизации";
			const result = await this.adminService.isAdmin(token);
			if (result.success)
				this.isAdmin = result.data!.isAdmin;
			else
				throw new Error(
					result.error ?
					result.error : 'Не удалось проверить статус администратора'
				);
		} catch (error) {
			console.error('Ошибка при проверке статуса администратора:', error);
			this.noticeService.addNotification(new Notification(NotificationType.Error, `Ошибка при проверке статуса администратора: '${(error as Error).message}'`));
		}
	}

	private async loadMyGroups(): Promise<void> {
		try {
			this.isLoadingMyGroups = true;
			const token = AuthService.getToken();
			if (!token)
				throw new Error('У вас нет токена авторизации');
			const groupsResult = await this.groupService.getMyGroups(token);
			
			if (!groupsResult.success) {
				throw new Error(`Ошибка загрузки групп:${groupsResult.error}`);
			} else if (Array.isArray(groupsResult.data)) {
				if (!this.isAdmin)
					this.currentGroupModelTableDataObjectRef = this.defaultGroupModelTableDataObject;
				else
					this.currentGroupModelTableDataObjectRef = this.adminGroupModelTableDataObject;
				this.currentGroupModelTableDataObjectRef.models = groupsResult.data;
			}
		} catch (error) {
			console.error('Ошибка при загрузке ваших групп:', error);
			this.noticeService.addNotification(new Notification(NotificationType.Error, `Ошибка при загрузке ваших групп: '${(error as Error).message}'`));
		} finally {
			this.isLoadingMyGroups = false;
			this.cdr.detectChanges();
		}
	}
	private async loadGroups(){
		try {
			this.isLoading = true;
			const token = AuthService.getToken();
			if(token === null)
				throw new Error("У вас нет токена авторизации");
			if(this.isAdmin) {
				const response = await this.groupService.getAllGroups(token);
				if (!response.success)
					throw new Error(response.error);
				if (Array.isArray(response.data))
					this.groups = response.data;
			} else {
				this.router.navigate(['/account']);
				return;
			}
		} catch (error) {
			console.error('Ошибка при загрузке групп', error);
			this.noticeService.addNotification(new Notification(NotificationType.Error, `Ошибка при загрузке групп: '${(error as Error).message}'`));
		} finally {
			this.isLoadingGroups = false;
			this.cdr.detectChanges();
		}
	}

	public async handleLogout(): Promise<void> {
		try {
			const result = await this.authService.logout();
			if (!result.success)
				throw new Error(result.error ?? 'Ошибка при выходе из системы');
		} catch (error) {
			this.noticeService.addNotification(new Notification(NotificationType.Error, `Ошибка при выходе из системы: '${(error as Error).message}'`));
		}
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
	
	
	
	
	handleClosePasswordModal(): void {
		this.setPasswordModalIsOpen(false);
	}
	async handleConfirmUpdatePassword(passwordData: UpdatePasswordModalModel): Promise<void> {
		try {
			this.isLoading = true;

			console.log('Updating password:', passwordData);
			if (passwordData.newPassword !== passwordData.newPasswordConfirm)
				throw new Error('Новый пароль и его подтверждение не совпадают');
			const token = AuthService.getToken();
			if (!token)
				throw new Error('Отсутствует токен авторизации');
			if (!this.user)
				throw new Error('Объект данных пользователя не определён');
			
			const result = await this.userService.updateUserPassword(
				token,
				this.user.email,
				new UpdatePasswordRequest(
					passwordData.oldPassword,
					passwordData.newPassword
				)
			);
			if (result.success)
				alert('Пароль успешно обновлен!');
			else
				console.error(result.error);
			this.setPasswordModalIsOpen(false);
			this.noticeService.addNotification(new Notification(NotificationType.Success, 'Пароль успешно изменён'));
		} catch (error) {
			console.error('Error updating password:', error);
			this.noticeService.addNotification(new Notification(NotificationType.Error, `Ошибка при обновлении пароля: '${(error as Error).message}'`));
		} finally {
			this.isLoading = false;
			this.cdr.detectChanges();
		}
	}


	


	public openAddAdminToGroupModal(): void {
		this.isAddAdminToGroupModalOpen = true;
	}

	public setIsAddAdminToGroupModalOpen(state: boolean): void {
		this.isAddAdminToGroupModalOpen = state;
	}

	handleCloseAddAdminToGroupModal(): void {
		this.setIsAddAdminToGroupModalOpen(false);
	}

	async handleConfirmAddAdminToGroupModal(selectedGroupName: string): Promise<void> {
		try {
			this.isLoading = true;

			const token = AuthService.getToken();
			if (!token) throw new Error('Нет токена авторизации');
			if (!this.user) throw new Error('Пользователь не определён');

			const result = await this.groupService.addUserToGroup(token, selectedGroupName, this.user.email);
			this.setIsAddAdminToGroupModalOpen(false);

			if (result.success)
				this.noticeService.addNotification(new Notification(NotificationType.Success, `Вы успешно добавлены в группу «${selectedGroupName}»`));
			else
				throw new Error(result.error);

			await this.loadMyGroups();
			await this.loadGroups();
			this.cdr.detectChanges();
		} catch (error) {
			console.error('Ошибка при добавлении себя в группу:', error);
			this.noticeService.addNotification(new Notification(NotificationType.Error, `Ошибка при добавлении себя в группу: '${(error as Error).message}'`));
		} finally {
			this.isLoading = false;
			this.cdr.detectChanges();
		}
	}
}