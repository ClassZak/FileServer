import { Injectable } from '@angular/core';
import axios, { AxiosError, AxiosRequestConfig } from 'axios';
import { FileInfo } from '../model/file-info';
import { FolderInfo } from '../model/folder-info';
import { ErrorContainer } from '../model/error-container';

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
 * Service for interacting with file system operations via the backend API.
 * All methods require a valid JWT token and return Promises.
 * Errors are caught and rethrown as user-friendly messages when possible.
 */
@Injectable({
	providedIn: 'root',
})
export class FileService {
	/**
	 * Creates an Axios configuration object with the Authorization header.
	 * Made public so it can be reused in other parts if needed.
	 *
	 * @param token - JWT token.
	 * @returns AxiosRequestConfig for JSON requests.
	 */
	static createAuthConfig(token: string): AxiosRequestConfig {
		return {
			headers: {
				Authorization: `Bearer ${token}`,
				'Content-Type': 'application/json',
			},
		};
	}

	/**
	 * Creates an Axios configuration object suitable for multipart/form-data uploads.
	 *
	 * @param token - JWT token.
	 * @returns AxiosRequestConfig for file uploads.
	 */
	static createFileUploadConfig(token: string): AxiosRequestConfig {
		return {
			headers: {
				Authorization: `Bearer ${token}`,
				'Content-Type': 'multipart/form-data',
			},
		};
	}

	/**
	 * Checks whether a file or directory exists at the given path.
	 *
	 * @param token - JWT authentication token.
	 * @param path - Path to check (relative to user's root).
	 * @returns Promise resolving to `true` if the path exists, `false` otherwise.
	 * @throws Will throw an error if the request fails (network error, 5xx, etc.).
	 */
	static async exists(token: string, path: string): Promise<boolean> {
		try {
			const response = await axios.get<{ exists: boolean }>(
				`/api/files/exists?path=${encodeURIComponent(path)}`,
				this.createAuthConfig(token)
			);
			return response.data.exists;
		} catch (error) {
			console.error('FileService.exists error:', error);
			throw new Error('Failed to check path existence.');
		}
	}

	/**
	 * Loads the list of files and folders in a given directory.
	 *
	 * @param token - JWT authentication token.
	 * @param path - Directory path (empty string for root).
	 * @returns Promise resolving to a DirectoryList object or an ErrorContainer.
	 *					If the API returns an error structure, it is returned as ErrorContainer.
	 * @throws Will throw an error for network failures or unexpected responses.
	 */
	static async loadDirectory(token: string, path: string): Promise<DirectoryList | ErrorContainer> {
		try {
			const response = await axios.get<{ files: FileInfo[]; folders: FolderInfo[] }>(
				`/api/files/list?path=${encodeURIComponent(path)}`,
				this.createAuthConfig(token)
			);
			return new DirectoryList(response.data.files, response.data.folders);
		} catch (error: any) {
			console.error('FileService.loadDirectory error:', error);
			if (error.response?.data?.error) {
				return { error: error.response.data.error } as ErrorContainer;
			}
			throw new Error('Failed to load directory contents.');
		}
	}

	/**
	 * Searches for files and folders matching a query string, optionally restricted to a subpath.
	 *
	 * @param token - JWT authentication token.
	 * @param query - Search string.
	 * @param path - Base path to search in (empty string for root).
	 * @returns Promise resolving to SearchResults object.
	 * @throws Will throw an error if the request fails.
	 */
	static async find(token: string, query: string, path: string = ''): Promise<SearchResults> {
		try {
			const response = await axios.get<SearchResults>(
				`/api/files/search?q=${encodeURIComponent(query)}&path=${encodeURIComponent(path)}`,
				this.createAuthConfig(token)
			);
			return response.data;
		} catch (error) {
			console.error('FileService.find error:', error);
			throw new Error('Search failed.');
		}
	}

	/**
	 * Uploads a single file to the specified directory.
	 *
	 * @param token - JWT authentication token.
	 * @param file - The File object to upload.
	 * @param currentPath - Target directory path.
	 * @returns Promise resolving to the uploaded FileInfo (returned by the server).
	 * @throws Will throw a user-friendly error message string on failure.
	 */
	static async upload(token: string, file: File, currentPath: string): Promise<FileInfo> {
		const formData = new FormData();
		formData.append('file', file);

		try {
			const response = await axios.post<FileInfo>(
				`/api/files/upload?path=${encodeURIComponent(currentPath)}`,
				formData,
				this.createFileUploadConfig(token)
			);
			return response.data;
		} catch (error) {
			const axiosError = error as AxiosError<{ error?: string }>;
			const errorData = axiosError.response?.data;
			console.error('FileService.upload error:', axiosError);

			if (errorData?.error) {
				throw errorData.error;
			} else if (axiosError.response?.status === 403) {
				throw 'You do not have permission to upload files to this directory.';
			} else if (axiosError.response?.status === 400) {
				throw `Upload error: ${errorData?.error || 'unknown error'}`;
			} else {
				throw 'File upload failed.';
			}
		}
	}

	/**
	 * Creates a new folder.
	 *
	 * @param token - JWT authentication token.
	 * @param path - Parent directory path.
	 * @param folderName - Name of the new folder.
	 * @returns Promise that resolves when folder is created.
	 * @throws Will throw a user-friendly error message string on failure.
	 */
	static async createFolder(token: string, path: string, folderName: string): Promise<void> {
		try {
			await axios.post(
				'/api/files/create-folder',
				{ path, folderName: folderName.trim() },
				this.createAuthConfig(token)
			);
		} catch (error: any) {
			console.error('FileService.createFolder error:', error);
			const errorData = error.response?.data;
			if (errorData?.error) {
				throw errorData.error;
			} else if (error.response?.status === 403) {
				throw 'You do not have permission to create folders here.';
			} else {
				throw 'Failed to create folder.';
			}
		}
	}

	/**
	 * Deletes a file or folder.
	 *
	 * @param token - JWT authentication token.
	 * @param itemPath - Full path of the item to delete.
	 * @returns Promise that resolves when deletion is successful.
	 * @throws Will throw a user-friendly error message string on failure.
	 */
	static async deleteItem(token: string, itemPath: string): Promise<void> {
		try {
			await axios.delete('/api/files/delete', {
				data: { path: itemPath },
				headers: { Authorization: `Bearer ${token}` },
			});
		} catch (error: any) {
			console.error('FileService.deleteItem error:', error);
			const errorData = error.response?.data;
			if (errorData?.error) {
				throw errorData.error;
			} else if (error.response?.status === 403) {
				throw 'You do not have permission to delete.';
			} else if (error.response?.status === 404) {
				throw 'File or folder not found.';
			} else {
				throw 'Deletion failed.';
			}
		}
	}

	/**
	 * Downloads a file. Returns the blob and content-type for further processing.
	 *
	 * @param token - JWT authentication token.
	 * @param filePath - Full path of the file to download.
	 * @returns Promise resolving to an object with blob and contentType.
	 * @throws Will throw a user-friendly error message string on failure.
	 */
	static async downloadFile(token: string, filePath: string): Promise<{ blob: Blob; contentType: string | null }> {
		try {
			const response = await axios.get(`/api/files/download?path=${encodeURIComponent(filePath)}`, {
				headers: { Authorization: `Bearer ${token}` },
				responseType: 'blob',
			});
			const contentType = response.headers['content-type'] || null;
			return { blob: response.data, contentType };
		} catch (error: any) {
			console.error('FileService.downloadFile error:', error);
			const errorData = error.response?.data;
			// If the response is JSON error, we need to read it as text (handled in component)
			// Here we just rethrow with a message
			if (error.response?.status === 403) {
				throw 'You do not have permission to download this file.';
			} else if (error.response?.status === 404) {
				throw 'File not found.';
			} else {
				throw 'Download failed.';
			}
		}
	}
}