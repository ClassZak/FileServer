import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { CreateConfig } from './create-config';
import { FileInfo } from '../model/file-info';
import { FolderInfo } from '../model/folder-info';
import { DefaultServiceResult, DefaultServiceResultWithData } from '../model/default-server-result';

/**
 * Represents the response from the directory listing endpoint.
 */
export class DirectoryList {
	constructor(
		public files: FileInfo[],
		public folders: FolderInfo[]
	) {}
}

/**
 * Represents the structure of search results returned by the API.
 */
export interface SearchResults {
	totalResults: number;
	files: FileInfo[];
	folders: FolderInfo[];
}

/**
 * Represents the structure of file download response.
 */
export interface DownloadFileResult {
	blob: Blob;
	contentType?: string;
}

/**
 * Interface for /api/files/list?path= requests.
 */
interface ApiFilesListWithPathServerResponse {
	files?: Array<FileInfo>;
	folders?: Array<FolderInfo>;
	error?: string;
}

/**
 * Interface for /api/files/exists?path= requests.
 */
interface ApiFilesExistsWithPathServerResponse {
	exists: boolean;
}

/**
 * Information about a deleted file.
 */
export interface DeletedFileInfo {
	originalPath: string;
	deletedAt: string;
	version: number;
	deletedByUserEmail: string;
}

/**
 * Information about a deleted folder.
 */
export interface DeletedFolderInfo {
	originalPath: string;
	deletedAt: string;
	version: number;
	deletedByUserEmail: string;
}

/**
 * Entry in the work history log (matches backend HistoryInfo).
 */
export interface HistoryEntry {
	workTime: Date | string;
	operationType: string;
	userEmail: string;
	path: string;
	isFile: boolean;
	details: string | null;
}

/**
 * Request payload for setting permissions on a file or folder.
 */
export interface SetPermissionRequest {
	path: string;
	userEmail?: string | null;
	groupName?: string | null;
	mode: number;
}

/**
 * Information about a folder permission returned by the API.
 */
export interface FolderPermissionInfo {
	id?: number;
	userEmail?: string;
	groupName?: string;
	mode: number;
}

/**
 * Information about a file permission returned by the API.
 */
export interface FilePermissionInfo {
	id?: number;
	userEmail?: string;
	groupName?: string;
	mode: number;
}

/**
 * Unified permission information used for group / user queries.
 */
export interface PermissionInfo {
	type: 'folder' | 'file';
	path: string;
	userEmail?: string;
	groupName?: string;
	mode: number;
}

/**
 * Service for interacting with file system operations via the backend API.
 * All methods require a valid JWT token and return Promises.
 */
@Injectable({ providedIn: 'root' })
export class FileService {
	constructor(private http: HttpClient) {}

	/**
	 * Checks whether a file or directory exists at the given path.
	 *
	 * @param token - JWT authentication token.
	 * @param path - Path to check (relative to user's root).
	 * @returns Promise resolving to true if the path exists, false otherwise.
	 */
	async exists(token: string, path: string): Promise<DefaultServiceResultWithData<ApiFilesExistsWithPathServerResponse>> {
		try {
			const response = await firstValueFrom(
				this.http.get<ApiFilesExistsWithPathServerResponse>(
					`/api/files/exists?path=${encodeURIComponent(path)}`,
					CreateConfig.createAuthConfig(token)
				)
			);
			return { success: true, data: {exists: response.exists} };
		} catch (error) {
			console.error('FileService.exists error:', error);
			return {success: false, error: 'Failed to check path existence.'}
		}
	}

	/**
	 * Loads the list of files and folders in a given directory.
	 *
	 * @param token - JWT authentication token.
	 * @param path - Directory path (empty string for root).
	 * @returns Promise resolving to a DirectoryList object or an error.
	 */
	async loadDirectory(token: string, path: string): Promise<DefaultServiceResultWithData<DirectoryList>> {
		try {
			const response = await firstValueFrom(
				this.http.get<ApiFilesListWithPathServerResponse>(
					`/api/files/list?path=${encodeURIComponent(path)}`,
					CreateConfig.createAuthConfig(token)
				)
			);
			if (response.error || (!response.files || !response.folders)) {
				throw new Error(response.error);
			}
			return {
				success: true,
				data: new DirectoryList(response.files, response.folders)
			};
		} catch (error) {
			console.error('FileService.loadDirectory error:', error);
			if (error instanceof HttpErrorResponse) {
				return {
					success: false,
					error: error.error?.message || error.message || 'Failed to load directory contents.'
				};
			}
			return {
				success: false,
				error: (error as Error).message
			};
		}
	}

	/**
	 * Searches for files and folders matching a query string, optionally restricted to a subpath.
	 *
	 * @param token - JWT authentication token.
	 * @param query - Search string.
	 * @param path - Base path to search in (empty string for root).
	 * @returns Promise resolving to SearchResults object.
	 */
	async find(token: string, query: string, path: string = ''): Promise<DefaultServiceResultWithData<SearchResults>> {
		try {
			const response = await firstValueFrom(
				this.http.get<SearchResults>(
					`/api/files/search?q=${encodeURIComponent(query)}&path=${encodeURIComponent(path)}`,
					CreateConfig.createAuthConfig(token)
				)
			);
			return {
				success: true,
				data: response
			};
		} catch (error) {
			console.error('FileService.find error:', error);
			let errorMessage: string | undefined;
			if (error instanceof HttpErrorResponse) {
				errorMessage = error.error.error || error.message;
			} else {
				errorMessage = (error as Error).message;
			}
			return {
				success: false,
				error: errorMessage
			};
		}
	}

	/**
	 * Uploads a single file to the specified directory.
	 *
	 * @param token - JWT authentication token.
	 * @param file - The File object to upload.
	 * @param currentPath - Target directory path.
	 * @returns Promise resolving to the uploaded FileInfo.
	 */
	async upload(token: string, file: File, currentPath: string): Promise<DefaultServiceResultWithData<FileInfo>> {
		const formData = new FormData();
		formData.append('file', file);

		try {
			const response = await firstValueFrom(
				this.http.post<FileInfo>(
					`/api/files/upload?path=${encodeURIComponent(currentPath)}`,
					formData,
					CreateConfig.createFileUploadConfig(token)
				)
			);
			return {
				success: true,
				data: response
			};
		} catch (error) {
			let errorMessage: string | undefined;
			if (error instanceof HttpErrorResponse) {
				if (error.status === 403)
					errorMessage = 'У вас нет прав на загрузку файлов в эту директорию.';
				else
					errorMessage = error.error?.message || error.error.error || error.message ||	'неизвестная ошибка';
			}
			errorMessage = !errorMessage ? 'Ошибка отправки файла.' : `Ошибка отправки файла: ${errorMessage}`;
			return {
				success: false,
				error: errorMessage
			};
		}
	}

	/**
	 * Creates a new folder.
	 *
	 * @param token - JWT authentication token.
	 * @param path - Parent directory path.
	 * @param folderName - Name of the new folder.
	 * @returns Promise that resolves when folder is created.
	 */
	async createFolder(token: string, path: string, folderName: string): Promise<DefaultServiceResult> {
		try {
			await firstValueFrom(
				this.http.post(
					'/api/files/create-folder',
					{ path, folderName: folderName.trim() },
					CreateConfig.createAuthConfig(token)
				)
			);
			return { success: true };
		} catch (error) {
			console.error('FileService.createFolder error:', error);
			let errorMessage: string | undefined;
			if (error instanceof HttpErrorResponse) {
				if (error.error?.message) errorMessage = error.error.message;
				if (error.message) errorMessage = error.message;
				if (error.status === 403) errorMessage = 'У вас нет прав для создания директории здесь.';
				else errorMessage = 'Не удалось создать директорию.';
			}
			errorMessage = !errorMessage ? 'Ошибка создания директории.' : `Ошибка создания директории: ${errorMessage}`;
			return {
				success: false,
				error: errorMessage
			};
		}
	}

	/**
	 * Deletes a file or folder (moves to trash).
	 *
	 * @param token - JWT authentication token.
	 * @param itemPath - Full path of the item to delete.
	 * @returns Promise that resolves when deletion is successful.
	 */
	async deleteItem(token: string, itemPath: string): Promise<DefaultServiceResult> {
		try {
			await firstValueFrom(
				this.http.delete(
					`/api/files/delete?path=${encodeURIComponent(itemPath)}`,
					CreateConfig.createAuthConfig(token)
				)
			);
			return { success: true };
		} catch (error) {
			console.error('FileService.deleteItem error:', error);
			let errorMessage: string | undefined;
			if (error instanceof HttpErrorResponse) {
				if (error.error?.message) errorMessage = error.error.message;
				if (error.message) errorMessage = error.message;
				if (error.status === 403) errorMessage = 'У вас нет прав на удаление.';
				else if (error.status === 404) errorMessage = 'Файл или папка не найдена.';
			}
			if (!errorMessage) errorMessage = 'Ошибка удаления';
			else errorMessage = `Ошибка удаления:${errorMessage}`;
			return {
				success: false,
				error: errorMessage
			};
		}
	}

	/**
	 * Downloads a file. Returns the blob and content-type for further processing.
	 *
	 * @param token - JWT authentication token.
	 * @param filePath - Full path of the file to download.
	 * @returns Promise resolving to an object with blob and contentType.
	 */
	async downloadFile(token: string, filePath: string): Promise<DefaultServiceResultWithData<DownloadFileResult>> {
		try {
			const response = await firstValueFrom(
				this.http.get(
					`/api/files/download?path=${encodeURIComponent(filePath)}`,
					{
						headers: CreateConfig.createAuthConfig(token).headers,
						responseType: 'blob',
						observe: 'response'
					}
				)
			);
			return {
				success: true,
				data: {
					blob: response.body!,
					contentType: response.headers.get('content-type')!
				}
			};
		} catch (error) {
			console.error('FileService.downloadFile error:', error);
			let errorMessage: string | undefined;
			if (error instanceof HttpErrorResponse) {
				if (error.status === 403) errorMessage = 'У вас нет права на загрузку данного файла.';
				else if (error.status === 404) errorMessage = 'Файл не найден.';
				else errorMessage = 'Ошибка загрузки.';
			} else {
				errorMessage = `Ошибка загрузки:${(error as Error).message}`;
			}
			return {
				success: false,
				error: errorMessage
			};
		}
	}

	// ---------- Trash / Deleted Items ----------

	/**
	 * Retrieves the list of deleted files visible to the current user.
	 *
	 * @param token - JWT authentication token.
	 * @returns Promise resolving to an array of DeletedFileInfo.
	 */
	async getDeletedFiles(token: string): Promise<DefaultServiceResultWithData<DeletedFileInfo[]>> {
		try {
			const response = await firstValueFrom(
				this.http.get<{ deletedFiles: DeletedFileInfo[] }>(
					'/api/files/deleted/files',
					CreateConfig.createAuthConfig(token)
				)
			);
			return { success: true, data: response.deletedFiles };
		} catch (error) {
			return FileService.handleError(error, 'Ошибка получения списка удалённых файлов');
		}
	}

	/**
	 * Retrieves the list of deleted folders visible to the current user.
	 *
	 * @param token - JWT authentication token.
	 * @returns Promise resolving to an array of DeletedFolderInfo.
	 */
	async getDeletedFolders(token: string): Promise<DefaultServiceResultWithData<DeletedFolderInfo[]>> {
		try {
			const response = await firstValueFrom(
				this.http.get<{ deletedFolders: DeletedFolderInfo[] }>(
					'/api/files/deleted/folders',
					CreateConfig.createAuthConfig(token)
				)
			);
			return { success: true, data: response.deletedFolders };
		} catch (error) {
			return FileService.handleError(error, 'Ошибка получения списка удалённых папок');
		}
	}

	/**
	 * Retrieves deleted file versions for a specific file.
	 *
	 * @param token - JWT authentication token.
	 * @param parentPath - Parent directory of the file.
	 * @param fileName - Name of the file.
	 * @returns Promise resolving to an array of DeletedFileInfo.
	 */
	async getDeletedFileVersions(token: string, parentPath: string, fileName: string): Promise<DefaultServiceResultWithData<DeletedFileInfo[]>> {
		try {
			const params = new HttpParams()
				.set('parentPath', parentPath)
				.set('fileName', fileName);
			const response = await firstValueFrom(
				this.http.get<{ versions: DeletedFileInfo[] }>(
					'/api/files/deleted/file/versions',
					{ headers: CreateConfig.createAuthConfig(token).headers, params }
				)
			);
			return { success: true, data: response.versions };
		} catch (error) {
			return FileService.handleError(error, 'Ошибка получения версий удалённого файла');
		}
	}

	/**
	 * Retrieves deleted folder versions for a specific folder.
	 *
	 * @param token - JWT authentication token.
	 * @param path - Path of the folder.
	 * @returns Promise resolving to an array of DeletedFolderInfo.
	 */
	async getDeletedFolderVersions(token: string, path: string): Promise<DefaultServiceResultWithData<DeletedFolderInfo[]>> {
		try {
			const params = new HttpParams().set('path', path);
			const response = await firstValueFrom(
				this.http.get<{ versions: DeletedFolderInfo[] }>(
					'/api/files/deleted/folder/versions',
					{ headers: CreateConfig.createAuthConfig(token).headers, params }
				)
			);
			return { success: true, data: response.versions };
		} catch (error) {
			return FileService.handleError(error, 'Ошибка получения версий удалённой папки');
		}
	}

	/**
	 * Restores a file from trash by its original path and version.
	 *
	 * @param token - JWT authentication token.
	 * @param originalPath - Original path of the deleted file.
	 * @param version - Version to restore.
	 * @returns Promise that resolves when restoration is complete.
	 */
		async restoreFile(token: string, originalPath: string, version: number): Promise<DefaultServiceResult> {
		try {
			await firstValueFrom(
				this.http.post('/api/files/restore/file', { originalPath, version }, CreateConfig.createAuthConfig(token))
			);
			return { success: true };
		} catch (error) {
			console.error('restoreFile error', error);
			if (error instanceof HttpErrorResponse) {
				if (error.status === 403) return { success: false, error: 'Нет прав на восстановление этого файла.' };
				if (error.status === 409) return { success: false, error: error.error?.error || 'Файл уже восстановлен или путь занят.' };
			}
			return FileService.handleError(error, 'Ошибка восстановления файла');
		}
	}

	/**
	 * Restores a folder from trash by its original path and version.
	 *
	 * @param token - JWT authentication token.
	 * @param originalPath - Original path of the deleted folder.
	 * @param version - Version to restore.
	 * @returns Promise that resolves when restoration is complete.
	 */
		async restoreFolder(token: string, originalPath: string, version: number): Promise<DefaultServiceResult> {
		try {
			await firstValueFrom(
				this.http.post('/api/files/restore/folder', { originalPath, version }, CreateConfig.createAuthConfig(token))
			);
			return { success: true };
		} catch (error) {
			console.error('restoreFolder error', error);
			if (error instanceof HttpErrorResponse) {
				if (error.status === 403) return { success: false, error: 'Нет прав на восстановление этой папки.' };
				if (error.status === 409) return { success: false, error: error.error?.error || 'Папка уже восстановлена или путь занят.' };
			}
			return FileService.handleError(error, 'Ошибка восстановления папки');
		}
	}

	/**
	 * Permanently deletes a file and all its versions (admin only).
	 *
	 * @param token - JWT authentication token.
	 * @param path - Original path of the file.
	 * @returns Promise that resolves when deletion is complete.
	 */
	async permanentDeleteFile(token: string, path: string): Promise<DefaultServiceResult> {
		try {
			await firstValueFrom(
				this.http.delete(
					`/api/files/permanent/file?path=${encodeURIComponent(path)}`,
					CreateConfig.createAuthConfig(token)
				)
			);
			return { success: true };
		} catch (error) {
			return FileService.handleError(error, 'Ошибка окончательного удаления файла');
		}
	}

	/**
	 * Permanently deletes a folder and all its versions (admin only).
	 *
	 * @param token - JWT authentication token.
	 * @param path - Original path of the folder.
	 * @returns Promise that resolves when deletion is complete.
	 */
	async permanentDeleteFolder(token: string, path: string): Promise<DefaultServiceResult> {
		try {
			await firstValueFrom(
				this.http.delete(
					`/api/files/permanent/folder?path=${encodeURIComponent(path)}`,
					CreateConfig.createAuthConfig(token)
				)
			);
			return { success: true };
		} catch (error) {
			return FileService.handleError(error, 'Ошибка окончательного удаления папки');
		}
	}

	// ---------- Permissions ----------

	/**
	 * Retrieves permissions assigned to a specific folder (admin only).
	 *
	 * @param token - JWT authentication token.
	 * @param path - Path of the folder.
	 * @returns Promise resolving to an array of FolderPermissionInfo.
	 */
	async getFolderPermissions(token: string, path: string): Promise<DefaultServiceResultWithData<FolderPermissionInfo[]>> {
		try {
			const params = new HttpParams().set('path', path);
			const response = await firstValueFrom(
				this.http.get<{ permissions: FolderPermissionInfo[] }>(
					'/api/files/permissions/folder',
					{ headers: CreateConfig.createAuthConfig(token).headers, params }
				)
			);
			return { success: true, data: response.permissions };
		} catch (error) {
			return FileService.handleError(error, 'Ошибка получения прав на папку');
		}
	}

	/**
	 * Retrieves permissions assigned to a specific file (admin only).
	 *
	 * @param token - JWT authentication token.
	 * @param path - Path of the file.
	 * @returns Promise resolving to an array of FilePermissionInfo.
	 */
	async getFilePermissions(token: string, path: string): Promise<DefaultServiceResultWithData<FilePermissionInfo[]>> {
		try {
			const params = new HttpParams().set('path', path);
			const response = await firstValueFrom(
				this.http.get<{ permissions: FilePermissionInfo[] }>(
					'/api/files/permissions/file',
					{ headers: CreateConfig.createAuthConfig(token).headers, params }
				)
			);
			return { success: true, data: response.permissions };
		} catch (error) {
			return FileService.handleError(error, 'Ошибка получения прав на файл');
		}
	}

	/**
	 * Retrieves all permissions granted to a specific group.
	 * Admin sees all, member sees their group's permissions.
	 *
	 * @param token - JWT authentication token.
	 * @param groupName - Name of the group.
	 * @returns Promise resolving to an array of PermissionInfo.
	 */
	async getGroupPermissions(token: string, groupName: string): Promise<DefaultServiceResultWithData<PermissionInfo[]>> {
		try {
			const response = await firstValueFrom(
				this.http.get<{ permissions: PermissionInfo[] }>(
					`/api/files/permissions/group/${groupName}`,
					CreateConfig.createAuthConfig(token)
				)
			);
			return { success: true, data: response.permissions };
		} catch (error) {
			return FileService.handleError(error, 'Ошибка получения прав группы');
		}
	}

	/**
	 * Retrieves all permissions granted to a specific user.
	 * Admin can request any user's permissions, regular user only their own.
	 *
	 * @param token - JWT authentication token.
	 * @param userEmail - Email of the user.
	 * @returns Promise resolving to an array of PermissionInfo.
	 */
	async getUserPermissions(token: string, userEmail: string): Promise<DefaultServiceResultWithData<PermissionInfo[]>> {
		try {
			const response = await firstValueFrom(
				this.http.get<{ permissions: PermissionInfo[] }>(
					`/api/files/permissions/user/${userEmail}`,
					CreateConfig.createAuthConfig(token)
				)
			);
			return { success: true, data: response.permissions };
		} catch (error) {
			return FileService.handleError(error, 'Ошибка получения прав пользователя');
		}
	}

	/**
	 * Sets permissions on a folder.
	 *
	 * @param token - JWT authentication token.
	 * @param request - Permission details (path, userEmail/groupName, mode).
	 * @returns Promise resolving when permissions are set.
	 */
	async setFolderPermission(token: string, request: SetPermissionRequest): Promise<DefaultServiceResult> {
		try {
			await firstValueFrom(
				this.http.put('/api/files/permissions/folder', request, CreateConfig.createAuthConfig(token))
			);
			return { success: true };
		} catch (error) {
			return FileService.handleError(error, 'Ошибка установки прав на папку');
		}
	}

	/**
	 * Deletes explicit permissions on a folder.
	 *
	 * @param token - JWT authentication token.
	 * @param path - Path of the folder.
	 * @param userEmail - Email of the user whose permission is removed (optional).
	 * @param groupName - Name of the group whose permission is removed (optional).
	 * @returns Promise resolving when permissions are removed.
	 */
	async deleteFolderPermission(token: string, path: string, userEmail?: string, groupName?: string): Promise<DefaultServiceResult> {
		try {
			let params = new HttpParams().set('path', path);
			if (userEmail) params = params.set('userEmail', userEmail);
			if (groupName) params = params.set('groupName', groupName);
			await firstValueFrom(
				this.http.delete('/api/files/permissions/folder', {
					headers: CreateConfig.createAuthConfig(token).headers,
					params
				})
			);
			return { success: true };
		} catch (error) {
			return FileService.handleError(error, 'Ошибка удаления прав на папку');
		}
	}

	/**
	 * Sets permissions on a file.
	 *
	 * @param token - JWT authentication token.
	 * @param request - Permission details (path, userEmail/groupName, mode).
	 * @returns Promise resolving when permissions are set.
	 */
	async setFilePermission(token: string, request: SetPermissionRequest): Promise<DefaultServiceResult> {
		try {
			await firstValueFrom(
				this.http.put('/api/files/permissions/file', request, CreateConfig.createAuthConfig(token))
			);
			return { success: true };
		} catch (error) {
			return FileService.handleError(error, 'Ошибка установки прав на файл');
		}
	}

	/**
	 * Deletes explicit permissions on a file.
	 *
	 * @param token - JWT authentication token.
	 * @param path - Path of the file.
	 * @param userEmail - Email of the user whose permission is removed (optional).
	 * @param groupName - Name of the group whose permission is removed (optional).
	 * @returns Promise resolving when permissions are removed.
	 */
	async deleteFilePermission(token: string, path: string, userEmail?: string, groupName?: string): Promise<DefaultServiceResult> {
		try {
			let params = new HttpParams().set('path', path);
			if (userEmail) params = params.set('userEmail', userEmail);
			if (groupName) params = params.set('groupName', groupName);
			await firstValueFrom(
				this.http.delete('/api/files/permissions/file', {
					headers: CreateConfig.createAuthConfig(token).headers,
					params
				})
			);
			return { success: true };
		} catch (error) {
			return FileService.handleError(error, 'Ошибка удаления прав на файл');
		}
	}

	// ---------- History ----------

	/**
	 * Retrieves work history entries based on optional filters.
	 *
	 * @param token - JWT authentication token.
	 * @param filters - Optional filters: userEmail, pathPrefix, isFile.
	 * @returns Promise resolving to an array of HistoryEntry.
	 */
	async getHistory(
		token: string,
		filters?: { userEmail?: string; pathPrefix?: string; isFile?: boolean }
	): Promise<DefaultServiceResultWithData<HistoryEntry[]>> {
		try {
			let params = new HttpParams();
			if (filters?.userEmail) params = params.set('userEmail', filters.userEmail);
			if (filters?.pathPrefix) params = params.set('pathPrefix', filters.pathPrefix);
			if (filters?.isFile !== undefined) params = params.set('isFile', String(filters.isFile));
			const response = await firstValueFrom(
				this.http.get<{ history: HistoryEntry[] }>('/api/files/history', {
					headers: CreateConfig.createAuthConfig(token).headers,
					params
				})
			);
			return { success: true, data: response.history };
		} catch (error) {
			return FileService.handleError(error, 'Ошибка получения истории');
		}
	}

	/**
	 * Centralized error handler for HTTP errors.
	 *
	 * @param error - The caught error.
	 * @param defaultMessage - Fallback message.
	 * @returns DefaultServiceResult with error information.
	 */
	private static handleError(error: any, defaultMessage: string): DefaultServiceResult {
		console.error(defaultMessage, error);
		let message = defaultMessage;
		if (error instanceof HttpErrorResponse) {
			message = error.error?.error || error.message || message;
			if (error.status === 403) message = message ? `Доступ запрещён: ${message}` : 'Доступ запрещён';
			else if (error.status === 404) message = message ? `Не найдено ${message}` : 'Не найдено';
			else if (error.status === 409) message = error.error?.error || 'Конфликт: объект был удалён ранее';
		}
		return { success: false, error: message };
	}

		/**
	 * Downloads a deleted file from the trash by its original path and version.
	 *
	 * @param token - JWT authentication token.
	 * @param originalPath - Original path of the deleted file.
	 * @param version - Version to download.
	 * @returns Promise resolving to an object with blob and contentType.
	 */
	async downloadDeletedFile(
		token: string,
		originalPath: string,
		version: number
	): Promise<DefaultServiceResultWithData<DownloadFileResult>> {
		try {
			const response = await firstValueFrom(
				this.http.get(
					`/api/files/download/deleted?path=${encodeURIComponent(originalPath)}&version=${version}`,
					{
						headers: CreateConfig.createAuthConfig(token).headers,
						responseType: 'blob',
						observe: 'response'
					}
				)
			);
			return {
				success: true,
				data: {
					blob: response.body!,
					contentType: response.headers.get('content-type')!
				}
			};
		} catch (error) {
			console.error('FileService.downloadDeletedFile error:', error);
			let errorMessage = 'Ошибка скачивания удалённого файла';
			if (error instanceof HttpErrorResponse) {
				if (error.status === 403) errorMessage = 'У вас нет прав на скачивание этого файла из корзины.';
				else if (error.status === 404) errorMessage = 'Удалённый файл не найден.';
				else errorMessage = error.error?.error || error.message || errorMessage;
			}
			return { success: false, error: errorMessage };
		}
	}


}