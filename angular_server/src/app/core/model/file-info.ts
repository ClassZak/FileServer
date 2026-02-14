export class FileInfo{
	constructor(
		public name: String,
		public fullPath: String,
		public lastModified: Date,
		public size: number,
		public extension: String,
		public readableSize: String,
		public isDirectory: Boolean = false
	) {}
	
}