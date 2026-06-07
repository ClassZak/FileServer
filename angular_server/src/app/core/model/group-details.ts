export class GroupDetails<T> {
	constructor(
		public name: string,
		public membersCount: number,
		public head: T,
		public members: T[]
	) {}
}