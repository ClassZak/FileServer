import { TestBed } from '@angular/core/testing';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { FileService, DirectoryList, SearchResults } from './file-service';

describe('FileService (updated API)', () => {
	let service: FileService;
	let httpMock: HttpTestingController;

	beforeEach(() => {
		TestBed.resetTestingModule();
		TestBed.configureTestingModule({
			providers: [
				FileService,
				provideHttpClient(),
				provideHttpClientTesting()
			]
		});
		service = TestBed.inject(FileService);
		httpMock = TestBed.inject(HttpTestingController);
	});

	afterEach(() => {
		httpMock.verify();
	});

	// ---------- Basic operations ----------
	it('should load directory', async () => {
		const token = 'fake-token';
		const path = 'some/path';
		const mockFiles = [{ name: 'file.txt', fullPath: 'some/path/file.txt', lastModified: new Date(), size: 100, extension: 'txt', readableSize: '100 B' }];
		const mockFolders = Array<any>();

		const resultPromise = service.loadDirectory(token, path);

		const req = httpMock.expectOne(`/api/files/list?path=${encodeURIComponent(path)}`);
		expect(req.request.method).toBe('GET');
		expect(req.request.headers.get('Authorization')).toBe(`Bearer ${token}`);
		req.flush({ files: mockFiles, folders: mockFolders });

		const result = await resultPromise;
		expect(result.success).toBe(true);
		expect(result.data).toBeInstanceOf(DirectoryList);
		expect(result.data!.files.length).toBe(1);
	});

	it('should search files', async () => {
		const token = 'fake-token';
		const query = 'test';
		const path = '';
		const mockResults: SearchResults = { totalResults: 1, files: [], folders: [] };

		const resultPromise = service.find(token, query, path);

		const req = httpMock.expectOne(`/api/files/search?q=${encodeURIComponent(query)}&path=${encodeURIComponent(path)}`);
		req.flush(mockResults);

		const result = await resultPromise;
		expect(result.success).toBe(true);
		expect(result.data).toEqual(mockResults);
	});

	it('should upload a file', async () => {
		const token = 'fake-token';
		const currentPath = '';
		const file = new File(['content'], 'test.txt', { type: 'text/plain' });
		const mockFileInfo = { name: 'test.txt', fullPath: 'test.txt', lastModified: new Date(), size: 7, extension: 'txt', readableSize: '7 B' };

		const resultPromise = service.upload(token, file, currentPath);

		const req = httpMock.expectOne(`/api/files/upload?path=${encodeURIComponent(currentPath)}`);
		expect(req.request.method).toBe('POST');
		expect(req.request.headers.get('Authorization')).toBe(`Bearer ${token}`);
		expect(req.request.body instanceof FormData).toBe(true);
		req.flush(mockFileInfo);

		const result = await resultPromise;
		expect(result.success).toBe(true);
		expect(result.data).toEqual(mockFileInfo);
	});

	it('should create a folder', async () => {
		const token = 'fake-token';
		const path = '';
		const folderName = 'newFolder';

		const resultPromise = service.createFolder(token, path, folderName);

		const req = httpMock.expectOne('/api/files/create-folder');
		expect(req.request.method).toBe('POST');
		expect(req.request.body).toEqual({ path, folderName: folderName.trim() });
		req.flush({});

		const result = await resultPromise;
		expect(result.success).toBe(true);
	});

	it('should delete an item', async () => {
		const token = 'fake-token';
		const itemPath = 'file.txt';

		const resultPromise = service.deleteItem(token, itemPath);

		const req = httpMock.expectOne(`/api/files/delete?path=${encodeURIComponent(itemPath)}`);
		expect(req.request.method).toBe('DELETE');
		req.flush({});

		const result = await resultPromise;
		expect(result.success).toBe(true);
	});

	it('should download a file', async () => {
		const token = 'fake-token';
		const filePath = 'file.txt';
		const mockBlob = new Blob(['content'], { type: 'text/plain' });

		const resultPromise = service.downloadFile(token, filePath);

		const req = httpMock.expectOne(`/api/files/download?path=${encodeURIComponent(filePath)}`);
		expect(req.request.method).toBe('GET');
		expect(req.request.headers.get('Authorization')).toBe(`Bearer ${token}`);
		req.flush(mockBlob, { headers: { 'content-type': 'text/plain' } });

		const result = await resultPromise;
		expect(result.success).toBe(true);
		expect(result.data?.blob).toBe(mockBlob);
		expect(result.data?.contentType).toBe('text/plain');
	});

	it('should check existence (exists)', async () => {
		const token = 'fake-token';
		const path = 'some/path';

		const resultPromise = service.exists(token, path);

		const req = httpMock.expectOne(`/api/files/exists?path=${encodeURIComponent(path)}`);
		expect(req.request.method).toBe('GET');
		expect(req.request.headers.get('Authorization')).toBe(`Bearer ${token}`);
		req.flush({ exists: true });

		const result = await resultPromise;
		expect(result.success).toBe(true);
		expect(result.data?.exists).toBe(true);
	});

	// ---------- Deleted items ----------
	it('should get deleted files', async () => {
		const token = 'fake-token';
		const mockDeletedFiles = [
			{ originalPath: 'file.txt', deletedAt: new Date().toISOString(), version: 1, deletedByUserEmail: 'user@example.com' }
		];

		const resultPromise = service.getDeletedFiles(token);

		const req = httpMock.expectOne('/api/files/deleted/files');
		expect(req.request.method).toBe('GET');
		req.flush({ deletedFiles: mockDeletedFiles });

		const result = await resultPromise;
		expect(result.success).toBe(true);
		expect(result.data).toEqual(mockDeletedFiles);
	});

	it('should get deleted folders', async () => {
		const token = 'fake-token';
		const mockDeletedFolders = [
			{ originalPath: 'folder', deletedAt: new Date().toISOString(), version: 1, deletedByUserEmail: 'user@example.com' }
		];

		const resultPromise = service.getDeletedFolders(token);

		const req = httpMock.expectOne('/api/files/deleted/folders');
		expect(req.request.method).toBe('GET');
		req.flush({ deletedFolders: mockDeletedFolders });

		const result = await resultPromise;
		expect(result.success).toBe(true);
		expect(result.data).toEqual(mockDeletedFolders);
	});

	it('should get deleted file versions', async () => {
		const token = 'fake-token';
		const parentPath = 'docs';
		const fileName = 'report.pdf';
		const mockVersions = [
			{ originalPath: 'docs/report.pdf', deletedAt: new Date().toISOString(), version: 1, deletedByUserEmail: 'user@example.com' },
			{ originalPath: 'docs/report.pdf', deletedAt: new Date().toISOString(), version: 2, deletedByUserEmail: 'user@example.com' }
		];

		const resultPromise = service.getDeletedFileVersions(token, parentPath, fileName);

		const req = httpMock.expectOne(req =>
			req.url === '/api/files/deleted/file/versions'
			&& req.params.get('parentPath') === parentPath
			&& req.params.get('fileName') === fileName
		);
		expect(req.request.method).toBe('GET');
		req.flush({ versions: mockVersions });

		const result = await resultPromise;
		expect(result.success).toBe(true);
		expect(result.data).toEqual(mockVersions);
	});

	it('should get deleted folder versions', async () => {
		const token = 'fake-token';
		const path = 'project';
		const mockVersions = [
			{ originalPath: 'project', deletedAt: new Date().toISOString(), version: 1, deletedByUserEmail: 'user@example.com' }
		];

		const resultPromise = service.getDeletedFolderVersions(token, path);

		const req = httpMock.expectOne(req =>
			req.url === '/api/files/deleted/folder/versions'
			&& req.params.get('path') === path
		);
		expect(req.request.method).toBe('GET');
		req.flush({ versions: mockVersions });

		const result = await resultPromise;
		expect(result.success).toBe(true);
		expect(result.data).toEqual(mockVersions);
	});

	it('should restore a file by path and version', async () => {
		const token = 'fake-token';
		const originalPath = 'documents/notes.txt';
		const version = 2;

		const resultPromise = service.restoreFile(token, originalPath, version);

		const req = httpMock.expectOne('/api/files/restore/file');
		expect(req.request.method).toBe('POST');
		expect(req.request.body).toEqual({ originalPath, version });
		req.flush({});

		const result = await resultPromise;
		expect(result.success).toBe(true);
	});

	it('should restore a folder by path and version', async () => {
		const token = 'fake-token';
		const originalPath = 'projects/old';
		const version = 1;

		const resultPromise = service.restoreFolder(token, originalPath, version);

		const req = httpMock.expectOne('/api/files/restore/folder');
		expect(req.request.method).toBe('POST');
		expect(req.request.body).toEqual({ originalPath, version });
		req.flush({});

		const result = await resultPromise;
		expect(result.success).toBe(true);
	});

	it('should permanently delete a file by path', async () => {
		const token = 'fake-token';
		const path = 'tmp/log.txt';

		const resultPromise = service.permanentDeleteFile(token, path);

		const req = httpMock.expectOne(`/api/files/permanent/file?path=${encodeURIComponent(path)}`);
		expect(req.request.method).toBe('DELETE');
		req.flush({});

		const result = await resultPromise;
		expect(result.success).toBe(true);
	});

	it('should permanently delete a folder by path', async () => {
		const token = 'fake-token';
		const path = 'tmp/old_project';

		const resultPromise = service.permanentDeleteFolder(token, path);

		const req = httpMock.expectOne(`/api/files/permanent/folder?path=${encodeURIComponent(path)}`);
		expect(req.request.method).toBe('DELETE');
		req.flush({});

		const result = await resultPromise;
		expect(result.success).toBe(true);
	});

	// ---------- Download deleted file (new) ----------
	it('should download a deleted file from trash', async () => {
		const token = 'fake-token';
		const originalPath = 'archive.zip';
		const version = 1;
		const mockBlob = new Blob(['old-content'], { type: 'application/zip' });

		const resultPromise = service.downloadDeletedFile(token, originalPath, version);

		const req = httpMock.expectOne(
			`/api/files/download/deleted?path=${encodeURIComponent(originalPath)}&version=${version}`
		);
		expect(req.request.method).toBe('GET');
		expect(req.request.headers.get('Authorization')).toBe(`Bearer ${token}`);
		req.flush(mockBlob, { headers: { 'content-type': 'application/zip' } });

		const result = await resultPromise;
		expect(result.success).toBe(true);
		expect(result.data?.blob).toBe(mockBlob);
		expect(result.data?.contentType).toBe('application/zip');
	});

	// ---------- Permissions ----------
	it('should get folder permissions', async () => {
		const token = 'fake-token';
		const path = 'shared';
		const mockPermissions = [
			{ id: 1, userEmail: 'a@b.com', groupName: null, mode: 7 },
			{ id: 2, userEmail: null, groupName: 'dev', mode: 15 }
		];

		const resultPromise = service.getFolderPermissions(token, path);

		const req = httpMock.expectOne(req =>
			req.url === '/api/files/permissions/folder'
			&& req.params.get('path') === path
		);
		expect(req.request.method).toBe('GET');
		req.flush({ permissions: mockPermissions });

		const result = await resultPromise;
		expect(result.success).toBe(true);
		expect(result.data).toEqual(mockPermissions);
	});

	it('should get file permissions', async () => {
		const token = 'fake-token';
		const path = 'report.pdf';
		const mockPermissions = [
			{ id: 10, userEmail: 'editor@test.com', groupName: null, mode: 3 }
		];

		const resultPromise = service.getFilePermissions(token, path);

		const req = httpMock.expectOne(req =>
			req.url === '/api/files/permissions/file'
			&& req.params.get('path') === path
		);
		expect(req.request.method).toBe('GET');
		req.flush({ permissions: mockPermissions });

		const result = await resultPromise;
		expect(result.success).toBe(true);
		expect(result.data).toEqual(mockPermissions);
	});

	it('should get group permissions', async () => {
		const token = 'fake-token';
		const groupName = 'developers';
		const mockPermissions = [
			{ type: 'folder', path: 'src', userEmail: null, groupName: 'developers', mode: 15 },
			{ type: 'file', path: 'README.md', userEmail: null, groupName: 'developers', mode: 5 }
		];

		const resultPromise = service.getGroupPermissions(token, groupName);

		const req = httpMock.expectOne(`/api/files/permissions/group/${groupName}`);
		expect(req.request.method).toBe('GET');
		req.flush({ permissions: mockPermissions });

		const result = await resultPromise;
		expect(result.success).toBe(true);
		expect(result.data).toEqual(mockPermissions);
	});

	it('should get user permissions (own)', async () => {
		const token = 'fake-token';
		const userEmail = 'me@test.com';
		const mockPermissions = [
			{ type: 'folder', path: 'private', userEmail: 'me@test.com', groupName: null, mode: 7 }
		];

		const resultPromise = service.getUserPermissions(token, userEmail);

		const req = httpMock.expectOne(`/api/files/permissions/user/${userEmail}`);
		expect(req.request.method).toBe('GET');
		req.flush({ permissions: mockPermissions });

		const result = await resultPromise;
		expect(result.success).toBe(true);
		expect(result.data).toEqual(mockPermissions);
	});

	it('should set folder permission with userEmail', async () => {
		const token = 'fake-token';
		const request = { path: 'docs', userEmail: 'user@test.com', groupName: null, mode: 7 };

		const resultPromise = service.setFolderPermission(token, request);

		const req = httpMock.expectOne('/api/files/permissions/folder');
		expect(req.request.method).toBe('PUT');
		expect(req.request.body).toEqual(request);
		req.flush({});

		const result = await resultPromise;
		expect(result.success).toBe(true);
	});

	it('should set folder permission with groupName', async () => {
		const token = 'fake-token';
		const request = { path: 'team', userEmail: null, groupName: 'dev', mode: 15 };

		const resultPromise = service.setFolderPermission(token, request);

		const req = httpMock.expectOne('/api/files/permissions/folder');
		expect(req.request.method).toBe('PUT');
		expect(req.request.body).toEqual(request);
		req.flush({});

		const result = await resultPromise;
		expect(result.success).toBe(true);
	});

	it('should delete folder permission by path and userEmail', async () => {
		const token = 'fake-token';
		const path = 'docs';
		const userEmail = 'user@test.com';

		const resultPromise = service.deleteFolderPermission(token, path, userEmail);

		const req = httpMock.expectOne(req =>
			req.url === '/api/files/permissions/folder'
			&& req.params.get('path') === path
			&& req.params.get('userEmail') === userEmail
			&& !req.params.has('groupName')
		);
		expect(req.request.method).toBe('DELETE');
		req.flush({});

		const result = await resultPromise;
		expect(result.success).toBe(true);
	});

	it('should delete folder permission by path and groupName', async () => {
		const token = 'fake-token';
		const path = 'team';
		const groupName = 'dev';

		const resultPromise = service.deleteFolderPermission(token, path, undefined, groupName);

		const req = httpMock.expectOne(req =>
			req.url === '/api/files/permissions/folder'
			&& req.params.get('path') === path
			&& req.params.get('groupName') === groupName
			&& !req.params.has('userEmail')
		);
		expect(req.request.method).toBe('DELETE');
		req.flush({});

		const result = await resultPromise;
		expect(result.success).toBe(true);
	});

	it('should set file permission', async () => {
		const token = 'fake-token';
		const request = { path: 'secret.txt', userEmail: null, groupName: 'admin', mode: 15 };

		const resultPromise = service.setFilePermission(token, request);

		const req = httpMock.expectOne('/api/files/permissions/file');
		expect(req.request.method).toBe('PUT');
		expect(req.request.body).toEqual(request);
		req.flush({});

		const result = await resultPromise;
		expect(result.success).toBe(true);
	});

	it('should delete file permission by path and userEmail', async () => {
		const token = 'fake-token';
		const path = 'file.txt';
		const userEmail = 'joe@test.com';

		const resultPromise = service.deleteFilePermission(token, path, userEmail);

		const req = httpMock.expectOne(req =>
			req.url === '/api/files/permissions/file'
			&& req.params.get('path') === path
			&& req.params.get('userEmail') === userEmail
		);
		expect(req.request.method).toBe('DELETE');
		req.flush({});

		const result = await resultPromise;
		expect(result.success).toBe(true);
	});

	it('should delete file permission by path and groupName', async () => {
		const token = 'fake-token';
		const path = 'file.txt';
		const groupName = 'managers';

		const resultPromise = service.deleteFilePermission(token, path, undefined, groupName);

		const req = httpMock.expectOne(req =>
			req.url === '/api/files/permissions/file'
			&& req.params.get('path') === path
			&& req.params.get('groupName') === groupName
		);
		expect(req.request.method).toBe('DELETE');
		req.flush({});

		const result = await resultPromise;
		expect(result.success).toBe(true);
	});

	// ---------- History ----------
	it('should get history without filters', async () => {
		const token = 'fake-token';
		const mockHistory = [
			{ workTime: new Date().toISOString(), operationType: 'CREATE', userEmail: 'a@b.c', path: 'f.txt', isFile: true, details: null }
		];

		const resultPromise = service.getHistory(token);

		const req = httpMock.expectOne('/api/files/history');
		expect(req.request.method).toBe('GET');
		req.flush({ history: mockHistory });

		const result = await resultPromise;
		expect(result.success).toBe(true);
		expect(result.data).toEqual(mockHistory);
	});

	it('should get history with userEmail filter', async () => {
		const token = 'fake-token';
		const filters = { userEmail: 'admin@test.com', pathPrefix: 'groups/', isFile: false };
		const mockHistory: any[] = [];

		const resultPromise = service.getHistory(token, filters);

		const req = httpMock.expectOne(
			req => req.url === '/api/files/history'
				&& req.params.get('userEmail') === 'admin@test.com'
				&& req.params.get('pathPrefix') === 'groups/'
				&& req.params.get('isFile') === 'false'
		);
		expect(req.request.method).toBe('GET');
		req.flush({ history: mockHistory });

		const result = await resultPromise;
		expect(result.success).toBe(true);
		expect(result.data).toEqual(mockHistory);
	});

	// ---------- Error handling ----------
	it('should handle 403 error on upload', async () => {
		const token = 'fake-token';
		const file = new File(['content'], 'test.txt');
		const currentPath = '';

		const resultPromise = service.upload(token, file, currentPath);

		const req = httpMock.expectOne(`/api/files/upload?path=${encodeURIComponent(currentPath)}`);
		req.flush({ error: 'Forbidden' }, { status: 403, statusText: 'Forbidden' });

		const result = await resultPromise;
		expect(result.success).toBe(false);
		expect(result.error).toContain('У вас нет прав на загрузку файлов в эту директорию');
	});

	it('should handle 403 error on restore file', async () => {
		const token = 'fake-token';
		const originalPath = 'file.txt';
		const version = 1;

		const resultPromise = service.restoreFile(token, originalPath, version);

		const req = httpMock.expectOne('/api/files/restore/file');
		req.flush({ error: 'Access denied' }, { status: 403, statusText: 'Forbidden' });

		const result = await resultPromise;
		expect(result.success).toBe(false);
		expect(result.error).toContain('Нет прав на восстановление этого файла');
	});

	it('should handle 409 conflict on restore file', async () => {
		const token = 'fake-token';
		const originalPath = 'file.txt';
		const version = 1;

		const resultPromise = service.restoreFile(token, originalPath, version);

		const req = httpMock.expectOne('/api/files/restore/file');
		req.flush({ error: 'Path already occupied' }, { status: 409, statusText: 'Conflict' });

		const result = await resultPromise;
		expect(result.success).toBe(false);
		expect(result.error).toContain('Path already occupied');
	});

	it('should handle 403 error on restore folder', async () => {
		const token = 'fake-token';
		const originalPath = 'folder';
		const version = 1;

		const resultPromise = service.restoreFolder(token, originalPath, version);

		const req = httpMock.expectOne('/api/files/restore/folder');
		req.flush({ error: 'Forbidden' }, { status: 403, statusText: 'Forbidden' });

		const result = await resultPromise;
		expect(result.success).toBe(false);
		expect(result.error).toContain('Нет прав на восстановление этой папки');
	});

	it('should handle 404 error on download deleted file', async () => {
		const token = 'fake-token';
		const originalPath = 'deleted.zip';
		const version = 1;

		const resultPromise = service.downloadDeletedFile(token, originalPath, version);

		const req = httpMock.expectOne(
			`/api/files/download/deleted?path=${encodeURIComponent(originalPath)}&version=${version}`
		);
		// Передаём пустой Blob, потому что запрос ожидает responseType: 'blob'
		req.flush(new Blob(), { status: 404, statusText: 'Not Found' });

		const result = await resultPromise;
		expect(result.success).toBe(false);
		expect(result.error).toContain('Удалённый файл не найден');
	});
});