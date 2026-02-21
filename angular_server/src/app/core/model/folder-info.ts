export class FolderInfo{
	constructor(
		public name: string,
		public fullPath: string,
		public lastModified: Date,
		public size: bigint,
		public extension: string,
		public readableSize: string,
		public itemCount: bigint,
		public isDirectory: boolean = true
	){}
}