import { FolderInfo } from './folder-info';

describe('FolderInfo', () => {
	it('should create an instance', () => {
		expect(new FolderInfo(
			'23s',
			'sus/23s.txt',
			new Date(),
			BigInt(24000),
			'.txt',
			'23 KB',
			BigInt(0),
			true
		)).toBeTruthy();
	});
});
