import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { AppHeader } from '../../app-header/app-header';
import { AppFooter } from '../../app-footer/app-footer';
import { LoadingSpinner } from '../../component/loading-spinner/loading-spinner';
import { AddUserToGroupModalComponent } from '../../component/modal/group/add-user-to-group-modal/add-user-to-group-modal';
import { CreateGroupModalComponent } from '../../component/modal/group/create-group-modal/create-group-modal';
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
import { UserModelAdminResponse } from '../../core/model/user-model-admin-response';
import { User } from '../../core/model/user';
import { UserTable } from "../../component/user-table/user-table";
import { UserTableGroupPage } from '../../component/user-table-group-page/user-table-group-page';
import { UserService } from '../../core/service/user-service';

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
	UpdateGroupModalComponent,
	UserTable,
	UserTableGroupPage
],
	templateUrl: './group-page.html',
	styleUrl: './group-page.css',
})
export class GroupPage implements OnInit {
	public isLoading: boolean = true;
	isAddUserToGroupModalComponentOpen: boolean = false;
	isCreateGroupModalComponentOpen: boolean = false;
	isDeleteGroupModalComponentOpen: boolean = false;
	isRemoveUserFromGroupModalComponentOpen: boolean = false;
	isUpdateGroupModalComponentOpen: boolean = false;
	users?: Array<User>;
	group?: GroupDetails<UserModelAdminResponse> | GroupDetails<User>;
	groupName: string = '';
	isAdmin: boolean = false;
	private paramSubscription?: Subscription;
	error: string = '';
	selectedUserEmail: string = '';
	get adminGroup(): GroupDetails<UserModelAdminResponse> | undefined {
		return this.isAdmin ? this.group as GroupDetails<UserModelAdminResponse> : undefined;
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
	onRemoveUser(email: string): void {
		this.selectedUserEmail = email;
		this.setIsRemoveUserFromGroupModalComponentOpen(true);
	}


	setIsAddUserToGroupModalComponentOpen(status: boolean){
		this.isAddUserToGroupModalComponentOpen = status;
	}
	setIsCreateGroupModalComponentOpen(status: boolean){
		this.isCreateGroupModalComponentOpen = status;
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
		private route: ActivatedRoute
	) {}
	
	async ngOnInit(): Promise<void> {
		this.paramSubscription = this.route.paramMap.subscribe(params => {
			this.groupName = params.get('name') || '';
			if(this.groupName == '')
				this.router.navigate(['/account']);
		});
		try{
			await this.checkAdminStatus();
			await Promise.all([this.loadGroupData(), this.loadUsers()]);
			this.isLoading = false;
		} catch (error) {
			// TODO: notice
		} finally {
			this.cdr.detectChanges();
		}
	}
	ngOnDestroy(): void {
		this.paramSubscription?.unsubscribe();
	}




	private async checkAdminStatus(): Promise<void> {
		try {
			const token = AuthService.getToken();
			if(token === null)
				throw "У вас нет токена авторизации";
			const isAdmin = await AdminService.isAdmin(token);
			this.isAdmin = isAdmin;
		} catch (error) {
			console.error('Ошибка при проверке статуса администратора:', error);
			// TODO: notice
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
				console.log(adminData.group.creator.createdAt);
				this.group = adminData.group;
			} else {
				const userData = response as GroupFullDetailsResponse;
				console.log(userData.group.creator.email);
				this.group = userData.group;
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
				throw "У вас нет токена авторизации";
			if(this.isAdmin) {
				this.users = (await UserService.readAllUsers(token))
					.users as Array<UserAdminModel>;
			}
		} catch (error) {
			console.error('Ошибка при загрузке пользователей', error);
		} finally {
		}
	}
}
