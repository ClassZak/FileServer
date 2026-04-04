import { GroupDetails } from './group-details';
import { User } from './user';

describe('GroupDetails', () => {
	it('should create an instance', () => {
		expect(
			new GroupDetails<User>(
				'Super group',
				353,
				new User('Иванов', 'Иван', 'Иванович'),
				[]
			)
		).toBeTruthy();
	});
});
