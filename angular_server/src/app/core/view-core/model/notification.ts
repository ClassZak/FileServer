export enum NotificationType{
	Error,
	Warning,
	Success,
	Info
}

/**
 * Class for notification in app
 */
export class Notification {
	/**
	 * Create the Notification object
	 * @param type type of notification
	 * @param message message
	 * @param autoClose must close automaticly or not
	 * @param duration time to close
	 */
	constructor(
		public type: NotificationType = NotificationType.Error,
		public message: string = '',
		public autoClose: boolean = true,
		public duration: number = 5000 // ms
	) {}
}
