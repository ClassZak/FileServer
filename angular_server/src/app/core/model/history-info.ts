export enum OperationType {
	Create = 'CREATE',
	Read = 'READ',
	Update = 'UPDATE',
	Delete = 'DELETE',
	Restore = 'RESTORE',
	ChangePermissions = 'CHANGE_PERMISSIONS',
	Move = 'MOVE',
	Rename = 'RENAME',
	Download = 'DOWNLOAD',
	Upload = 'UPLOAD'
}

/* 
* Converts a raw string from the server into an OperationType enum value
*/
export function toOperationType(raw: string): OperationType {
	const found = Object.values(OperationType).find(v => v === raw);
	return found ?? OperationType.Read; // fallback, in case of an unknown value
}

/*
* Human‑readable labels for operation types 
*/
export const OperationTypeLabels: Record<OperationType, string> = {
	[OperationType.Create]: 'Создание',
	[OperationType.Read]: 'Чтение',
	[OperationType.Update]: 'Обновление',
	[OperationType.Delete]: 'Удаление',
	[OperationType.Restore]: 'Восстановление',
	[OperationType.ChangePermissions]: 'Смена прав',
	[OperationType.Move]: 'Перемещение',
	[OperationType.Rename]: 'Переименование',
	[OperationType.Download]: 'Скачивание',
	[OperationType.Upload]: 'Загрузка'
};

/**
 * History model for default user
 */
export class HistoryInfo {
	constructor (
		public workTime: Date,
		public operationType: OperationType,
		public path: string,
		public isFile: boolean = false,
		public details: string | null = null
	) {}
}

/**
 * History model for admin
 */
export class HistoryInfoAdmin {
	constructor (
		public workTime: Date,
		public operationType: OperationType,
		public userEmail: string,
		public path: string,
		public isFile: boolean = false,
		public details: string | null = null
	) {}
}

/**
 * Attempts to parse `details` as JSON and return a human-readable representation.
 * If `details` is valid JSON containing `version` and/or `deletedPath` fields,
 * returns a string like "Version: 1, deleted path: ...".
 * Otherwise returns the original `details` or null.
 */
export function formatDetails(details: string | null): string | null {
	if (!details) return null;
	try {
		const parsed = JSON.parse(details);
		const parts: string[] = [];
		if (parsed.version !== undefined) {
			parts.push(`Номер удалённой версии: ${parsed.version}`);
		}
		if (parts.length > 0) return parts.join(', ');
		return details; // return as-is if no known fields are present
	} catch {
		return details;
	}
}

/** Returns the parent path for a file (strips the last segment) */
export function parentPath(fullPath: string): string {
	const idx = fullPath.lastIndexOf('/');
	return idx === -1 ? '' : fullPath.substring(0, idx);
}