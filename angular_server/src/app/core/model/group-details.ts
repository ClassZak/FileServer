export class GroupDetails<T> {
	constructor(
		public name: string,
		public membersCount: number,
		public creator: T,
		public members: T[]
	) {}
}