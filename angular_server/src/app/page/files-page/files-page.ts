import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule, UrlSegment } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from '../../core/service/auth-service';
import { FileService, DirectoryList, SearchResults } from '../../core/service/file-service';
import { FileInfo } from '../../core/model/file-info';
import { FolderInfo } from '../../core/model/folder-info';

// UI Components (adjust paths as needed in your project)
import { AppHeader } from '../../app-header/app-header';
import { AppFooter } from '../../app-footer/app-footer';
import { LoadingSpinner } from '../../component/loading-spinner/loading-spinner';
import { BreadcrumbsComponent } from '../../component/breadcrumbs/breadcrumbs';
import { ModelTable } from '../../component/model-table/model-table';
import { ModelTableTileComponent } from '../../component/model-table-tile-component/model-table-tile-component';
import { ActionType, ActionsConfig, ActionConfig, ColumnDefinition, ModelTableDataObject } from '../../core/model/model-table-types';
import { FileSearchComponent } from '../../component/file-search-component/file-search-component';
import { CreateFolderModalComponent } from '../../component/modal/file/create-folder-modal-component/create-folder-modal-component';
import { DeleteConfirmationModalComponent } from '../../component/modal/file/delete-confirmation-modal-component/delete-confirmation-modal-component';
import { RedirectionButton } from '../../component/redirection-button/redirection-button';
import { User } from '../../core/model/user';
import AdminService from '../../core/service/admin-service';
import { IconManager } from '../../component/icon-manager/icon-manager';

@Component({
	selector: 'app-files-page',
	standalone: true,
	imports: [
		CommonModule,
		FormsModule,
		RouterModule,
		AppHeader,
		AppFooter,
		LoadingSpinner,
		BreadcrumbsComponent,

		ModelTable,
		ModelTableTileComponent,

		FileSearchComponent,
		CreateFolderModalComponent,
		DeleteConfirmationModalComponent,
		RedirectionButton,
	],
	templateUrl: './files-page.html',
	styleUrls: ['./files-page.css'],
})
export class FilesPageComponent implements OnInit, OnDestroy {
	// Static references
	IconManager = IconManager;

	// Data states
	isLoading = false;
	uploading = false;
	isAuthenticated: boolean = false;
	authorizedUser?: User;
	isAdmin: boolean = false;
	error = '';
	files = new Array<FileInfo>();
	folders = new Array<FolderInfo>();

	// ModelTable
	filesModelTableDataObject: ModelTableDataObject<FileInfo> = new ModelTableDataObject(
		[
			{header:'Имя', field:'name', icon:((item: FileInfo)=>IconManager.getFileIcon(item.extension))},
			{header:'Расширение', field:'extension', icon:((item: FileInfo)=>IconManager.getFileIcon(item.extension))},
			{header:'Размер', field:'readableSize'},
			{header:'Дата изменения', field:'lastModified'},
		],
		[],
		{
			actionsHeader: 'Действия',
			actionsConfigs: [
				{
					type: ActionType.ACTION,
					label: 'Скачать',
					class: 'btn btn-blue',
					onClick: (file: FileInfo) => this.handleFileDownload(file)
				},
				{
					type: ActionType.ACTION,
					label: 'Удалить',
					class: 'btn btn-red',
					onClick: (file: FileInfo) => this.handleFileDelete(file)
				}
			]
		}
	);
	foldersModelTableDataObject: ModelTableDataObject<FolderInfo> = new ModelTableDataObject(
		[
			{header: 'Имя', field: 'name', icon:((item: FolderInfo)=>IconManager.getFileIcon('folder'))},
			{header: 'Дата изменения', field:'lastModified'},
			{header: 'Размер', field:'readableSize'}
		],
		[],
		{
			actionsHeader: 'Действия', 
			actionsConfigs: [
				{
					type: ActionType.LINK,
					label: 'Открыть',
					class: 'btn btn-blue',
					href: (item: FolderInfo)=>{return `/files/${item.fullPath}`}
				},
				{
					type: ActionType.ACTION,
					label: 'Удалить',
					class: 'btn btn-red',
					onClick: (item: FolderInfo) => this.prepareDelete(item.fullPath, item.name)
				}
			]
		}
	);
	filesFoundModelTableDataObject: ModelTableDataObject<FileInfo> = new ModelTableDataObject(
		[
			{header:'Путь', field:((item: FileInfo)=>{return FileInfo.getRelativePath(item,this.searchPath)}), icon:((item: FileInfo)=>IconManager.getFileIcon(item.extension))},
			{header:'Имя', field:'name', icon:((item: FileInfo)=>IconManager.getFileIcon(item.extension))},
			{header:'Расширение', field:'extension', icon:((item: FileInfo)=>IconManager.getFileIcon(item.extension))},
			{header:'Размер', field:'readableSize'},
			{header:'Дата изменения', field:'lastModified'},
		],
		[],
		{
			actionsHeader: 'Действия',
			actionsConfigs: [
				{
					type: ActionType.ACTION,
					label: 'Скачать',
					class: 'btn btn-blue',
					onClick: (file: FileInfo) => this.handleFileDownload(file)
				},
				{
					type: ActionType.ACTION,
					label: 'Удалить',
					class: 'btn btn-red',
					onClick: (file: FileInfo) => this.handleFileDelete(file)
				}
			]
		}
	);
	foldersFoundModelTableDataObject: ModelTableDataObject<FolderInfo> = new ModelTableDataObject(
		[
			{header: 'Имя', field: 'name', icon:((item: FolderInfo)=>IconManager.getFileIcon('folder'))},
			{header: 'Дата изменения', field:'lastModified'},
			{header: 'Размер', field:'readableSize'}
		],
		[],
		{
			actionsHeader: 'Действия', 
			actionsConfigs: [
				{
					type: ActionType.LINK,
					label: 'Открыть',
					class: 'btn btn-blue',
					href: (item: FolderInfo)=>{return `/files/${item.fullPath}`}
				},
				{
					type: ActionType.ACTION,
					label: 'Удалить',
					class: 'btn btn-red',
					onClick: (item: FolderInfo) => this.prepareDelete(item.fullPath, item.name)
				}
			]
		}
	);

	// Navigation state
	currentPath = '';
	pathInput = '';

	// Search mode
	isSearchMode = false;
	searchQuery = '';
	searchPath = '';
	searchResults: SearchResults | null = null;
	searchLoading = false;

	// Modal visibility flags
	showCreateFolderModal = false;
	showDeleteModal = false;
	itemToDelete: { path: string; name: string } | null = null;

	// Subscriptions
	private routeParamsSubscription?: Subscription;
	private queryParamsSubscription?: Subscription;

	constructor(
		private route: ActivatedRoute,
		private router: Router,
		private cdr: ChangeDetectorRef,

		private authService: AuthService,
		private adminService: AdminService,
		private fileService: FileService
	) {}

	async ngOnInit(): Promise<void> {
		try{
			await this.checkAuthentication();
			this.initSubscriptions();
		} catch (error) {
			console.error('Ошибка при загрузке страницы:', error); // TODO: notice
		}
	}

	private initSubscriptions(): void {
		// URL segment subscribtion (/files/**)
		this.routeParamsSubscription = this.route.url.subscribe((segments: UrlSegment[]) => {
			// remove the 'files'
			const pathSegments = segments.slice(1).map(s => s.path);
			const path = pathSegments.join('/');
			this.currentPath = path;
			this.pathInput = path;
			// Download directory in default mode
			if (!this.isSearchMode)
				this.loadDirectory();
		});

		// URL query params subscribtion (for search)
		this.queryParamsSubscription = this.route.queryParamMap.subscribe((queryMap) => {
			const q = queryMap.get('q');
			const newIsSearchMode = !!q;

			if (newIsSearchMode !== this.isSearchMode) {
				this.isSearchMode = newIsSearchMode;
			}

			if (this.isSearchMode) {
				this.searchQuery = q!;
				this.searchPath = queryMap.get('searchPath') || '';
				this.performSearch();
			} else {
				// Load current durectory
				this.loadDirectory();
			}
		});
	}

	ngOnDestroy(): void {
		this.unsubscribeAll();
	}
	unsubscribeAll(): void {
		this.routeParamsSubscription?.unsubscribe();
		this.queryParamsSubscription?.unsubscribe();
	}


	private async checkAuthentication(): Promise<void> {
		try {
			const authResult = await this.authService.checkAuth();
			
			if (!authResult.success || !authResult.data?.authenticated) {
				const message = `Аутентификация не пройдена: ${authResult.error}`;
				console.error(message);
				this.unsubscribeAll();
				this.router.navigate(['/login']);
				throw new Error(message);
			} else {
				console.log('Аутентификация прошла успешно');
				this.isAuthenticated = true;
				this.authorizedUser = authResult.data.user;
				
				await this.checkAdminStatus();
			}
		} catch (error) {
			console.error('Ошибка при проверке аутентификации:', error);
			this.unsubscribeAll();
			this.router.navigate(['/login']);
			return;
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
			const result = await this.adminService.isAdmin(token);
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

	/**
	 * Decide whether to load directory or perform search based on current mode.
	 */
	private updateContent(): void {
		if (this.isSearchMode) {
			this.performSearch();
		} else {
			this.loadDirectory();
		}
	}

	/**
	 * Load the directory contents for the current path.
	 */
	private async loadDirectory(): Promise<void> {
		this.isLoading = true;
		this.error = '';

		try {
			const token = AuthService.getToken();
			if (!token) {
				this.unsubscribeAll();
				this.router.navigate(['/login']);
				return;
			}
			const result = await this.fileService.loadDirectory(token, this.currentPath);

			if (!result.success) {
				this.error = result.error || 'Unknown error';
				this.files = [];
				this.folders = [];
				this.filesModelTableDataObject.models = this.files;
				this.foldersModelTableDataObject.models = this.folders;
				this.filesFoundModelTableDataObject.models = this.files;
				this.foldersFoundModelTableDataObject.models = this.folders;
			} else {
				const dirList = result.data as DirectoryList;
				this.files = dirList.files;
				this.folders = dirList.folders;
				this.filesModelTableDataObject.models = this.files;
				this.foldersModelTableDataObject.models = this.folders;
				this.filesFoundModelTableDataObject.models = this.files;
				this.foldersFoundModelTableDataObject.models = this.folders;
			}
		} catch (err: any) {
			console.error('Load directory error:', err);
			this.error = err.message || 'Failed to load directory.';
			this.files = [];
			this.folders = [];
			this.filesModelTableDataObject.models = this.files;
			this.foldersModelTableDataObject.models = this.folders;
			this.filesFoundModelTableDataObject.models = this.files;
			this.foldersFoundModelTableDataObject.models = this.folders;
		} finally {
			this.isLoading = false;
			this.cdr.detectChanges();
		}
	}

	/**
	 * Execute a search with the current query and search path.
	 */
	private async performSearch(): Promise<void> {
		this.searchLoading = true;
		this.error = '';

		try {
			const token = AuthService.getToken();
			if (!token) {
				this.unsubscribeAll();
				this.router.navigate(['/login']);
				return;
			}

			const results = await this.fileService.find(token, this.searchQuery, this.searchPath);
			if (!results.success)
				throw results.error;
			this.searchResults = results.data!;
			this.filesFoundModelTableDataObject.models = this.searchResults.files;
			this.foldersFoundModelTableDataObject.models = this.searchResults.folders;
		} catch (err: any) {
			console.error('Search error:', err);
			this.error = err.message || 'Search failed.';
			this.searchResults = null;
			this.filesFoundModelTableDataObject.models = [];
			this.foldersFoundModelTableDataObject.models = [];
		} finally {
			this.searchLoading = false;
			this.cdr.detectChanges();
		}
	}

	// ========== Navigation ==========

	public navigateToFolder(folderPath: string): void {
		this.error = '';
		const cleanPath = folderPath.replace(/^\/+|\/+$/g, '');
		this.router.navigate(['/files', cleanPath]);
	}

	navigateUp(): void {
		if (!this.currentPath) return;
		this.error = '';
		const parts = this.currentPath.split('/');
		parts.pop();
		const parentPath = parts.join('/');
		this.router.navigate(['/files', parentPath]);
	}

	// ========== Path input handling ==========

	onPathInputChange(value: string): void {
		this.pathInput = value;
	}

	async onPathSubmit(event?: Event): Promise<void> {
		if (event) {
			event.preventDefault();
		}
		this.error = '';

		const trimmed = this.pathInput.trim();
		if (trimmed === '') {
			this.router.navigate(['/files']);
			return;
		}

		const cleanPath = trimmed.replace(/^\/+|\/+$/g, '');
		const token = AuthService.getToken();
		if (!token) {
			this.router.navigate(['/login']);
			return;
		}

		try {
			const exists = await this.fileService.exists(token, cleanPath);
			if (exists.success) {
				this.router.navigate(['/files', cleanPath]);
				return;
			} else {
				this.error = 'Path does not exist.';
			}
		} catch (err: any) {
			this.error = err.message || 'Failed to check path.';
			// TODO: notice
		}
	}

	// ========== File upload ==========

	async handleFileUpload(event: Event): Promise<void> {
		const input = event.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;

		this.uploading = true;
		this.error = '';

		try {
			const token = AuthService.getToken();
			if (!token) {
				this.router.navigate(['/login']);
				return;
			}

			await this.fileService.upload(token, file, this.currentPath);
			await this.loadDirectory();
		} catch (err: any) {
			this.error = typeof err === 'string' ? err : err.message || 'Upload failed.';
		} finally {
			this.uploading = false;
			input.value = '';
			this.cdr.detectChanges();
		}
	}

	// ========== Folder creation ==========

	openCreateFolderModal(): void {
		this.showCreateFolderModal = true;
	}

	closeCreateFolderModal(): void {
		this.showCreateFolderModal = false;
	}

	async handleCreateFolder(folderName: string): Promise<void> {
		try {
			const token = AuthService.getToken();
			if (!token) {
				this.unsubscribeAll();
				this.router.navigate(['/login']);
				return;
			}

			await this.fileService.createFolder(token, this.currentPath, folderName);

			this.showCreateFolderModal = false;
			await this.loadDirectory();
		} catch (err: any) {
			console.error('Create folder error:', err);
			this.error = typeof err === 'string' ? err : err.message || 'Failed to create folder.';
		} finally {
			this.cdr.detectChanges();
		}
	}

	// ========== Delete ==========
	handleFileDelete(file: FileInfo): void {
		this.prepareDelete(file.fullPath, file.name);
	}

	prepareDelete(path: string, name: string): void {
		this.itemToDelete = { path, name };
		this.showDeleteModal = true;
	}

	closeDeleteModal(): void {
		this.showDeleteModal = false;
		this.itemToDelete = null;
	}

	get encodedCurrentPath(): string {
		return encodeURIComponent(this.currentPath);
	}

	async handleDelete(): Promise<void> {
		if (!this.itemToDelete) return;

		try {
			const token = AuthService.getToken();
			if (!token) {
				this.unsubscribeAll();
				this.router.navigate(['/login']);
				return;
			}

			await this.fileService.deleteItem(token, this.itemToDelete.path);

			this.showDeleteModal = false;
			this.itemToDelete = null;
			await this.loadDirectory();
		} catch (err: any) {
			console.error('Delete error:', err);
			this.error = typeof err === 'string' ? err : err.message || 'Deletion failed.';
		} finally {
			this.cdr.detectChanges();
		}
	}

	// ========== Download ==========
	handleFileDownload(file: FileInfo): void {
		this.handleDownload(file.fullPath, file.name);
	}
	async handleDownload(path: string, name: string): Promise<void> {
		try {
			const token = AuthService.getToken();
			if (!token) {
				this.unsubscribeAll();
				this.router.navigate(['/login']);
				return;
			}

			const { blob, contentType } = (await this.fileService.downloadFile(token, path)).data!;

			// Check if the response is actually an error JSON
			if (contentType && contentType.includes('application/json')) {
				const text = await blob.text();
				const errorData = JSON.parse(text);
				this.error = errorData.error || 'Ошибка загрузки.';
				this.cdr.detectChanges();
				return;
			}

			// Trigger file download
			const url = window.URL.createObjectURL(blob);
			const link = document.createElement('a');
			link.href = url;
			link.setAttribute('download', name);
			document.body.appendChild(link);
			link.click();
			link.remove();
			window.URL.revokeObjectURL(url);
		} catch (err: any) {
			console.error('Download error:', err);
			this.error = typeof err === 'string' ? err : err.message || 'Ошибка загрузки.';
			this.cdr.detectChanges();
		}
	}
}