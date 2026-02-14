export class FolderInfo{
	constructor(
		public name: String,
		public fullPath: String,
		public lastModified: Date,
		public size: number,
		public readableSize: String,
		public itemCount: number,
		public isDirectory: Boolean = true
	){}
}