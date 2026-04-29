import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { AppHeader } from '../../app-header/app-header';
import { AppFooter } from '../../app-footer/app-footer';
import { LoadingSpinner } from '../../component/loading-spinner/loading-spinner';
import { ModelTable } from '../../component/model-table/model-table';
import { ModelTableTileComponent } from '../../component/model-table-tile-component/model-table-tile-component';
import { IconManager } from '../../component/icon-manager/icon-manager';
import { AuthService } from '../../core/service/auth-service';
import { FileService, DeletedFileInfo, DeletedFolderInfo } from '../../core/service/file-service';
import { AdminService } from '../../core/service/admin-service';
import { NoticeService } from '../../core/view-core/service/notice-service';
import { Notification, NotificationType } from '../../core/view-core/model/notification';
import { ActionType, ModelTableDataObject } from '../../core/model/model-table-types';

@Component({
	selector: 'app-deleted-files-page',
	standalone: true,
	imports: [
		CommonModule,
		AppHeader,
		AppFooter,
		LoadingSpinner,
		ModelTable,
		ModelTableTileComponent
	],
	providers: [DatePipe],
	templateUrl: './deleted-files-page.html',
	styleUrls: ['./deleted-files-page.css']
})
export class DeletedFilesPage implements OnInit {
	IconManager = IconManager;
	isLoading = true;
	isAdmin = false;
	authorizedUserEmail = '';

	deletedFiles: DeletedFileInfo[] = [];
	deletedFolders: DeletedFolderInfo[] = [];

	// Таблица удалённых файлов
	filesTableData: ModelTableDataObject<DeletedFileInfo> = new ModelTableDataObject(
		[
			{ header: 'Путь', field: 'originalPath', icon: () => IconManager.getFileIcon('file') },
			{ header: 'Дата удаления', field: (item: DeletedFileInfo) => this.datePipe.transform(item.deletedAt, 'dd.MM.yyyy HH:mm:ss') },
			{ header: 'Версия', field: 'version' },
			{ header: 'Кем удалён', field: 'deletedByUserEmail' }
		],
		[],
		{
			actionsHeader: 'Действия',
			actionsConfigs: [
				{
					type: ActionType.ACTION,
					label: 'Восстановить',
					class: 'btn btn-green',
					onClick: (item: DeletedFileInfo) => this.restoreFile(item)
				},
				{
					type: ActionType.ACTION,
					label: 'Удалить окончательно',
					class: 'btn btn-red',
					onClick: (item: DeletedFileInfo) => this.permanentDeleteFile(item)
				}
			]
		}
	);

	// Таблица удалённых папок
	foldersTableData: ModelTableDataObject<DeletedFolderInfo> = new ModelTableDataObject(
		[
			{ header: 'Путь', field: 'originalPath', icon: () => IconManager.getFileIcon('folder') },
			{ header: 'Дата удаления', field: (item: DeletedFolderInfo) => this.datePipe.transform(item.deletedAt, 'dd.MM.yyyy HH:mm:ss') },
			{ header: 'Версия', field: 'version' },
			{ header: 'Кем удалён', field: 'deletedByUserEmail' }
		],
		[],
		{
			actionsHeader: 'Действия',
			actionsConfigs: [
				{
					type: ActionType.ACTION,
					label: 'Восстановить',
					class: 'btn btn-green',
					onClick: (item: DeletedFolderInfo) => this.restoreFolder(item)
				},
				{
					type: ActionType.ACTION,
					label: 'Удалить окончательно',
					class: 'btn btn-red',
					onClick: (item: DeletedFolderInfo) => this.permanentDeleteFolder(item)
				}
			]
		}
	);

	constructor(
		private router: Router,
		private cdr: ChangeDetectorRef,
		private datePipe: DatePipe,
		private authService: AuthService,
		private adminService: AdminService,
		private fileService: FileService,
		private noticeService: NoticeService
	) {}

	async ngOnInit(): Promise<void> {
		try {
			await this.checkAuth();
			if (!this.isAdmin) {
				this.router.navigate(['/account']);
				return;
			}
			await this.loadDeletedItems();
		} catch (error) {
			console.error(error);
			this.noticeService.addNotification(new Notification(NotificationType.Error, (error as Error).message));
		} finally {
			this.isLoading = false;
			this.cdr.detectChanges();
		}
	}

	private async checkAuth(): Promise<void> {
		const authResult = await this.authService.checkAuth();
		if (!authResult.success || !authResult.data?.authenticated) {
			this.router.navigate(['/login']);
			throw new Error('Не авторизован');
		}
		this.authorizedUserEmail = authResult.data.user?.email || '';
		const token = AuthService.getToken();
		if (!token) throw new Error('Нет токена');
		const adminCheck = await this.adminService.isAdmin(token);
		this.isAdmin = adminCheck.success && adminCheck.data?.isAdmin === true;
		if (!this.isAdmin) throw new Error('Требуются права администратора');
	}

	private async loadDeletedItems(): Promise<void> {
		const token = AuthService.getToken();
		if (!token) return;

		const filesResult = await this.fileService.getDeletedFiles(token);
		if (filesResult.success && filesResult.data) {
			this.deletedFiles = filesResult.data;
			this.filesTableData.models = this.deletedFiles;
		}

		const foldersResult = await this.fileService.getDeletedFolders(token);
		if (foldersResult.success && foldersResult.data) {
			this.deletedFolders = foldersResult.data;
			this.foldersTableData.models = this.deletedFolders;
		}
	}

	async restoreFile(file: DeletedFileInfo): Promise<void> {
		const token = AuthService.getToken();
		if (!token) return;
		try {
			const result = await this.fileService.restoreFile(token, file.originalPath, file.version);
			if (result.success) {
				this.noticeService.addNotification(new Notification(NotificationType.Success, 'Файл восстановлен'));
				await this.loadDeletedItems();
			} else {
				throw new Error(result.error);
			}
		} catch (error) {
			this.noticeService.addNotification(new Notification(NotificationType.Error, (error as Error).message));
		}
	}

	async restoreFolder(folder: DeletedFolderInfo): Promise<void> {
		const token = AuthService.getToken();
		if (!token) return;
		try {
			const result = await this.fileService.restoreFolder(token, folder.originalPath, folder.version);
			if (result.success) {
				this.noticeService.addNotification(new Notification(NotificationType.Success, 'Папка восстановлена'));
				await this.loadDeletedItems();
			} else {
				throw new Error(result.error);
			}
		} catch (error) {
			this.noticeService.addNotification(new Notification(NotificationType.Error, (error as Error).message));
		}
	}

	async permanentDeleteFile(file: DeletedFileInfo): Promise<void> {
		if (!confirm(`Окончательно удалить файл "${file.originalPath}" (версия ${file.version})? Это действие необратимо.`)) return;
		const token = AuthService.getToken();
		if (!token) return;
		try {
			const result = await this.fileService.permanentDeleteFile(token, file.originalPath);
			if (result.success) {
				this.noticeService.addNotification(new Notification(NotificationType.Success, 'Файл окончательно удалён'));
				await this.loadDeletedItems();
			} else {
				throw new Error(result.error);
			}
		} catch (error) {
			this.noticeService.addNotification(new Notification(NotificationType.Error, (error as Error).message));
		}
	}

	async permanentDeleteFolder(folder: DeletedFolderInfo): Promise<void> {
		if (!confirm(`Окончательно удалить папку "${folder.originalPath}" (версия ${folder.version})? Это действие необратимо.`)) return;
		const token = AuthService.getToken();
		if (!token) return;
		try {
			const result = await this.fileService.permanentDeleteFolder(token, folder.originalPath);
			if (result.success) {
				this.noticeService.addNotification(new Notification(NotificationType.Success, 'Папка окончательно удалена'));
				await this.loadDeletedItems();
			} else {
				throw new Error(result.error);
			}
		} catch (error) {
			this.noticeService.addNotification(new Notification(NotificationType.Error, (error as Error).message));
		}
	}
}