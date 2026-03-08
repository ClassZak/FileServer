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

	public static getRelativePath(item: FileInfo, path: string): string {
		if (path && item.fullPath.startsWith(path)) {
			return item.fullPath.substring(path.length).replace(/^\//, '');
		}
		return item.fullPath;
	}
}