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
		expect(req.request.headers.get('Content-Type')).toBe('multipart/form-data');
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
});