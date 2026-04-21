import { TestBed } from '@angular/core/testing';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { FileService, DirectoryList, SearchResults } from './file-service';

describe('FileService (instance)', () => {
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

	// ---------- Existence check ----------
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
			{ id: 1, originalPath: 'file.txt', deletedAt: new Date().toISOString(), version: 1, deletedByUserId: 42, deletedByUserEmail: 'user@example.com' }
		];

		const resultPromise = service.getDeletedFiles(token);

		const req = httpMock.expectOne('/api/files/deleted/files');
		expect(req.request.method).toBe('GET');
		expect(req.request.headers.get('Authorization')).toBe(`Bearer ${token}`);
		req.flush({ deletedFiles: mockDeletedFiles });

		const result = await resultPromise;
		expect(result.success).toBe(true);
		expect(result.data).toEqual(mockDeletedFiles);
	});

	it('should get deleted folders', async () => {
		const token = 'fake-token';
		const mockDeletedFolders = [
			{ id: 1, originalPath: 'folder', deletedAt: new Date().toISOString(), version: 1, deletedByUserId: 42, deletedByUserEmail: 'user@example.com' }
		];

		const resultPromise = service.getDeletedFolders(token);

		const req = httpMock.expectOne('/api/files/deleted/folders');
		expect(req.request.method).toBe('GET');
		expect(req.request.headers.get('Authorization')).toBe(`Bearer ${token}`);
		req.flush({ deletedFolders: mockDeletedFolders });

		const result = await resultPromise;
		expect(result.success).toBe(true);
		expect(result.data).toEqual(mockDeletedFolders);
	});

	it('should restore a file', async () => {
		const token = 'fake-token';
		const deletedId = 123;

		const resultPromise = service.restoreFile(token, deletedId);

		const req = httpMock.expectOne(`/api/files/restore/file/${deletedId}`);
		expect(req.request.method).toBe('POST');
		expect(req.request.headers.get('Authorization')).toBe(`Bearer ${token}`);
		req.flush({});

		const result = await resultPromise;
		expect(result.success).toBe(true);
	});

	it('should restore a folder', async () => {
		const token = 'fake-token';
		const deletedId = 456;

		const resultPromise = service.restoreFolder(token, deletedId);

		const req = httpMock.expectOne(`/api/files/restore/folder/${deletedId}`);
		expect(req.request.method).toBe('POST');
		expect(req.request.headers.get('Authorization')).toBe(`Bearer ${token}`);
		req.flush({});

		const result = await resultPromise;
		expect(result.success).toBe(true);
	});

	it('should permanently delete a file', async () => {
		const token = 'fake-token';
		const deletedId = 123;

		const resultPromise = service.permanentDeleteFile(token, deletedId);

		const req = httpMock.expectOne(`/api/files/permanent/file/${deletedId}`);
		expect(req.request.method).toBe('DELETE');
		expect(req.request.headers.get('Authorization')).toBe(`Bearer ${token}`);
		req.flush({});

		const result = await resultPromise;
		expect(result.success).toBe(true);
	});

	it('should permanently delete a folder', async () => {
		const token = 'fake-token';
		const deletedId = 456;

		const resultPromise = service.permanentDeleteFolder(token, deletedId);

		const req = httpMock.expectOne(`/api/files/permanent/folder/${deletedId}`);
		expect(req.request.method).toBe('DELETE');
		expect(req.request.headers.get('Authorization')).toBe(`Bearer ${token}`);
		req.flush({});

		const result = await resultPromise;
		expect(result.success).toBe(true);
	});

	// ---------- Permissions ----------
	it('should set folder permission', async () => {
		const token = 'fake-token';
		const request = { path: 'folder', userId: 1, mode: 7 };

		const resultPromise = service.setFolderPermission(token, request);

		const req = httpMock.expectOne('/api/files/permissions/folder');
		expect(req.request.method).toBe('PUT');
		expect(req.request.headers.get('Authorization')).toBe(`Bearer ${token}`);
		expect(req.request.body).toEqual(request);
		req.flush({});

		const result = await resultPromise;
		expect(result.success).toBe(true);
	});

	it('should delete folder permission', async () => {
		const token = 'fake-token';
		const permissionId = 100;

		const resultPromise = service.deleteFolderPermission(token, permissionId);

		const req = httpMock.expectOne(`/api/files/permissions/folder/${permissionId}`);
		expect(req.request.method).toBe('DELETE');
		expect(req.request.headers.get('Authorization')).toBe(`Bearer ${token}`);
		req.flush({});

		const result = await resultPromise;
		expect(result.success).toBe(true);
	});

	it('should set file permission', async () => {
		const token = 'fake-token';
		const request = { path: 'file.txt', groupId: 2, mode: 5 };

		const resultPromise = service.setFilePermission(token, request);

		const req = httpMock.expectOne('/api/files/permissions/file');
		expect(req.request.method).toBe('PUT');
		expect(req.request.headers.get('Authorization')).toBe(`Bearer ${token}`);
		expect(req.request.body).toEqual(request);
		req.flush({});

		const result = await resultPromise;
		expect(result.success).toBe(true);
	});

	it('should delete file permission', async () => {
		const token = 'fake-token';
		const permissionId = 200;

		const resultPromise = service.deleteFilePermission(token, permissionId);

		const req = httpMock.expectOne(`/api/files/permissions/file/${permissionId}`);
		expect(req.request.method).toBe('DELETE');
		expect(req.request.headers.get('Authorization')).toBe(`Bearer ${token}`);
		req.flush({});

		const result = await resultPromise;
		expect(result.success).toBe(true);
	});

	// ---------- History ----------
	it('should get history without filters', async () => {
		const token = 'fake-token';
		const mockHistory = [{ id: 1, workTime: new Date().toISOString(), operationType: { id: 1, name: 'CREATE' }, user: { id: 1, email: 'a@b.c' }, fileEntity: null, folderEntity: null, path: 'f.txt', isFile: true, details: null }];

		const resultPromise = service.getHistory(token);

		const req = httpMock.expectOne('/api/files/history');
		expect(req.request.method).toBe('GET');
		expect(req.request.headers.get('Authorization')).toBe(`Bearer ${token}`);
		req.flush({ history: mockHistory });

		const result = await resultPromise;
		expect(result.success).toBe(true);
		expect(result.data).toEqual(mockHistory);
	});

	it('should get history with filters', async () => {
		const token = 'fake-token';
		const filters = { userId: 1, pathPrefix: 'groups/', isFile: true };
		const mockHistory = [] as any[];

		const resultPromise = service.getHistory(token, filters);

		const req = httpMock.expectOne(req => req.url === '/api/files/history');
		expect(req.request.method).toBe('GET');
		expect(req.request.params.get('userId')).toBe('1');
		expect(req.request.params.get('pathPrefix')).toBe('groups/');
		expect(req.request.params.get('isFile')).toBe('true');
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
});