export class FileInfo{
	constructor(
		public name: string,
		public fullPath: string,
		public lastModified: Date,
		public size: number,
		public extension: string,
		public readableSize: string,
		public isDirectory: boolean = false
	) {}
	
}