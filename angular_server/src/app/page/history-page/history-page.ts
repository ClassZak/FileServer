import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from '../../core/service/auth-service';
import { FileService } from '../../core/service/file-service';
import AdminService from '../../core/service/admin-service';
import { UserService } from '../../core/service/user-service';
import { AppHeader } from '../../app-header/app-header';
import { AppFooter } from '../../app-footer/app-footer';
import { LoadingSpinner } from '../../component/loading-spinner/loading-spinner';
import { ModelTable } from '../../component/model-table/model-table';
import { ModelTableTileComponent } from '../../component/model-table-tile-component/model-table-tile-component';
import { IconManager } from '../../component/icon-manager/icon-manager';
import { NoticeService } from '../../core/view-core/service/notice-service';
import { Notification, NotificationType } from '../../core/view-core/model/notification';
import { User } from '../../core/model/user';
import {
	HistoryInfo,
	HistoryInfoAdmin,
	OperationTypeLabels,
	toOperationType,
	formatDetails,
	parentPath
} from '../../core/model/history-info';
import { ActionType, ModelTableDataObject } from '../../core/model/model-table-types';
import { UserAdminModel } from '../../core/model/user-admin-model';

@Component({
	selector: 'app-history-page',
	standalone: true,
	imports: [
		CommonModule,
		FormsModule,
		RouterModule,
		AppHeader,
		AppFooter,
		LoadingSpinner,
		ModelTable,
		ModelTableTileComponent
	],
	providers: [DatePipe],
	templateUrl: './history-page.html',
	styleUrls: ['./history-page.css']
})
export class HistoryPage implements OnInit, OnDestroy {
	// Static references for template usage
	IconManager = IconManager;
	OperationTypeLabels = OperationTypeLabels;

	// Data state flags
	isLoading = true;
	isAuthenticated = false;
	authorizedUser?: User;
	isAdmin = false;

	// Unified filter mode: 'my' | 'all' | string (email of a specific user)
	historyMode: 'my' | 'all' | string = 'my';
	pathPrefix = '';
	isFile: boolean | null = null;		// null = show all, true = files only, false = folders only
	allUsers: UserAdminModel[] = [];	// list of users for admin dropdown

	private paramSubscription?: Subscription;
	private querySubscription?: Subscription;

	/** Admin view – includes user email column */
	historyModelTableDataObjectAdmin: ModelTableDataObject<HistoryInfoAdmin> = new ModelTableDataObject(
		[
			{
				header: 'Время работы',
				field: (item: HistoryInfoAdmin) =>
					this.datePipe.transform(item.workTime, 'dd.MM.yyyy HH:mm:ss')
			},
			{
				header: 'Тип операции',
				field: (item: HistoryInfoAdmin) => OperationTypeLabels[item.operationType]
			},
			{ header: 'Пользователь', field: 'userEmail' },
			{
				header: 'Путь',
				field: (item: HistoryInfoAdmin) => item.path,
				icon: (item: HistoryInfoAdmin) =>
					this.getFileIconFromPath(item.path)
			},
			{
				header: 'Тип',
				field: (item: HistoryInfoAdmin) => this.getDisplayType(item.path),
				icon: (item: HistoryInfoAdmin) => this.getFileIconFromPath(item.path)
			},
			{
				header: 'Детали',
				field: (item: HistoryInfoAdmin) => formatDetails(item.details) || ''
			}
		],
		[],
		{
			actionsHeader: 'Действия',
			actionsConfigs: [
				{
					type: ActionType.LINK,
					label: (item: HistoryInfoAdmin) => (item.isFile ? 'К папке' : 'Открыть'),
					class: 'btn btn-blue',
					href: (item: HistoryInfoAdmin) =>
						`/files/${item.isFile ? parentPath(item.path) : item.path}`
				}
			]
		}
	);

	/** Regular user view – email column hidden */
	historyModelTableDataObject: ModelTableDataObject<HistoryInfo> = new ModelTableDataObject(
		[
			{
				header: 'Время работы',
				field: (item: HistoryInfo) =>
					this.datePipe.transform(item.workTime, 'dd.MM.yyyy HH:mm:ss')
			},
			{
				header: 'Тип операции',
				field: (item: HistoryInfo) => OperationTypeLabels[item.operationType]
			},
			{
				header: 'Путь',
				field: (item: HistoryInfo) => item.path,
				icon: (item: HistoryInfo) =>
					this.getFileIconFromPath(item.path)
			},
			{
				header: 'Тип',
				field: (item: HistoryInfo) => this.getDisplayType(item.path),
				icon: (item: HistoryInfo) => this.getFileIconFromPath(item.path)
			},
			{
				header: 'Детали',
				field: (item: HistoryInfo) => formatDetails(item.details) || ''
			}
		],
		[],
		{
			actionsHeader: 'Действия',
			actionsConfigs: [
				{
					type: ActionType.LINK,
					label: (item: HistoryInfo) => (item.isFile ? 'К папке' : 'Открыть'),
					class: 'btn btn-blue',
					href: (item: HistoryInfo) =>
						`/files/${item.isFile ? parentPath(item.path) : item.path}`
				}
			]
		}
	);

	currentHistoryModelTableDataObject: any;

	constructor(
		private route: ActivatedRoute,
		private router: Router,
		private cdr: ChangeDetectorRef,
		private datePipe: DatePipe,
		private authService: AuthService,
		private adminService: AdminService,
		private fileService: FileService,
		private userService: UserService,
		private noticeService: NoticeService
	) {}

	async ngOnInit(): Promise<void> {
		try {
			await this.checkAuthentication();
			if (this.isAdmin) {
				await this.loadUsers();
			}
		} catch (error) {
			console.error('History page initialisation error:', error);
			this.noticeService.addNotification(
				new Notification(NotificationType.Error, `Error loading page: ${error}`)
			);
		}

		// Subscribe on email param from path
		this.paramSubscription = this.route.paramMap.subscribe(params => {
			const emailParam = params.get('email');
			if (emailParam) {
				this.historyMode = emailParam;
			}
		});

		// Subscribe on query param for filters
		this.querySubscription = this.route.queryParamMap.subscribe(params => {
			this.pathPrefix = params.get('pathPrefix') || '';
			const isFileParam = params.get('isFile');
			this.isFile = isFileParam === 'true' ? true : (isFileParam === 'false' ? false : null);
			if (params.get('all') === 'true') {
				this.historyMode = 'all';
			}
			this.applyDefaultsAndLoad();
		});
	}

	ngOnDestroy(): void {
		this.paramSubscription?.unsubscribe();
		this.querySubscription?.unsubscribe();
	}

	/** Set default mode for admin if not explicitly set */
	private applyDefaultsAndLoad(): void {
		if (!this.isAdmin) {
			this.historyMode = 'my';
		} else {
			if (!this.historyMode || this.historyMode === 'my') {
				this.historyMode = 'my';
			}
		}
		this.loadHistory();
	}

	/** Verifies JWT token and loads current user information */
	private async checkAuthentication(): Promise<void> {
		try {
			const authResult = await this.authService.checkAuth();

			if (!authResult.success || !authResult.data?.authenticated) {
				const message = `Authentication failed: ${authResult.error}`;
				console.error(message);
				throw new Error(message);
			}

			console.log('Authentication successful');
			this.isAuthenticated = true;
			this.authorizedUser = authResult.data.user;

			await this.checkAdminStatus();
		} catch (error) {
			const message = `Authentication check error: ${(error as Error).message}`;
			console.error(message);
			this.noticeService.addNotification(new Notification(NotificationType.Error, message));
			this.router.navigate(['/login']);
		}
	}

	/** Checks whether the current user has administrator privileges */
	private async checkAdminStatus(): Promise<void> {
		try {
			const token = AuthService.getToken();
			if (!token) throw new Error('No auth token');
			const result = await this.adminService.isAdmin(token);
			if (result.success) {
				this.isAdmin = result.data!.isAdmin;
			} else {
				throw new Error(result.error || 'Unable to check admin status');
			}
		} catch (error) {
			const message = `Admin status check error: ${(error as Error).message}`;
			console.error(message);
			this.noticeService.addNotification(new Notification(NotificationType.Error, message));
		}
	}

	/** Loads the list of all users (for admin dropdown) */
	private async loadUsers(): Promise<void> {
		try {
			const token = AuthService.getToken();
			if (!token) return;
			const result = await this.userService.readAllUsers(token);
			if (result.success && result.data?.users) {
				this.allUsers = result.data.users;
			}
		} catch (error) {
			console.error('Failed to load user list:', error);
		}
	}

	/**
	 * Loads history entries from the backend and populates the appropriate
	 * model table. Sorting is applied so that newest entries appear first.
	 */
	private async loadHistory(): Promise<void> {
		this.isLoading = true;
		this.currentHistoryModelTableDataObject = null;

		try {
			const token = AuthService.getToken();
			if (!token) {
				this.router.navigate(['/login']);
				return;
			}

			const filters: { userEmail?: string; pathPrefix?: string; isFile?: boolean } = {};

			// Determine effective userEmail based on historyMode
			if (this.isAdmin) {
				if (this.historyMode === 'all') {
					// No userEmail filter – get all users
				} else if (this.historyMode === 'my') {
					filters.userEmail = this.authorizedUser?.email;
				} else {
					// Specific user email
					filters.userEmail = this.historyMode as string;
				}
			}
			// For regular user, backend ignores userEmail and returns only own history

			if (this.pathPrefix.trim()) {
				filters.pathPrefix = this.pathPrefix.trim();
			}
			if (this.isFile !== null) {
				filters.isFile = this.isFile;
			}

			const result = await this.fileService.getHistory(token, filters);
			if (!result.success || !result.data) {
				throw new Error(result.error || 'Failed to load history');
			}

			const raw = result.data;
			if (
				this.isAdmin &&
				(this.historyMode === 'all' || (this.historyMode !== 'my' && this.historyMode !== this.authorizedUser?.email))
			) {
				this.historyModelTableDataObjectAdmin.models = raw.map(
					entry =>
						new HistoryInfoAdmin(
							new Date(entry.workTime),
							toOperationType(entry.operationType),
							entry.userEmail,
							entry.path,
							entry.isFile,
							entry.details
						)
				);
				this.currentHistoryModelTableDataObject = this.historyModelTableDataObjectAdmin;
				this.currentHistoryModelTableDataObject.models.sort(
					(a: HistoryInfoAdmin, b: HistoryInfoAdmin) =>
						b.workTime.getTime() - a.workTime.getTime()
				);
			} else {
				this.historyModelTableDataObject.models = raw.map(
					entry =>
						new HistoryInfo(
							new Date(entry.workTime),
							toOperationType(entry.operationType),
							entry.path,
							entry.isFile,
							entry.details
						)
				);
				this.currentHistoryModelTableDataObject = this.historyModelTableDataObject;
				this.currentHistoryModelTableDataObject.models.sort(
					(a: HistoryInfo, b: HistoryInfo) =>
						b.workTime.getTime() - a.workTime.getTime()
				);
			}
		} catch (error) {
			console.error('Load history error:', error);
			this.noticeService.addNotificationErrorTypeByMessage((error as Error).message);
		} finally {
			this.isLoading = false;
			this.cdr.detectChanges();
		}
	}

	/** Update URL and reload history */
	applyFilters(): void {
		const queryParams: any = {};
		if (this.pathPrefix) queryParams.pathPrefix = this.pathPrefix;
		if (this.isFile !== null) queryParams.isFile = this.isFile;

		let segment: string[];
		if (this.isAdmin) {
			if (this.historyMode === 'all') {
				segment = ['/history'];
				queryParams.all = 'true';
			} else if (this.historyMode === 'my') {
				segment = ['/history'];
			} else {
				segment = ['/history/email', this.historyMode];
			}
		} else {
			segment = ['/history'];
		}

		this.router.navigate(segment, { queryParams, replaceUrl: true }).then(() => {
			this.loadHistory();
		});
	}

	/** Reset all filters to defaults */
	resetFilters(): void {
		this.pathPrefix = '';
		this.isFile = null;
		this.historyMode = 'my';
		this.router.navigate(['/history'], { replaceUrl: true }).then(() => {
			this.loadHistory();
		});
	}


	private getDisplayType(path: string): string {
		const lastSegment = path.split('/').pop() || '';
		const dotIndex = lastSegment.lastIndexOf('.');
		if (dotIndex === -1) return 'Папка';
		const extension = lastSegment.substring(dotIndex + 1);

		return extension.length > 0 ? extension : 'Файл';
	}

	private getFileIconFromPath(path: string): string {
		const lastSegment = path.split('/').pop() || '';
		const dotIndex = lastSegment.lastIndexOf('.');
		if (dotIndex === -1) return IconManager.getFileIcon('folder');
		const extension = lastSegment.substring(dotIndex + 1);

		return IconManager.getFileIcon(extension.length > 0 ? extension : 'file');
	}
}