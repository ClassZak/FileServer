import { Component, OnInit, ChangeDetectorRef, OnDestroy } from '@angular/core';
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
	isLoading = true;
	isAdmin = false;

	// ----------------------------------------------
	// Edit permissions on a specific path
	// ----------------------------------------------
	targetType: 'folder' | 'file' = 'folder';
	path: string = '';
	currentPermissions: (FolderPermissionInfo | FilePermissionInfo)[] = [];

	// Add / update permission
	permissionType: 'user' | 'group' = 'user';
	userEmail: string = '';
	groupName: string = '';
	mode: number = 5;

	// Filtering for user/group selects (edit section)
	userSearchFilter: string = '';
	groupSearchFilter: string = '';
	filteredUsersForSelect: UserAdminModel[] = [];
	filteredGroupsForSelect: GroupBasicInfo[] = [];
	allUsers: UserAdminModel[] = [];
	allGroups: GroupBasicInfo[] = [];

	// ----------------------------------------------
	// View all permissions of a user or group
	// ----------------------------------------------
	viewType: 'user' | 'group' = 'user';
	viewUserEmail: string = '';        // empty means "all users"
	viewGroupName: string = '';        // empty means "all groups"
	viewPermissions: PermissionInfo[] = [];

		// ModelTable objects
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
					type: ActionType.ACTION,
					label: 'Удалить',
					class: 'btn btn-red',
					onClick: (perm: any) => this.deletePermission(perm)
				}
			]
		}
	);

	viewPermissionsTable: ModelTableDataObject<PermissionInfo> = new ModelTableDataObject(
		[
			{ header: 'Тип', field: (item: PermissionInfo) => item.type === 'folder' ? 'Папка' : 'Файл' },
			{ header: 'Путь', field: 'path' },
			{ header: 'Маска (0-15)', field: 'mode' }
		],
		[]
	);

	// Filtering for view selects
	viewUserSearchFilter: string = '';
	viewGroupSearchFilter: string = '';
	filteredViewUsers: UserAdminModel[] = [];
	filteredViewGroups: GroupBasicInfo[] = [];

	// URL query parameters subscriptions
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
		try {
			await this.checkAuth();
			if (!this.isAdmin) {
				this.router.navigate(['/account']);
				return;
			}
			await this.loadUsersAndGroups();

			this.querySub = this.route.queryParamMap.subscribe(async params => {
				// Edit section
				this.targetType = (params.get('targetType') as 'folder' | 'file') || 'folder';
				this.path = params.get('path') || '';
				this.permissionType = (params.get('permType') as 'user' | 'group') || 'user';
				this.userEmail = params.get('userEmail') || '';
				this.groupName = params.get('groupName') || '';
				this.mode = params.get('mode') ? parseInt(params.get('mode')!) : 5;

				// View section
				this.viewType = (params.get('viewType') as 'user' | 'group') || 'user';
				this.viewUserEmail = params.get('viewUserEmail') || '';
				this.viewGroupName = params.get('viewGroupName') || '';

				this.applyFiltersToSelects();
				this.applyFiltersToViewSelects();

				if (this.path !== undefined) {
					await this.loadPermissions();
				}
				await this.loadViewPermissions();
			});
		} catch (error) {
			console.error(error);
			this.noticeService.addNotificationErrorTypeByMessage(`Ошибка авторищации ${(error as Error).message}`);
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
		if (!this.isAdmin) throw new Error('Admin rights required');
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
		const groupFilter = this.groupSearchFilter.toLowerCase();
		this.filteredGroupsForSelect = this.allGroups.filter(g =>
			g.name.toLowerCase().includes(groupFilter)
		);
	}

	// Filtering for view section selects
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

	// Update URL with current state
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

	// Load permissions for current path
	async loadPermissions(): Promise<void> {
		// Если путь пуст – не делаем запрос, просто очищаем таблицу
		if (!this.path.trim()) {
			this.currentPermissions = [];
			this.currentPermissionsTable.models = [];
			this.updateUrl();
			this.cdr.detectChanges();
			return;
		}
		const token = AuthService.getToken();
		if (!token) return;
		this.isLoading = true;
		try {
			if (this.targetType === 'folder') {
				const res = await this.fileService.getFolderPermissions(token, this.path);
				if (res.success && res.data) {
					this.currentPermissions = res.data;
					this.currentPermissionsTable.models = this.currentPermissions;
				} else {
					throw new Error(res.error);
				}
			} else {
				const res = await this.fileService.getFilePermissions(token, this.path);
				if (res.success && res.data) {
					this.currentPermissions = res.data;
					this.currentPermissionsTable.models = this.currentPermissions;
				} else {
					throw new Error(res.error);
				}
			}
		} catch (error) {
			this.noticeService.addNotification(new Notification(NotificationType.Error, (error as Error).message));
			this.currentPermissions = [];
			this.currentPermissionsTable.models = [];
		} finally {
			this.isLoading = false;
			this.updateUrl();
			this.cdr.detectChanges();
		}
	}

	// Add or update permission
	async addPermission(): Promise<void> {
		if (!this.path.trim()) {
			this.noticeService.addNotification(new Notification(NotificationType.Warning, 'Enter a path'));
			return;
		}
		if (this.permissionType === 'user' && !this.userEmail) {
			this.noticeService.addNotification(new Notification(NotificationType.Warning, 'Select a user'));
			return;
		}
		if (this.permissionType === 'group' && !this.groupName) {
			this.noticeService.addNotification(new Notification(NotificationType.Warning, 'Select a group'));
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
				this.noticeService.addNotification(new Notification(NotificationType.Success, 'Permission added/updated'));
				await this.loadPermissions();
			} else {
				throw new Error(result.error);
			}
		} catch (error) {
			this.noticeService.addNotification(new Notification(NotificationType.Error, (error as Error).message));
		}
	}

	// Delete permission
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
				this.noticeService.addNotification(new Notification(NotificationType.Success, 'Permission deleted'));
				await this.loadPermissions();
			} else {
				throw new Error(result.error);
			}
		} catch (error) {
			this.noticeService.addNotification(new Notification(NotificationType.Error, (error as Error).message));
		}
	}

	// Load all permissions for selected subject (or all users/groups)
	async loadViewPermissions(): Promise<void> {
		const token = AuthService.getToken();
		if (!token) return;
		this.isLoading = true;
		try {
			if (this.viewType === 'user') {
				if (!this.viewUserEmail) {
					// Load permissions for all users
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
			this.isLoading = false;
			this.updateUrl();
			this.cdr.detectChanges();
		}
	}

	private async loadAllUsersPermissions(token: string): Promise<void> {
		const allPerms: PermissionInfo[] = [];
		for (const user of this.allUsers) {
			try {
				const res = await this.fileService.getUserPermissions(token, user.email);
				if (res.success && res.data) {
					allPerms.push(...res.data);
				}
			} catch (e) {
				console.warn(`Failed to load permissions for user ${user.email}`, e);
			}
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
				console.warn(`Failed to load permissions for group ${group.name}`, e);
			}
		}
		this.viewPermissions = allPerms;
		this.viewPermissionsTable.models = this.viewPermissions;
	}
}