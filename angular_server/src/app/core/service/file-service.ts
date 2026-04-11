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
	id: number;
	originalPath: string;
	deletedAt: string;
	version: number;
	deletedByUserId: number;
	deletedByUserEmail: string;
}

/**
 * Information about a deleted folder.
 */
export interface DeletedFolderInfo {
	id: number;
	originalPath: string;
	deletedAt: string;
	version: number;
	deletedByUserId: number;
	deletedByUserEmail: string;
}

/**
 * Entry in the work history log.
 */
export interface WorkHistoryEntry {
	id: number;
	workTime: string;
	operationType: { id: number; name: string };
	user: { id: number; email: string };
	fileEntity: { id: number; path: string } | null;
	folderEntity: { id: number; path: string } | null;
	path: string;
	isFile: boolean;
	details: string | null;
}

/**
 * Request payload for setting permissions on a file or folder.
 */
export interface SetPermissionRequest {
	path: string;
	userId?: number;
	groupId?: number;
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
					CreateConfig.createAuthConfigNew(token)
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
					CreateConfig.createAuthConfigNew(token)
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
					CreateConfig.createAuthConfigNew(token)
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
					CreateConfig.createFileUploadConfigNew(token)
				)
			);
			return {
				success: true,
				data: response
			};
		} catch (error) {
			let errorMessage: string | undefined;
			if (error instanceof HttpErrorResponse) {
				if (error.error?.message) errorMessage = error.error.message;
				if (error.message) errorMessage = error.message;
				if (error.status === 403) errorMessage = 'У вас нет прав на загрузку файлов в эту директорию.';
				if (error.status === 400) errorMessage = error?.error || 'неизвестная ошибка';
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
					CreateConfig.createAuthConfigNew(token)
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
					CreateConfig.createAuthConfigNew(token)
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
						headers: CreateConfig.createAuthConfigNew(token).headers,
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
					CreateConfig.createAuthConfigNew(token)
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
					CreateConfig.createAuthConfigNew(token)
				)
			);
			return { success: true, data: response.deletedFolders };
		} catch (error) {
			return FileService.handleError(error, 'Ошибка получения списка удалённых папок');
		}
	}

	/**
	 * Restores a file from trash.
	 *
	 * @param token - JWT authentication token.
	 * @param deletedId - ID of the deleted file record.
	 * @returns Promise resolving when restoration is complete.
	 */
	async restoreFile(token: string, deletedId: number): Promise<DefaultServiceResult> {
		try {
			await firstValueFrom(
				this.http.post(
					`/api/files/restore/file/${deletedId}`,
					{},
					CreateConfig.createAuthConfigNew(token)
				)
			);
			return { success: true };
		} catch (error) {
			return FileService.handleError(error, 'Ошибка восстановления файла');
		}
	}

	/**
	 * Restores a folder from trash.
	 *
	 * @param token - JWT authentication token.
	 * @param deletedId - ID of the deleted folder record.
	 * @returns Promise resolving when restoration is complete.
	 */
	async restoreFolder(token: string, deletedId: number): Promise<DefaultServiceResult> {
		try {
			await firstValueFrom(
				this.http.post(
					`/api/files/restore/folder/${deletedId}`,
					{},
					CreateConfig.createAuthConfigNew(token)
				)
			);
			return { success: true };
		} catch (error) {
			return FileService.handleError(error, 'Ошибка восстановления папки');
		}
	}

	/**
	 * Permanently deletes a file from trash (admin only).
	 *
	 * @param token - JWT authentication token.
	 * @param deletedId - ID of the deleted file record.
	 * @returns Promise resolving when deletion is complete.
	 */
	async permanentDeleteFile(token: string, deletedId: number): Promise<DefaultServiceResult> {
		try {
			await firstValueFrom(
				this.http.delete(
					`/api/files/permanent/file/${deletedId}`,
					CreateConfig.createAuthConfigNew(token)
				)
			);
			return { success: true };
		} catch (error) {
			return FileService.handleError(error, 'Ошибка окончательного удаления файла');
		}
	}

	/**
	 * Permanently deletes a folder from trash (admin only).
	 *
	 * @param token - JWT authentication token.
	 * @param deletedId - ID of the deleted folder record.
	 * @returns Promise resolving when deletion is complete.
	 */
	async permanentDeleteFolder(token: string, deletedId: number): Promise<DefaultServiceResult> {
		try {
			await firstValueFrom(
				this.http.delete(
					`/api/files/permanent/folder/${deletedId}`,
					CreateConfig.createAuthConfigNew(token)
				)
			);
			return { success: true };
		} catch (error) {
			return FileService.handleError(error, 'Ошибка окончательного удаления папки');
		}
	}

	// ---------- Permissions ----------

	/**
	 * Sets permissions on a folder.
	 *
	 * @param token - JWT authentication token.
	 * @param request - Permission details (path, userId/groupId, mode).
	 * @returns Promise resolving when permissions are set.
	 */
	async setFolderPermission(token: string, request: SetPermissionRequest): Promise<DefaultServiceResult> {
		try {
			await firstValueFrom(
				this.http.put('/api/files/permissions/folder', request, CreateConfig.createAuthConfigNew(token))
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
	 * @param permissionId - ID of the permission record.
	 * @returns Promise resolving when permissions are removed.
	 */
	async deleteFolderPermission(token: string, permissionId: number): Promise<DefaultServiceResult> {
		try {
			await firstValueFrom(
				this.http.delete(`/api/files/permissions/folder/${permissionId}`, CreateConfig.createAuthConfigNew(token))
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
	 * @param request - Permission details (path, userId/groupId, mode).
	 * @returns Promise resolving when permissions are set.
	 */
	async setFilePermission(token: string, request: SetPermissionRequest): Promise<DefaultServiceResult> {
		try {
			await firstValueFrom(
				this.http.put('/api/files/permissions/file', request, CreateConfig.createAuthConfigNew(token))
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
	 * @param permissionId - ID of the permission record.
	 * @returns Promise resolving when permissions are removed.
	 */
	async deleteFilePermission(token: string, permissionId: number): Promise<DefaultServiceResult> {
		try {
			await firstValueFrom(
				this.http.delete(`/api/files/permissions/file/${permissionId}`, CreateConfig.createAuthConfigNew(token))
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
	 * @param filters - Optional filters: userId, pathPrefix, isFile.
	 * @returns Promise resolving to an array of WorkHistoryEntry.
	 */
	async getHistory(
		token: string,
		filters?: { userId?: number; pathPrefix?: string; isFile?: boolean }
	): Promise<DefaultServiceResultWithData<WorkHistoryEntry[]>> {
		try {
			let params = new HttpParams();
			if (filters?.userId) params = params.set('userId', filters.userId);
			if (filters?.pathPrefix) params = params.set('pathPrefix', filters.pathPrefix);
			if (filters?.isFile !== undefined) params = params.set('isFile', filters.isFile);
			const response = await firstValueFrom(
				this.http.get<{ history: WorkHistoryEntry[] }>('/api/files/history', {
					headers: CreateConfig.createAuthConfigNew(token).headers,
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
}