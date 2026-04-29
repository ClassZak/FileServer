import { HistoryInfo, HistoryInfoAdmin } from './history-info';

describe('HistoryInfo', () => {
	it('should create an instance of HistoryInfo', () => {
		expect(new HistoryInfo(
			new Date(),
			'CREATE',
			'example@gmail.com',
			true,
		)).toBeTruthy();
	});

	it('should create an instance of HistoryInfoAdmin', () => {
		expect(new HistoryInfoAdmin(
			new Date(),
			'CREATE',
			'example@gmail.com',
			'sus.txt',
			true,
		)).toBeTruthy();
	});
});
