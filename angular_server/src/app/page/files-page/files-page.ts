import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule, UrlSegment } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from '../../core/service/auth-service';
import { FileService, DirectoryList, SearchResults } from '../../core/service/file-service';
import { FileInfo } from '../../core/model/file-info';
import { FolderInfo } from '../../core/model/folder-info';
import { ErrorContainer } from '../../core/model/error-container';

// UI Components (adjust paths as needed in your project)
import { AppHeader } from '../../app-header/app-header';
import { AppFooter } from '../../app-footer/app-footer';
import { LoadingSpinner } from '../../component/loading-spinner/loading-spinner';
import { BreadcrumbsComponent } from '../../component/breadcrumbs/breadcrumbs'; // renamed
import { FileSearchComponent } from '../../component/file-search-component/file-search-component';
import { ErrorMessageComponent } from '../../component/error-message-component/error-message-component';
import { FileTableComponent } from '../../component/file-table-component/file-table-component';
import { FolderTableComponent } from '../../component/folder-table-component/folder-table-component';
import { FoundFilesTableComponent } from '../../component/found-files-table-component/found-files-table-component';
import { FoundFoldersTableComponent } from '../../component/found-folders-table-component/found-folders-table-component';
import { CreateFolderModalComponent } from '../../component/modal/file/create-folder-modal-component/create-folder-modal-component';
import { DeleteConfirmationModalComponent } from '../../component/modal/file/delete-confirmation-modal-component/delete-confirmation-modal-component';
import { RedirectionButton } from '../../component/redirection-button/redirection-button';
import { User } from '../../core/model/user';
import AdminService from '../../core/service/admin-service';

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
		FileSearchComponent,
		ErrorMessageComponent,
		FileTableComponent,
		FolderTableComponent,
		FoundFilesTableComponent,
		FoundFoldersTableComponent,
		CreateFolderModalComponent,
		DeleteConfirmationModalComponent,
		RedirectionButton,
	],
	templateUrl: './files-page.html',
	styleUrls: ['./files-page.css'],
})
export class FilesPageComponent implements OnInit, OnDestroy {
	// Data states
	files: FileInfo[] = [];
	folders: FolderInfo[] = [];
	isLoading = false;
	uploading = false;
	isAuthenticated: boolean = false;
	authorizedUser?: User;
	isAdmin: boolean = false;
	error = '';

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
		private cdr: ChangeDetectorRef
	) {}

	async ngOnInit(): Promise<void> {
		try{
			await this.checkAuthentication();
		} catch (error) {
			console.error('Ошибка при загрузке страницы:', error); // TODO: notice
		}
		// Подписка на изменение сегментов URL (часть после /files/)
		this.routeParamsSubscription = this.route.url.subscribe((segments: UrlSegment[]) => {
			// Убираем первый сегмент 'files'
			const pathSegments = segments.slice(1).map(s => s.path);
			const path = pathSegments.join('/');
			this.currentPath = path;
			this.pathInput = path;
			// Загружаем директорию только если не в режиме поиска
			if (!this.isSearchMode) {
				this.loadDirectory();
			}
		});

		// Подписка на query-параметры (для поиска)
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
				// При выходе из поиска загружаем текущую директорию
				this.loadDirectory();
			}
		});
	}

	ngOnDestroy(): void {
		this.routeParamsSubscription?.unsubscribe();
		this.queryParamsSubscription?.unsubscribe();
	}


	private async checkAuthentication(): Promise<void> {
		try {
			const authResult = await AuthService.checkAuth();
			
			if (authResult.authenticated) {
				console.log('Аутентификация прошла успешно');
				this.isAuthenticated = true;
				this.authorizedUser = authResult.user;

				await this.checkAdminStatus();
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
			this.isAdmin = await AdminService.isAdmin(token);
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
				this.router.navigate(['/login']);
				return;
			}

			const result = await FileService.loadDirectory(token, this.currentPath);

			if ('error' in result) {
				this.error = (result as ErrorContainer).error || 'Unknown error';
				this.files = [];
				this.folders = [];
			} else {
				const dirList = result as DirectoryList;
				this.files = dirList.files;
				this.folders = dirList.folders;
			}
		} catch (err: any) {
			console.error('Load directory error:', err);
			this.error = err.message || 'Failed to load directory.';
			this.files = [];
			this.folders = [];
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
				this.router.navigate(['/login']);
				return;
			}

			const results = await FileService.find(token, this.searchQuery, this.searchPath);
			this.searchResults = results;
		} catch (err: any) {
			console.error('Search error:', err);
			this.error = err.message || 'Search failed.';
			this.searchResults = null;
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
			const exists = await FileService.exists(token, cleanPath);
			if (exists) {
				this.router.navigate(['/files', cleanPath]);
			} else {
				this.error = 'Path does not exist.';
			}
		} catch (err: any) {
			this.error = err.message || 'Failed to check path.';
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

			await FileService.upload(token, file, this.currentPath);
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
				this.router.navigate(['/login']);
				return;
			}

			await FileService.createFolder(token, this.currentPath, folderName);

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

	prepareDelete(path: string, name: string): void {
		this.itemToDelete = { path, name };
		this.showDeleteModal = true;
	}

	closeDeleteModal(): void {
		this.showDeleteModal = false;
		this.itemToDelete = null;
	}

	async handleDelete(): Promise<void> {
		if (!this.itemToDelete) return;

		try {
			const token = AuthService.getToken();
			if (!token) {
				this.router.navigate(['/login']);
				return;
			}

			await FileService.deleteItem(token, this.itemToDelete.path);

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

	async handleDownload(path: string, name: string): Promise<void> {
		try {
			const token = AuthService.getToken();
			if (!token) {
				this.router.navigate(['/login']);
				return;
			}

			const { blob, contentType } = await FileService.downloadFile(token, path);

			// Check if the response is actually an error JSON
			if (contentType && contentType.includes('application/json')) {
				const reader = new FileReader();
				reader.onload = () => {
					try {
						const errorData = JSON.parse(reader.result as string);
						this.error = errorData.error || 'Download failed.';
					} catch {
						this.error = 'Download failed.';
					}
					this.cdr.detectChanges();
				};
				reader.readAsText(blob);
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
			this.error = typeof err === 'string' ? err : err.message || 'Download failed.';
		}
	}
}