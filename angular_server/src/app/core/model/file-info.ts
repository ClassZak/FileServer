import { IconManager } from "../../component/icon-manager/icon-manager";


export class FileInfo{
	constructor(
		public name: string,
		public fullPath: string,
		public lastModified: Date | string,
		public size: bigint,
		public extension: string,
		public readableSize: string,
		public isDirectory: boolean = false
	) {}

}