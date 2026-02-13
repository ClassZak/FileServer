import { ChangeDetectorRef, Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/service/auth-service';

@Component({
	selector: 'app-files-page',
	imports: [],
	templateUrl: './files-page.html',
	styleUrl: './files-page.css',
})
export class FilesPage {
	isAuthenticated: boolean = false;
	isLoading: boolean = true;
	isSearchMode: boolean = false;
	constructor(
		private router: Router,
		private cdr: ChangeDetectorRef
	) {}

	async ngOnInit(): Promise<void> {
		try {
			await this.checkAuthentication();
		} catch (error) {
			console.error('Ошибка при загрузке страницы:', error);
		}
	}

	private async checkAuthentication(): Promise<void> {
		try {
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
		this.cdr.detectChanges();
	}
}
