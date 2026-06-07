import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

// Components
import { AppHeader } from '../../app-header/app-header';
import { AppFooter } from '../../app-footer/app-footer';
import { LoadingSpinner } from '../../component/loading-spinner/loading-spinner';
import { RedirectionButton } from '../../component/redirection-button/redirection-button';
import { ModelTable } from '../../component/model-table/model-table';

// Services and models
import { AuthService } from '../../core/service/auth-service';
import { AdminService } from '../../core/service/admin-service';
import { GroupService } from '../../core/service/group-service';
import { User } from '../../core/model/user';
import { UserService } from '../../core/service/user-service';
import { GroupBasicInfo } from '../../core/model/group_basic_info';
import { GroupCreateModel } from '../../core/model/group-create-model';
import { CreateGroupModalComponent } from '../../component/modal/group/create-group-modal/create-group-modal';
import { UserAdminModel } from '../../core/model/user-admin-model';
import { ActionType, ModelTableDataObject } from '../../core/model/model-table-types';
import { NoticeService } from '../../core/view-core/service/notice-service';
import { Notification, NotificationType } from '../../core/view-core/model/notification';
import { Title } from '@angular/platform-browser';

@Component({
	selector: 'app-groups-page',
	imports: [
		CommonModule,
		AppHeader,
		AppFooter,
		LoadingSpinner,

		ModelTable,

		CreateGroupModalComponent,
		RedirectionButton
	],
	templateUrl: './groups-page.html',
	styleUrl: './groups-page.css',
})
export class GroupsPage implements OnInit {
	// Title
	private titleService = inject(Title);
	
	public isLoading: boolean = true;
	isCreateGroupModalComponentOpen: boolean = false;
	isAdmin: boolean = false;
	groups: Array<GroupBasicInfo>=[];
	users: Array<UserAdminModel>=[];
	error: string = '';
	isAuthenticated: boolean = false;
	authorizedUser?: User;
	currentGroupModelTableDataObject:		ModelTableDataObject<GroupBasicInfo> = new ModelTableDataObject(
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
		private cdr: ChangeDetectorRef,

		private authService: AuthService,
		private adminService: AdminService,
		private groupService: GroupService,
		private userService: UserService,


		private noticeService: NoticeService
	) {}

	async ngOnInit(): Promise<void> {
		this.titleService.setTitle('Группы');

		try {
			await this.checkAuthentication();
			await this.checkAdminStatus();
			await this.loadGroups();
			await this.loadUsers();
		} catch (error) {
			console.error('Ошибка при загрузке страницы:', error);
			this.noticeService.addNotification(new Notification(NotificationType.Error, `Ошибка при загрузке страницы: '${(error as Error).message}'`));
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
			this.noticeService.addNotification(new Notification(NotificationType.Error, `Ошибка при проверке аутентификации: '${(error as Error).message}'`));
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
			this.noticeService.addNotification(new Notification(NotificationType.Error, `Ошибка при проверке статуса администратора: '${(error as Error).message}'`));
			this.isAdmin = false;
			Promise.resolve().then(()=>{this.router.navigate(['/account']);});
		}
	}


	private async loadGroups(){
		try {
			const token = AuthService.getToken();
			if(token === null)
				throw new Error("У вас нет токена авторизации");
			if(this.isAdmin) {
				const response = await this.groupService.getAllGroups(token);
				if (!response.success)
					throw new Error(response.error);
				if (Array.isArray(response.data)) {
					this.groups = response.data;
					this.currentGroupModelTableDataObject.models = response.data;
				}
			} else {
				this.router.navigate(['/account']);
				return;
			}
		} catch (error) {
			console.error('Ошибка при загрузке групп', error);
			this.noticeService.addNotification(new Notification(NotificationType.Error, `Ошибка при загрузке групп: '${(error as Error).message}'`));
		} finally {
			this.cdr.detectChanges();
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
				this.users = response.data?.users as Array<UserAdminModel>;
			}
		} catch (error) {
			console.error('Ошибка при загрузке пользователей', error);
			this.noticeService.addNotification(new Notification(NotificationType.Error, `Ошибка при загрузке пользователей: '${(error as Error).message}'`));
		} finally {
			this.cdr.detectChanges();
		}
	}


	public async handleConfirmCreateGroup(groupData: GroupCreateModel) : Promise<void>{
		try {
			this.isLoading = true;

			const token = AuthService.getToken();
			if (!token)
				throw new Error('Отсутствует токен авторизации');
			const response = await this.groupService.createGroup(token, groupData);
			if (!response.success)
				throw new Error('Не удалось создать группу');

			await this.loadGroups();
			this.setIsCreateGroupModalComponentOpen(false);
			this.noticeService.addNotification(new Notification(NotificationType.Success, `Группа "${groupData.name}" успешно создана`));
		} catch (error) {
			console.error('Error updating password:', error);
			this.error = (error as Error).message;
			this.noticeService.addNotification(new Notification(NotificationType.Error, `Ошибка при создании группы: ${(error as Error).message}`));
		} finally {
			this.isLoading = false;
			this.cdr.detectChanges();
		}
	}


	public setIsCreateGroupModalComponentOpen(status: boolean){
		this.isCreateGroupModalComponentOpen = status;
	}
}
