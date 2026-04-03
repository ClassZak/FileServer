import { TestBed } from '@angular/core/testing';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { GroupService } from './group-service';
import { GroupCreateModel } from '../model/group-create-model';
import { GroupUpdateModel } from '../model/group-update-model';

describe('GroupService (instance)', () => {
	let service: GroupService;
	let httpMock: HttpTestingController;

	beforeEach(() => {
		TestBed.resetTestingModule();
		TestBed.configureTestingModule({
			providers: [
				GroupService,
				provideHttpClient(),
				provideHttpClientTesting()
			]
		});
		service = TestBed.inject(GroupService);
		httpMock = TestBed.inject(HttpTestingController);
	});

	afterEach(() => {
		httpMock.verify();
	});

	it('should get group full details (user view)', async () => {
		const token = 'fake-token';
		const groupName = 'test-group';
		const mockResponse = {
			group: {
				name: 'test-group',
				membersCount: 2,
				creator: { surname: 'Creator', name: 'C', patronymic: 'C', email: 'c@test.com' },
				members: []
			}
		};

		const resultPromise = service.getGroupFullDetails(token, groupName);

		const req = httpMock.expectOne(`/api/groups/name/${encodeURIComponent(groupName)}/full`);
		expect(req.request.method).toBe('GET');
		req.flush(mockResponse);

		const result = await resultPromise;
		expect(result.success).toBe(true);
		expect(result.data?.group.name).toBe('test-group');
	});

	it('should get my groups', async () => {
		const token = 'fake-token';
		const mockGroups = [{ name: 'g1', membersCount: 1, creatorEmail: 'c@test.com' }];

		const resultPromise = service.getMyGroups(token);

		const req = httpMock.expectOne('/api/groups/my');
		req.flush({ groups: mockGroups });

		const result = await resultPromise;
		expect(result.success).toBe(true);
		expect(result.data?.length).toBe(1);
	});

	it('should create a group', async () => {
		const token = 'fake-token';
		const groupData = new GroupCreateModel('new-group', 'creator@test.com');

		const resultPromise = service.createGroup(token, groupData);

		const req = httpMock.expectOne('/api/groups');
		expect(req.request.method).toBe('POST');
		expect(req.request.body).toEqual(groupData);
		req.flush({});

		const result = await resultPromise;
		expect(result.success).toBe(true);
	});

	it('should add user to group', async () => {
		const token = 'fake-token';
		const groupName = 'test-group';
		const userEmail = 'user@test.com';

		const resultPromise = service.addUserToGroup(token, groupName, userEmail);

		const req = httpMock.expectOne(`/api/groups/name/${encodeURIComponent(groupName)}/users/${encodeURIComponent(userEmail)}`);
		expect(req.request.method).toBe('POST');
		req.flush({ success: true });

		const result = await resultPromise;
		expect(result.success).toBe(true);
	});

	it('should remove user from group', async () => {
		const token = 'fake-token';
		const groupName = 'test-group';
		const userEmail = 'user@test.com';

		const resultPromise = service.removeUserFromGroup(token, groupName, userEmail);

		const req = httpMock.expectOne(`/api/groups/name/${encodeURIComponent(groupName)}/users/${encodeURIComponent(userEmail)}`);
		expect(req.request.method).toBe('DELETE');
		req.flush({ success: true });

		const result = await resultPromise;
		expect(result.success).toBe(true);
	});
});