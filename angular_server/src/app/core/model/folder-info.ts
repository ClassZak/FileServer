export class FolderInfo{
	constructor(
		public name: string,
		public fullPath: string,
		public lastModified: Date,
		public size: number,
		public readableSize: string,
		public itemCount: number,
		public isDirectory: boolean = true
	){}
}