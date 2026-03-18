import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
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
		private cdr: ChangeDetectorRef
	) {}

	async ngOnInit(): Promise<void> {
		try {
			await this.checkAuthentication();
			await this.checkAdminStatus();
			await this.loadGroups();
			await this.loadUsers();
		} catch (error) {
			console.error('Ошибка при загрузке страницы:', error);
			// TODO: notice
		}
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
			this.isLoading = true;
			const token = AuthService.getToken();
			if(token === null)
				throw new Error("У вас нет токена авторизации");
			const isAdmin = await AdminService.isAdmin(token);
			if (!isAdmin)
				this.router.navigate(['/account']);
			else
				this.isAdmin = isAdmin;
		} catch (error) {
			console.error('Ошибка при проверке статуса администратора:', error);
			this.isAdmin = false;
			Promise.resolve().then(()=>{this.router.navigate(['/account']);});
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
				{
					this.groups = response;
					this.currentGroupModelTableDataObject.models = response;
				}
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

	private async loadUsers(){
		try {
			this.isLoading = true;
			const token = AuthService.getToken();
			if(token === null)
				throw new Error("У вас нет токена авторизации");
			if(this.isAdmin) {
				this.users = (await UserService.readAllUsers(token))
					.users as Array<UserAdminModel>;
			}
		} catch (error) {
			console.error('Ошибка при загрузке пользователей', error);
			// TODO: notice
		} finally {
			this.isLoading = false;
			this.cdr.detectChanges();
		}
	}


	public async handleConfirmCreateGroup(groupData: GroupCreateModel) : Promise<void>{
		try {
			const token = AuthService.getToken();
			if (!token)
				throw new Error('Отсутствует токен авторизации');
			const response = await GroupService.createGroup(token, groupData);
			if (!response.success)
				throw new Error('Не удалось создать группу');

			this.setIsCreateGroupModalComponentOpen(false);
			await this.loadGroups();
			this.cdr.detectChanges();
		} catch (error: any) {
			console.error('Error updating password:', error);
			this.error = error.toString();
			// TODO: notice
		}
	}


	public setIsCreateGroupModalComponentOpen(status: boolean){
		this.isCreateGroupModalComponentOpen = status;
	}
}
