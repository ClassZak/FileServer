import { Component, OnInit, ChangeDetectorRef, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { AppHeader } from '../../app-header/app-header';
import { AppFooter } from '../../app-footer/app-footer';
import { LoadingSpinner } from '../../component/loading-spinner/loading-spinner';
import { AuthService } from '../../core/service/auth-service';
import { AdminService } from '../../core/service/admin-service';
import { FileService, FolderPermissionInfo, FilePermissionInfo, PermissionInfo, SetPermissionRequest } from '../../core/service/file-service';
import { UserService } from '../../core/service/user-service';
import { GroupService } from '../../core/service/group-service';
import { UserAdminModel } from '../../core/model/user-admin-model';
import { GroupBasicInfo } from '../../core/model/group_basic_info';
import { NoticeService } from '../../core/view-core/service/notice-service';
import { Notification, NotificationType } from '../../core/view-core/model/notification';
import { ActionType, ModelTableDataObject } from '../../core/model/model-table-types';
import { ModelTable } from '../../component/model-table/model-table';
import { parentPath } from '../../core/model/history-info';
import { RedirectionButton } from "../../component/redirection-button/redirection-button";
import { Title } from '@angular/platform-browser';

@Component({
	selector: 'app-permissions-page',
	standalone: true,
	imports: [
	CommonModule,
	FormsModule,
	RouterModule,
	AppHeader,
	AppFooter,
	LoadingSpinner,
	ModelTable
],
	templateUrl: './permissions-page.html',
	styleUrls: ['./permissions-page.css']
})
export class PermissionsPage implements OnInit, OnDestroy {
	// Title
	private titleService = inject(Title);
	
	isLoading = true;
	isAdmin = false;

	// ---------- Section 1: permissions on a specific path ----------
	targetType: 'folder' | 'file' = 'folder';
	path: string = '';
	currentPermissions: (FolderPermissionInfo | FilePermissionInfo)[] = [];

	// Add/update permission form
	permissionType: 'user' | 'group' = 'user';
	userEmail: string = '';
	groupName: string = '';
	mode: number = 5;

	// Selects filtering
	userSearchFilter: string = '';
	groupSearchFilter: string = '';
	filteredUsersForSelect: UserAdminModel[] = [];
	filteredGroupsForSelect: GroupBasicInfo[] = [];
	allUsers: UserAdminModel[] = [];
	allGroups: GroupBasicInfo[] = [];

	// Table for current permissions (with delete action)
	currentPermissionsTable: ModelTableDataObject<any> = new ModelTableDataObject(
		[
			{ header: 'Субъект', field: (item: any) => item.userEmail || item.groupName },
			{ header: 'Маска (0-15)', field: 'mode' }
		],
		[],
		{
			actionsHeader: 'Действия',
			actionsConfigs: [
				{
					type: ActionType.LINK,
					label: 'Перейти',
					class: 'btn btn-blue',
					href: (item: any) => `/files/${item.path || this.path}`
				},
				{
					type: ActionType.ACTION,
					label: 'Удалить',
					class: 'btn btn-red',
					onClick: (perm: any) => this.deletePermission(perm)
				}
			]
		}
	);

	// ---------- Section 2: view all permissions of a user/group ----------
	viewType: 'user' | 'group' = 'user';
	viewUserEmail: string = '';      // empty = all users
	viewGroupName: string = '';      // empty = all groups
	viewPermissions: PermissionInfo[] = [];

	viewUserSearchFilter: string = '';
	viewGroupSearchFilter: string = '';
	filteredViewUsers: UserAdminModel[] = [];
	filteredViewGroups: GroupBasicInfo[] = [];

	// Table for view permissions (read‑only, no actions)
	viewPermissionsTable: ModelTableDataObject<PermissionInfo> = new ModelTableDataObject(
		[
			{ header: 'Тип', field: (item: PermissionInfo) => item.type === 'folder' ? 'Папка' : 'Файл' },
			{
				header: 'Путь',
				field: 'path',
				icon: (item: PermissionInfo) => item.type === 'folder' ? 'matfFolderOpenColored' : 'matfDocumentColored'
			},
			{ header: 'Маска (0-15)', field: 'mode' }
		],
		[],
		{
			actionsHeader: 'Действия',
			actionsConfigs: [
				{
					type: ActionType.LINK,
					label: 'Перейти',
					class: 'btn btn-blue',
					href: (item: PermissionInfo) => `/files/${item.type === 'folder' ? item.path : parentPath(item.path)}`
				}
			]
		}
	);

	// Flag to prevent full page reload when only one section reloads
	private loadingPermissions = false;
	private loadingView = false;

	private querySub?: Subscription;

	constructor(
		private router: Router,
		private route: ActivatedRoute,
		private cdr: ChangeDetectorRef,
		private authService: AuthService,
		private adminService: AdminService,
		private fileService: FileService,
		private userService: UserService,
		private groupService: GroupService,
		private noticeService: NoticeService
	) {}

	async ngOnInit(): Promise<void> {
		this.titleService.setTitle('Права');
		try {
			await this.checkAuth();
			if (!this.isAdmin) {
				this.router.navigate(['/account']);
				return;
			}
			await this.loadUsersAndGroups();

			this.querySub = this.route.queryParamMap.subscribe(async params => {
				// Section 1
				this.targetType = (params.get('targetType') as 'folder' | 'file') || 'folder';
				this.path = params.get('path') || '';
				this.permissionType = (params.get('permType') as 'user' | 'group') || 'user';
				this.userEmail = params.get('userEmail') || '';
				this.groupName = params.get('groupName') || '';
				this.mode = params.get('mode') ? parseInt(params.get('mode')!) : 5;

				// Section 2
				this.viewType = (params.get('viewType') as 'user' | 'group') || 'user';
				this.viewUserEmail = params.get('viewUserEmail') || '';
				this.viewGroupName = params.get('viewGroupName') || '';

				this.applyFiltersToSelects();
				this.applyFiltersToViewSelects();

				// Load data without global loading indicator
				if (!this.loadingPermissions) {
					this.loadPermissions().catch(console.warn);
				}
				if (!this.loadingView) {
					this.loadViewPermissions().catch(console.warn);
				}
			});
		} catch (error) {
			console.error(error);
			this.noticeService.addNotificationErrorTypeByMessage(`Ошибка авторизации ${(error as Error).message}`);
		} finally {
			this.isLoading = false;
			this.cdr.detectChanges();
		}
	}

	ngOnDestroy(): void {
		this.querySub?.unsubscribe();
	}

	private async checkAuth(): Promise<void> {
		const authResult = await this.authService.checkAuth();
		if (!authResult.success || !authResult.data?.authenticated) {
			this.router.navigate(['/login']);
			throw new Error('Not authenticated');
		}
		const token = AuthService.getToken();
		if (!token) throw new Error('No token');
		const adminCheck = await this.adminService.isAdmin(token);
		this.isAdmin = adminCheck.success && adminCheck.data?.isAdmin === true;
		this.cdr.detectChanges();
		if (!this.isAdmin) throw new Error('Необходимы права пользователя');
	}

	private async loadUsersAndGroups(): Promise<void> {
		const token = AuthService.getToken();
		if (!token) return;

		const usersRes = await this.userService.readAllUsers(token);
		if (usersRes.success && usersRes.data?.users) {
			this.allUsers = usersRes.data.users;
		}
		const groupsRes = await this.groupService.getAllGroups(token);
		if (groupsRes.success && groupsRes.data) {
			this.allGroups = groupsRes.data;
		}
		this.applyFiltersToSelects();
		this.applyFiltersToViewSelects();
	}

	// Filtering for edit section selects
	applyFiltersToSelects(): void {
		const userFilter = this.userSearchFilter.toLowerCase();
		this.filteredUsersForSelect = this.allUsers.filter(u =>
			u.email.toLowerCase().includes(userFilter) ||
			(u.surname && u.surname.toLowerCase().includes(userFilter)) ||
			(u.name && u.name.toLowerCase().includes(userFilter))
		);
		if (this.filteredUsersForSelect && this.filteredUsersForSelect.length > 0)
			this.userEmail = this.filteredUsersForSelect[0].email;

		const groupFilter = this.groupSearchFilter.toLowerCase();
		this.filteredGroupsForSelect = this.allGroups.filter(g =>
			g.name.toLowerCase().includes(groupFilter)
		);
		if (this.filteredGroupsForSelect && this.filteredGroupsForSelect.length > 0)
			this.groupName = this.filteredGroupsForSelect[0].name;
	}

	applyFiltersToViewSelects(): void {
		const userFilter = this.viewUserSearchFilter.toLowerCase();
		this.filteredViewUsers = this.allUsers.filter(u =>
			u.email.toLowerCase().includes(userFilter) ||
			(u.surname && u.surname.toLowerCase().includes(userFilter)) ||
			(u.name && u.name.toLowerCase().includes(userFilter))
		);
		const groupFilter = this.viewGroupSearchFilter.toLowerCase();
		this.filteredViewGroups = this.allGroups.filter(g =>
			g.name.toLowerCase().includes(groupFilter)
		);
	}

	private updateUrl(): void {
		const queryParams: any = {
			targetType: this.targetType,
			path: this.path,
			permType: this.permissionType,
			mode: this.mode,
			viewType: this.viewType
		};
		if (this.userEmail) queryParams.userEmail = this.userEmail;
		if (this.groupName) queryParams.groupName = this.groupName;
		if (this.viewUserEmail) queryParams.viewUserEmail = this.viewUserEmail;
		if (this.viewGroupName) queryParams.viewGroupName = this.viewGroupName;

		this.router.navigate([], {
			relativeTo: this.route,
			queryParams,
			replaceUrl: true
		});
	}

	// ---------- Section 1 methods ----------
	async loadPermissions(): Promise<void> {
		if (!this.path.trim()) {
			this.currentPermissions = [];
			this.currentPermissionsTable.models = [];
			this.updateUrl();
			return;
		}
		this.loadingPermissions = true;
		try {
			const token = AuthService.getToken();
			if (!token) return;
			let res;
			if (this.targetType === 'folder') {
				res = await this.fileService.getFolderPermissions(token, this.path);
			} else {
				res = await this.fileService.getFilePermissions(token, this.path);
			}
			if (res.success && res.data) {
				this.currentPermissions = res.data;
				this.currentPermissionsTable.models = this.currentPermissions;
			} else {
				throw new Error(res.error);
			}
		} catch (error) {
			this.noticeService.addNotification(new Notification(NotificationType.Error, (error as Error).message));
			this.currentPermissions = [];
			this.currentPermissionsTable.models = [];
		} finally {
			this.loadingPermissions = false;
			this.updateUrl();
			this.cdr.detectChanges();
		}
	}

	async addPermission(): Promise<void> {
		if (!this.path.trim()) {
			this.noticeService.addNotification(new Notification(NotificationType.Warning, 'Введите путь'));
			return;
		}
		if (this.permissionType === 'user' && !this.userEmail) {
			this.noticeService.addNotification(new Notification(NotificationType.Warning, 'Выберите пользователя'));
			return;
		}
		if (this.permissionType === 'group' && !this.groupName) {
			this.noticeService.addNotification(new Notification(NotificationType.Warning, 'Выберите группу'));
			return;
		}
		const token = AuthService.getToken();
		if (!token) return;

		const request: SetPermissionRequest = {
			path: this.path,
			userEmail: this.permissionType === 'user' ? this.userEmail : null,
			groupName: this.permissionType === 'group' ? this.groupName : null,
			mode: this.mode
		};

		try {
			let result;
			if (this.targetType === 'folder') {
				result = await this.fileService.setFolderPermission(token, request);
			} else {
				result = await this.fileService.setFilePermission(token, request);
			}
			if (result.success) {
				this.noticeService.addNotification(new Notification(NotificationType.Success, 'Право добавлено/обновлено'));
				await this.loadPermissions();
			} else {
				throw new Error(result.error);
			}
		} catch (error) {
			this.noticeService.addNotification(new Notification(NotificationType.Error, (error as Error).message));
		}
	}

	async deletePermission(perm: FolderPermissionInfo | FilePermissionInfo): Promise<void> {
		const token = AuthService.getToken();
		if (!token) return;
		try {
			let result;
			if (this.targetType === 'folder') {
				result = await this.fileService.deleteFolderPermission(
					token,
					this.path,
					perm.userEmail || undefined,
					perm.groupName || undefined
				);
			} else {
				result = await this.fileService.deleteFilePermission(
					token,
					this.path,
					perm.userEmail || undefined,
					perm.groupName || undefined
				);
			}
			if (result.success) {
				this.noticeService.addNotification(new Notification(NotificationType.Success, 'Право удалено'));
				await this.loadPermissions();
			} else {
				throw new Error(result.error);
			}
		} catch (error) {
			this.noticeService.addNotification(new Notification(NotificationType.Error, (error as Error).message));
		}
	}

	// ---------- Section 2 methods ----------
	async loadViewPermissions(): Promise<void> {
		this.loadingView = true;
		try {
			const token = AuthService.getToken();
			if (!token) return;
			if (this.viewType === 'user') {
				if (!this.viewUserEmail) {
					await this.loadAllUsersPermissions(token);
				} else {
					const res = await this.fileService.getUserPermissions(token, this.viewUserEmail);
					if (res.success && res.data) {
						this.viewPermissions = res.data;
						this.viewPermissionsTable.models = this.viewPermissions;
					} else {
						throw new Error(res.error);
					}
				}
			} else if (this.viewType === 'group') {
				if (!this.viewGroupName) {
					await this.loadAllGroupsPermissions(token);
				} else {
					const res = await this.fileService.getGroupPermissions(token, this.viewGroupName);
					if (res.success && res.data) {
						this.viewPermissions = res.data;
						this.viewPermissionsTable.models = this.viewPermissions;
					} else {
						throw new Error(res.error);
					}
				}
			}
		} catch (error) {
			this.noticeService.addNotification(new Notification(NotificationType.Error, (error as Error).message));
			this.viewPermissions = [];
			this.viewPermissionsTable.models = [];
		} finally {
			this.loadingView = false;
			this.updateUrl();
			this.cdr.detectChanges();
		}
	}

	private async loadAllUsersPermissions(token: string): Promise<void> {
		const allPerms: PermissionInfo[] = [];
		let hasError = false;
		for (const user of this.allUsers) {
			try {
				const res = await this.fileService.getUserPermissions(token, user.email);
				if (res.success && res.data) {
					allPerms.push(...res.data);
				} else {
					throw new Error(res.error);
				}
			} catch (e) {
				console.warn(`Ошибка загрузки прав пользователя ${user.email}`, e);
				hasError = true;
			}
		}
		if (hasError) {
			this.noticeService.addNotification(new Notification(NotificationType.Warning, 'Некоторые права пользователей не загружены'));
		}
		this.viewPermissions = allPerms;
		this.viewPermissionsTable.models = this.viewPermissions;
	}

	private async loadAllGroupsPermissions(token: string): Promise<void> {
		const allPerms: PermissionInfo[] = [];
		for (const group of this.allGroups) {
			try {
				const res = await this.fileService.getGroupPermissions(token, group.name);
				if (res.success && res.data) {
					allPerms.push(...res.data);
				}
			} catch (e) {
				console.warn(`Ошибка загрузки прав группы ${group.name}`, e);
			}
		}
		this.viewPermissions = allPerms;
		this.viewPermissionsTable.models = this.viewPermissions;
	}
}