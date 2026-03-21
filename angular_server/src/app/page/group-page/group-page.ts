import { CommonModule, DatePipe } from '@angular/common';
import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
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

		UpdateGroupModalComponent,
		RedirectionButton
	],
	providers: [
		DatePipe
	],
	templateUrl: './group-page.html',
	styleUrl: './group-page.css',
})
export class GroupPage implements OnInit, OnDestroy {
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
		// другие поля User, которые могут отсутствовать в UserAdminModel – добавьте при необходимости
		} as User));
	}

	currentUserModelTableDataObjectRef?: any;
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
			{header: 'Дата создания', field: (item: UserAdminModel) => this.datePipe.transform(item.createdAt, 'dd.MM.yyyy HH:mm:ss')},
		],
		[],
		{
			actionsHeader: 'Действия',
			actionsConfigs: [
				{
					type: ActionType.LINK,
					label: 'Изменить данные',
					class: 'btn btn-blue',
					href: (item: UserAdminModel) => (!item.email) ? '/users' : `/user/${encodeURIComponent(item.email)}`
				},
				{
					type: ActionType.DATA_ACTION,
					label: 'Исключить',
					class: 'btn btn-red',
					onClick: async (item: UserAdminModel) => { 
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
		private datePipe: DatePipe
	) {}
	
	async ngOnInit(): Promise<void> {
		try{
			await this.checkAuthentication();
			await this.checkAdminStatus();
		} catch (error) {
			console.error('Ошибка аутентификации при загрузке страницы:', error); // TODO: notice
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
			const authResult = await AuthService.checkAuth();
			
			if (authResult.authenticated) {
				console.log('Аутентификация прошла успешно');
				this.isAuthenticated = true;
				this.authorizedUser = authResult.user;
			} else {
				console.log('Аутентификация не пройдена:', authResult.message);
				this.paramSubscription?.unsubscribe();
				this.router.navigate(['/login']);
				return;
			}
		} catch (error) {
			console.error('Ошибка при проверке аутентификации:', error);
			this.paramSubscription?.unsubscribe();
			this.router.navigate(['/login']);
			return;
		} finally {
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
	private async loadGroupData(): Promise<void> {
		try {
			const token = AuthService.getToken();
			if (token === null) throw new Error('У вас нет токена авторизации');

			const response = this.isAdmin
				? await GroupService.getGroupFullDetailsAdmin(token, this.groupName)
				: await GroupService.getGroupFullDetails(token, this.groupName);

			if (response === null) throw new Error('Не удалось загрузить данные группы');
			// Check error
			if ('error' in response) {
				const err = response.error;
				if (typeof err === 'string') throw new Error(err);
				else throw new Error('Unknown error occurred');
			}
			// Check admin
			if (this.isAdmin) {
				const adminData = response as GroupFullDetailsAdminResponse;
				this.group = adminData.group;
				this.currentUserModelTableDataObjectRef = this.adminUserModelTableDataObject;
				this.currentUserModelTableDataObjectRef.models = adminData.group.members;
			} else {
				const userData = response as GroupFullDetailsResponse;
				this.group = userData.group;
				this.currentUserModelTableDataObjectRef = this.defaultUserModelTableDataObject;
				this.currentUserModelTableDataObjectRef.models = userData.group.members;
			}
		} catch (error: any) {
			console.error('Ошибка при загрузки данных группы:', error);
			this.error = error.toString();
			// TODO: notice
		} finally {
		}
	}
	private async loadUsers(){
		try {
			const token = AuthService.getToken();
			if(token === null)
				throw new Error("У вас нет токена авторизации");
			if(this.isAdmin) {
				this.users = (await UserService.readAllUsers(token))
					.users as Array<UserAdminModel>;
			}
		} catch (error) {
			console.error('Ошибка при загрузке пользователей', error);
		} finally {
		}
	}


	public async handleConfirmAddUserToGroupModalComponent(email: string) : Promise<void>{
		try {
			const token = AuthService.getToken();
			if(!token)
				throw new Error('Отсутствует токен авторизации');
			const response = await GroupService.addUserToGroup(token, this.groupName, email);
			if (response.error)
				throw new Error(response.error);
			if (response.success)
				await this.loadGroupData();

			this.isAddUserToGroupModalComponentOpen = false;
			this.cdr.detectChanges();
		} catch (error: any) {
			console.error(error);
			this.error = error.toString();
			// TODO: notice
		}
	}
	public async handleConfirmDeleteGroupModalComponent() : Promise<void>{
		try {
			const token = AuthService.getToken();
			if(!token)
				throw new Error('Отсутствует токен авторизации');
			const response = await GroupService.deleteGroup(token, this.groupName);
			if (response.error)
				throw new Error(response.error);
			if (response.success) {
				this.paramSubscription?.unsubscribe();
				this.router.navigate(['/groups']);
				return;
			}

			this.setIsDeleteGroupModalComponentOpen(false);
			this.cdr.detectChanges();
		} catch (error: any) {
			console.error(error);
			this.error = error.toString();
			// TODO: notice
		}
	}
	public async handleConfirmRemoveUserFromGroupModalComponent() : Promise<void>{
		try {
			if (this.group && this.selectedUserEmail == this.group?.creator.email)
				throw new Error('Вы не можете исключить из группы её создателя');
			const token = AuthService.getToken();
			if(!token)
				throw new Error('Отсутствует токен авторизации');
			if (!this.selectedUserEmail || this.selectedUserEmail=='') {
				this.isRemoveUserFromGroupModalComponentOpen = false;
				this.cdr.detectChanges();
				this.selectedUserEmail = '';
				return;
			}
			const response = await GroupService.removeUserFromGroup(token, this.groupName, this.selectedUserEmail);
			if (response.error)
				throw new Error(response.error);
			if (response.success)
				await this.loadGroupData();

			this.isRemoveUserFromGroupModalComponentOpen = false;
			this.cdr.detectChanges();
		} catch (error: any) {
			console.error(error);
			this.error = error.toString();
			// TODO: notice
		} finally {
			this.selectedUserEmail = '';
			this.isRemoveUserFromGroupModalComponentOpen = false;
		}
	}
	public async handleConfirmUpdateGroupModalComponent(updateGroupModel: GroupUpdateModel) : Promise<void>{
		try {
			const token = AuthService.getToken();
			if(!token)
				throw new Error('Отсутствует токен авторизации');
			const response = await GroupService.updateGroup(token, this.groupName, updateGroupModel);
			if (response.error)
				throw new Error(response.error);
			if (response.success && this.groupName != updateGroupModel.newName){
				this.groupName = updateGroupModel.newName;
				this.paramSubscription?.unsubscribe();
				this.router.navigate([`/group/${encodeURIComponent(this.groupName)}`]);
				return;
			}

			await this.loadGroupData();
			this.isUpdateGroupModalComponentOpen = false;
			this.cdr.detectChanges();
		} catch (error: any) {
			console.error(error);
			this.error = error.toString();
			// TODO: notice
		}
	}
}
