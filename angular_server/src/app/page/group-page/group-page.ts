import { CommonModule, DatePipe } from '@angular/common';
import { ChangeDetectorRef, Component, inject, OnDestroy, OnInit } from '@angular/core';
import { AppHeader } from '../../app-header/app-header';
import { AppFooter } from '../../app-footer/app-footer';
import { LoadingSpinner } from '../../component/loading-spinner/loading-spinner';
import { AddUserToGroupModalComponent } from '../../component/modal/group/add-user-to-group-modal/add-user-to-group-modal';
import { DeleteGroupModalComponent } from '../../component/modal/group/delete-group-modal/delete-group-modal';
import { RemoveUserFromGroupModalComponent } from '../../component/modal/group/remove-user-from-group-modal/remove-user-from-group-modal';
import { UpdateGroupModalComponent } from '../../component/modal/group/update-group-modal/update-group-modal';
import { UserAdminModel } from '../../core/model/user-admin-model';
import { Subscription } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../core/service/auth-service';
import AdminService from '../../core/service/admin-service';
import { GroupService } from '../../core/service/group-service';
import { GroupDetails } from '../../core/model/group-details';
import { GroupFullDetailsAdminResponse, GroupFullDetailsResponse } from '../../core/model/api-response-types';
import { User } from '../../core/model/user';
import { UserService } from '../../core/service/user-service';
import { GroupUpdateModel } from '../../core/model/group-update-model';
import { RedirectionButton } from '../../component/redirection-button/redirection-button';
import { ModelTable } from '../../component/model-table/model-table';
import { ActionType, ModelTableDataObject } from '../../core/model/model-table-types';
import { NoticeService } from '../../core/view-core/service/notice-service';
import { Notification, NotificationType } from '../../core/view-core/model/notification';
import { Title } from '@angular/platform-browser';

@Component({
	selector: 'app-group-page',
	imports: [
		CommonModule,
		AppHeader,
		AppFooter,
		LoadingSpinner,
		AddUserToGroupModalComponent,
		DeleteGroupModalComponent,
		RemoveUserFromGroupModalComponent,

		ModelTable,

		UpdateGroupModalComponent
	],
	providers: [
		DatePipe
	],
	templateUrl: './group-page.html',
	styleUrl: './group-page.css',
})
export class GroupPage implements OnInit, OnDestroy {
	// Title
	private titleService = inject(Title);
	
	public isLoading: boolean = true;
	isAuthenticated: boolean = false;
	authorizedUser?: User;
	isAddUserToGroupModalComponentOpen: boolean = false;
	isDeleteGroupModalComponentOpen: boolean = false;
	isRemoveUserFromGroupModalComponentOpen: boolean = false;
	isUpdateGroupModalComponentOpen: boolean = false;
	users?: Array<User>;
	group?: GroupDetails<UserAdminModel> | GroupDetails<User>;
	groupName: string = '';
	isAdmin: boolean = false;
	private paramSubscription?: Subscription;
	error: string = '';
	selectedUserEmail: string = '';
	get adminGroup(): GroupDetails<UserAdminModel> | undefined {
		return this.isAdmin ? this.group as GroupDetails<UserAdminModel> : undefined;
	}
	get allUsersForModal(): User[] {
		return (this.users || []).map(u => ({
		email: u.email,
		name: u.name,
		surname: u.surname,
		patronymic: u.patronymic,
		// Other User fields, which can be not exitsts in UserAdminModel
		} as User));
	}

	currentUserModelTableDataObjectRef: any;
	defaultUserModelTableDataObject: ModelTableDataObject<User> = new ModelTableDataObject<User>(
		[
			{header: 'Фамилия', field: 'surname'},
			{header: 'Имя', field: 'name'},
			{header: 'Отчество', field: 'patronymic'},
			{header: 'Почта', field: 'email'},
		],
		[]
	);
	adminUserModelTableDataObject: ModelTableDataObject<UserAdminModel> = new ModelTableDataObject<UserAdminModel>(
		[
			{header: 'Фамилия', field: 'surname'},
			{header: 'Имя', field: 'name'},
			{header: 'Отчество', field: 'patronymic'},
			{header: 'Почта', field: 'email'},
			{header: 'Дата создания', field: (item: UserAdminModel) => this.datePipe.transform(item.createdAt, 'dd.MM.yyyy HH:mm:ss'), sortField: 'createdAt'},
		],
		[],
		{
			actionsHeader: 'Действия',
			actionsConfigs: [
				{
					type: ActionType.LINK,
					label: 'Изменить данные',
					class: 'btn btn-blue',
					href: (item: UserAdminModel) =>
						(!item.email) ?
						'/users' :
						`/user/${encodeURI(item.email)}`
				},
				{
					type: ActionType.ACTION,
					label: 'Исключить',
					class: 'btn btn-red',
					onClick: (item: UserAdminModel) => {
						this.selectedUserEmail = item.email;
						this.setIsRemoveUserFromGroupModalComponentOpen(true); 
					}
				}
			]
		}
	);


	onRemoveUser(email: string): void {
		this.selectedUserEmail = email;
		this.setIsRemoveUserFromGroupModalComponentOpen(true);
	}


	setIsAddUserToGroupModalComponentOpen(status: boolean){
		this.isAddUserToGroupModalComponentOpen = status;
	}
	setIsDeleteGroupModalComponentOpen(status: boolean){
		this.isDeleteGroupModalComponentOpen = status;
	}
	setIsRemoveUserFromGroupModalComponentOpen(status: boolean){
		this.isRemoveUserFromGroupModalComponentOpen = status;
	}
	setIsUpdateGroupModalComponentOpen(status: boolean){
		this.isUpdateGroupModalComponentOpen = status;
	}


	constructor(
		private router: Router,
		private cdr: ChangeDetectorRef,
		private route: ActivatedRoute,
		private datePipe: DatePipe,

		private authService: AuthService,
		private adminService: AdminService,
		private groupService: GroupService,
		private userService: UserService,


		private noticeService: NoticeService
	) {}
	
	async ngOnInit(): Promise<void> {
		try{
			await this.checkAuthentication();
			await this.checkAdminStatus();
		} catch (error) {
			console.error('Ошибка аутентификации при загрузке страницы:', error);
			this.noticeService.addNotification(new Notification(NotificationType.Error, `Ошибка аутентификации при загрузке страницы: '${(error as Error).message}'`));
		}
		try{
			this.paramSubscription = this.route.paramMap.subscribe(params => {
				this.groupName = params.get('name') || '';
				if(this.groupName == '') {
					this.paramSubscription?.unsubscribe();
					this.router.navigate(['/account']);
					return;
				}
			});
			await Promise.all([this.loadGroupData(), this.loadUsers()]);
		} catch (error) {
			this.noticeService.addNotification(new Notification(NotificationType.Error, `Ошибка аутентификации при загрузке страницы: '${(error as Error).message}'`));
		} finally {
			this.isLoading = false;
			this.cdr.detectChanges();
		}

		this.titleService.setTitle(`Группа '${this.groupName}'`);
	}
	ngOnDestroy(): void {
		this.paramSubscription?.unsubscribe();
	}




	private async checkAuthentication(): Promise<void> {
		try {
			const authResult = await this.authService.checkAuth();
			
			if (!authResult.success || !authResult.data?.authenticated) {
				console.error('Аутентификация не пройдена:', authResult.error);
				this.paramSubscription?.unsubscribe();
				this.router.navigate(['/login']);
				return;
			} else	{
				console.log('Аутентификация прошла успешно');
				this.isAuthenticated = true;
				this.authorizedUser = authResult.data?.user;
			}
		} catch (error) {
			console.error('Ошибка при проверке аутентификации:', error);
			this.noticeService.addNotification(new Notification(NotificationType.Error, `Ошибка при проверке аутентификации: '${(error as Error).message}'`));
			this.paramSubscription?.unsubscribe();
			this.router.navigate(['/login']);
			return;
		} finally {
			this.cdr.detectChanges();
		}
	}
	private async checkAdminStatus(): Promise<void> {
		try {
			const token = AuthService.getToken();
			if(token === null)
				throw "У вас нет токена авторизации";
			const result = await this.adminService.isAdmin(token);
			if (result.success) {
				this.isAdmin = result.data!.isAdmin;
				this.cdr.detectChanges();
			}
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
	private async loadGroupData(): Promise<void> {
		try {
			const token = AuthService.getToken();
			if (token === null) throw new Error('У вас нет токена авторизации');

			const response = this.isAdmin
				? await this.groupService.getGroupFullDetailsAdmin(token, this.groupName)
				: await this.groupService.getGroupFullDetails(token, this.groupName);

			if (!response.success) throw new Error(response.error);
			// Check admin
			if (this.isAdmin) {
				const adminData = response.data as GroupFullDetailsAdminResponse;
				this.group = adminData.group;
				this.currentUserModelTableDataObjectRef = this.adminUserModelTableDataObject;
				this.currentUserModelTableDataObjectRef.models = adminData.group.members;
			} else {
				const userData = response.data as GroupFullDetailsResponse;
				this.group = userData.group;
				this.currentUserModelTableDataObjectRef = this.defaultUserModelTableDataObject;
				this.currentUserModelTableDataObjectRef.models = userData.group.members;
			}
		} catch (error) {
			console.error('Ошибка при загрузки данных группы:', error);
			this.error = (error as Error).message;
			this.noticeService.addNotification(new Notification(NotificationType.Error, `Ошибка при загрузки данных группы: '${(error as Error).message}'`));
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
		}
	}


	public async handleConfirmAddUserToGroupModalComponent(email: string) : Promise<void>{
		try {
			const token = AuthService.getToken();
			if(!token)
				throw new Error('Отсутствует токен авторизации');
			const response = await this.groupService.addUserToGroup(token, this.groupName, email);
			if (response.error)
				throw new Error(response.error);
			if (response.success)
				await this.loadGroupData();

			this.isAddUserToGroupModalComponentOpen = false;
			this.cdr.detectChanges();
			this.noticeService.addNotification(new Notification(NotificationType.Success, `Пользователь с почтой "${email}" был добавлен в группу "${this.groupName}"`));
		} catch (error) {
			console.error(error);
			this.error = (error as Error).message;
			this.noticeService.addNotification(new Notification(NotificationType.Error, (error as Error).message));
		}
	}
	public async handleConfirmDeleteGroupModalComponent() : Promise<void>{
		try {
			const token = AuthService.getToken();
			if(!token)
				throw new Error('Отсутствует токен авторизации');
			const response = await this.groupService.deleteGroup(token, this.groupName);
			if (response.error)
				throw new Error(response.error);
			if (response.success) {
				this.paramSubscription?.unsubscribe();
				this.router.navigate(['/groups']);
				return;
			}

			this.setIsDeleteGroupModalComponentOpen(false);
			this.cdr.detectChanges();
		} catch (error) {
			console.error(error);
			this.error = (error as Error).message;
			this.noticeService.addNotification(new Notification(NotificationType.Error, (error as Error).message));
		}
	}
	public async handleConfirmRemoveUserFromGroupModalComponent() : Promise<void>{
		try {
			const selectedUserEmail = this.selectedUserEmail;
			if (this.group && this.selectedUserEmail == this.group?.head.email)
				throw new Error('Вы не можете исключить из группы её главу');
			const token = AuthService.getToken();
			if(!token)
				throw new Error('Отсутствует токен авторизации');
			if (!this.selectedUserEmail || this.selectedUserEmail=='') {
				this.selectedUserEmail = '';
				this.cdr.detectChanges();
				return;
			}
			const response = await this.groupService.removeUserFromGroup(token, this.groupName, this.selectedUserEmail);
			if (response.error)
				throw new Error(response.error);
			if (response.success)
				await this.loadGroupData();
			this.noticeService.addNotification(new Notification(NotificationType.Success, `Пользователь с почтой "${selectedUserEmail}" был исключён из группы`));
		} catch (error) {
			console.error(error);
			this.error = (error as Error).message;
			this.noticeService.addNotification(new Notification(NotificationType.Error, (error as Error).message));
		} finally {
			this.selectedUserEmail = '';
			this.isRemoveUserFromGroupModalComponentOpen = false;
			this.cdr.detectChanges();
		}
	}
	public async handleConfirmUpdateGroupModalComponent(updateGroupModel: GroupUpdateModel) : Promise<void>{
		try {
			const token = AuthService.getToken();
			if(!token)
				throw new Error('Отсутствует токен авторизации');
			const response = await this.groupService.updateGroup(token, this.groupName, updateGroupModel);
			if (response.error)
				throw new Error(response.error);
			if (response.success && this.groupName != updateGroupModel.newName){
				this.groupName = updateGroupModel.newName;
				this.isUpdateGroupModalComponentOpen = false;
				this.router.navigate([`/group/${this.groupName}`]);
				await this.loadGroupData();
				this.cdr.detectChanges();
				return;
			}

			await this.loadGroupData();
			this.isUpdateGroupModalComponentOpen = false;
			this.cdr.detectChanges();
			this.noticeService.addNotification(new Notification(NotificationType.Success, 'Данные группы успешно обновлены'));
		} catch (error) {
			console.error(error);
			this.error = (error as Error).message;
			this.noticeService.addNotification(new Notification(NotificationType.Error, (error as Error).message));
		}
	}
}
