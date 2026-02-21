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
import { GroupUpdateModel } from '../../core/model/group-update-model';
import { RedirectionButton } from '../../component/redirection-button/redirection-button';

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
		UserTableGroupPage,
		RedirectionButton
	],
	templateUrl: './group-page.html',
	styleUrl: './group-page.css',
})
export class GroupPage implements OnInit {
	public isLoading: boolean = true;
	isAuthenticated: boolean = false;
	authorizedUser?: User;
	isAddUserToGroupModalComponentOpen: boolean = false;
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
		try{
			await this.checkAuthentication();
		} catch (error) {
			console.error('Ошибка при загрузке страницы:', error); // TODO: notice
		}
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
			}
		} catch (error) {
			console.error('Ошибка при проверке аутентификации:', error);
			this.router.navigate(['/login']);
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


	public async handleConfirmAddUserToGroupModalComponent(email: string) : Promise<void>{
		try {
			const token = AuthService.getToken();
			if(!token)
				throw Error('Отсутствует токен авторизации');
			const response = await GroupService.addUserToGroup(token, this.groupName, email);
			if (response.error)
				throw Error(response.error);
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
				throw Error('Отсутствует токен авторизации');
			const response = await GroupService.deleteGroup(token, this.groupName);
			if (response.error)
				throw Error(response.error);
			if (response.success)
				this.router.navigate(['/groups']);

			this.isDeleteGroupModalComponentOpen = false;
			this.cdr.detectChanges();
		} catch (error: any) {
			console.error(error);
			this.error = error.toString();
			// TODO: notice
		}
	}
	public async handleConfirmRemoveUserFromGroupModalComponent() : Promise<void>{
		try {
			if (this.selectedUserEmail == this.group?.creator.email)
				throw Error('Вы не можете исключить из группы её создателя');
			const token = AuthService.getToken();
			if(!token)
				throw Error('Отсутствует токен авторизации');
			if (!this.selectedUserEmail || this.selectedUserEmail=='') {
				this.isRemoveUserFromGroupModalComponentOpen = false;
				this.cdr.detectChanges();
				return;
			}
			const response = await GroupService.removeUserFromGroup(token, this.groupName, this.selectedUserEmail);
			if (response.error)
				throw Error(response.error);
			if (response.success)
				await this.loadGroupData();

			this.isRemoveUserFromGroupModalComponentOpen = false;
			this.cdr.detectChanges();
		} catch (error: any) {
			console.error(error);
			this.error = error.toString();
			// TODO: notice
		}
	}
	public async handleConfirmUpdateGroupModalComponent(updateGroupModel: GroupUpdateModel) : Promise<void>{
		try {
			const token = AuthService.getToken();
			if(!token)
				throw Error('Отсутствует токен авторизации');
			const response = await GroupService.updateGroup(token, this.groupName, updateGroupModel);
			if (response.error)
				throw Error(response.error);
			if (response.success && this.groupName != updateGroupModel.newName){
				this.groupName = updateGroupModel.newName;
				this.router.navigate([`/group/${encodeURIComponent(this.groupName)}`]);
				await Promise.all([this.loadGroupData(), this.loadUsers()]);
			}

			this.isUpdateGroupModalComponentOpen = false;
			this.cdr.detectChanges();
		} catch (error: any) {
			console.error(error);
			this.error = error.toString();
			// TODO: notice
		}
	}
}
