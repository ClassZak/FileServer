import { FileInfo } from './file-info';

describe('FileInfo', () => {
	it('should create an instance', () => {
		expect(new FileInfo(
			'23s',
			'sus/23s.txt',
			new Date(),
			BigInt(24000),
			'.txt',
			'23 KB',
			false
		)).toBeTruthy();
	});
});
