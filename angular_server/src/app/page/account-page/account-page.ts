import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
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

@Component({
	selector: 'app-account-page',
	standalone: true,
	imports: [
		CommonModule,
		AppFooter, 
		AppHeader, 
		LoadingSpinner,
		RedirectionButton,

		ModelTable,

		UpdateUserPasswordModalComponent,
		AddAdminToGroupModalComponent
	],
	templateUrl: './account-page.html',
	styleUrl: './account-page.css'
})
export class AccountPage implements OnInit {
	public isLoading: boolean = true;
	isLoadingGroups: boolean = true;
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
			{header: 'Почта создателя', field: 'creatorEmail'},
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

	constructor(
		private router: Router,
		private cdr: ChangeDetectorRef
	) {}

	async ngOnInit(): Promise<void> {
		try {
			await this.checkAuthentication();
			if (this.isAdmin)
				await this.loadGroups();
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
				await this.loadMyGroups()
			} else {
				console.log('Аутентификация не пройдена:', authResult.message);
				this.router.navigate(['/login']);
				return;
			}
		} catch (error) {
			console.error('Ошибка при проверке аутентификации:', error);
			this.router.navigate(['/login']);
			return;
		} finally {
			this.isLoading = false;
		}
		this.cdr.detectChanges();
	}

	private async checkAdminStatus(): Promise<void> {
		try {
			const token = AuthService.getToken();
			if(token === null)
				throw "У вас нет токена авторизации";
			const result = await AdminService.isAdmin(token);
			if (result.success)
				this.isAdmin = true;
			else
				throw new Error(
					result.error ?
					result.error : 'Не удалось проверить статус администратора'
				);
		} catch (error) {
			console.error('Ошибка при проверке статуса администратора:', error);
		}
	}

	private async loadMyGroups(): Promise<void> {
		try {
			const token = AuthService.getToken();
			if (!token)
				throw new Error('У вас нет токена авторизации');
			const groupsResult = await GroupService.getMyGroups(token);
			
			if ('error' in groupsResult) {
				console.error('Ошибка загрузки групп:', groupsResult.error);
			} else if (Array.isArray(groupsResult)) {
				if (!this.isAdmin)
					this.currentGroupModelTableDataObjectRef = this.defaultGroupModelTableDataObject;
				else
					this.currentGroupModelTableDataObjectRef = this.adminGroupModelTableDataObject;
				this.currentGroupModelTableDataObjectRef.models = groupsResult;
			}
		} catch (error) {
			console.error('Ошибка при загрузке групп:', error);
		} finally {
			this.isLoadingGroups = false;
		}
	}
	private async loadGroups(){
		try {
			this.isLoading = true;
			const token = AuthService.getToken();
			if(token === null)
				throw new Error("У вас нет токена авторизации");
			if(this.isAdmin) {
				const response = await GroupService.getAllGroups(token);
				if ('error' in response)
					throw new Error(response.error);
				if (Array.isArray(response))
					this.groups = response;
			} else {
				this.router.navigate(['/account']);
				return;
			}
		} catch (error) {
			console.error('Ошибка при загрузке групп', error);
			// TODO: notice
		} finally {
			this.isLoading = false;
			this.cdr.detectChanges();
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
	
	
	
	
	handleClosePasswordModal(): void {
		this.setPasswordModalIsOpen(false);
	}
	async handleConfirmUpdatePassword(passwordData: UpdatePasswordModalModel): Promise<void> {
		try {
			// Здесь должен быть вызов сервиса для обновления пароля
			console.log('Updating password:', passwordData);
			if (passwordData.newPassword !== passwordData.newPasswordConfirm)
				throw new Error('Новый пароль и его подтверждение не совпадают');
			const token = AuthService.getToken();
			if (!token)
				throw new Error('Отсутствует токен авторизации');
			if (!this.user)
				throw new Error('Объект данных пользователя не определён');
			const result = await UserService.updateUserPassword(token, this.user.email, new UpdatePasswordRequest(passwordData.oldPassword, passwordData.newPassword));
			if (result.success)
				alert('Пароль успешно обновлен!');
			else
				console.error(result.error);
			this.setPasswordModalIsOpen(false);

			// TODO: notice
		} catch (error) {
			console.error('Error updating password:', error);
			alert('Ошибка при обновлении пароля');
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
			const token = AuthService.getToken();
			if (!token) throw new Error('Нет токена авторизации');
			if (!this.user) throw new Error('Пользователь не определён');

			const result = await GroupService.addUserToGroup(token, selectedGroupName, this.user.email);
			this.setIsAddAdminToGroupModalOpen(false);

			if (result.success)
				console.log(`Вы успешно добавлены в группу «${selectedGroupName}»`);
			else
				console.error(result.error);
			// TODO: notice
			await this.loadMyGroups();
			await this.loadGroups();
			this.cdr.detectChanges();
		} catch (error) {
			console.error('Ошибка при добавлении себя в группу:', error);
			alert('Не удалось добавить себя в группу. Подробности в консоли.');
		}
	}
}