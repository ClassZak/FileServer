import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/service/auth-service';
import { LoadingSpinner } from '../../component/loading-spinner/loading-spinner';
import { AppHeader } from "../../app-header/app-header";
import { AppFooter } from "../../app-footer/app-footer";
import { DirectoryList, FileService } from '../../core/service/file-service';
import { FileInfo } from '../../core/model/file-info';
import { FolderInfo } from '../../core/model/folder-info';
import { ErrorContainer } from '../../core/model/error-container';

@Component({
	selector: 'app-files-page',
	imports: [
		LoadingSpinner,
		AppHeader,
		AppFooter
	],
	templateUrl: './files-page.html',
	styleUrl: './files-page.css',
})
export class FilesPage implements OnInit {
	isAuthenticated: boolean = false;
	isLoading: boolean = true;
	isSearchMode: boolean = false;
	currentPath: string = '';
	files: Array<FileInfo> = [];
	folders: Array<FolderInfo> = [];
	constructor(
		private router: Router,
		private cdr: ChangeDetectorRef
	) {}

	async ngOnInit(): Promise<void> {
		try {
			await this.checkAuthentication();
			await Promise.all([this.loadDirectory()]);
		} catch (error) {
			console.error('Ошибка при загрузке страницы:', error);
		} finally {
			this.cdr.detectChanges();
		}
	}

	private async checkAuthentication(): Promise<void> {
		try {
			this.isLoading = true;
			const authResult = await AuthService.checkAuth();
			
			if (authResult.authenticated) {
				console.log('Аутентификация прошла успешно');
				this.isAuthenticated = true;
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
	}

	public async loadDirectory(){
		try {
			this.isLoading = true;
			const token = AuthService.getToken();
			if (token === null) throw new Error('У вас нет токена авторизации');

			const response = await FileService.loadDirectory(token, this.currentPath);
			const error = response as ErrorContainer;
			if (error && error.error)
				throw Error(error.error);
			const dirList = response as DirectoryList;
			if (dirList){
				if (dirList.files)
					this.files = dirList.files;
				if (dirList.folders)
					this.folders = dirList.folders;
			}
		} catch (error){
			console.error(error);
			// TODO: notice
		} finally {
			this.isLoading = false;
		}
	}
}
