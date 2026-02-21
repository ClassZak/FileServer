import { UpdatePasswordRequest } from './update-password-request';

describe('UpdatePasswordRequest', () => {
	it('should create an instance', () => {
		expect(new UpdatePasswordRequest('','')).toBeTruthy();
	});
});
