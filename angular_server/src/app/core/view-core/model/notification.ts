export enum NotificationType{
	Error,
	Warning,
	Success,
	Info
}

/**
 * Class for add notification with specific type in app
 */
export class NotificationWithoutType {
	/**
	 * Create the Notification object
	 * @param message message
	 * @param autoClose must close automaticly or not
	 * @param duration time to close
	 */
	constructor(
		public message: string = '',
		public autoClose: boolean = true,
		public duration: number = 5000 // ms
	) {}
}




/**
 * Class for notification in app
 */
export class Notification extends NotificationWithoutType {
	/**
	 * Create the Notification object
	 * @param type type of notification
	 * @param message message
	 * @param autoClose must close automaticly or not
	 * @param duration time to close
	 */
	constructor(
		public type: NotificationType = NotificationType.Error,
		message: string = '',
		autoClose: boolean = true,
		duration: number = 5000 // ms
	) {
		super(message, autoClose, duration);
	}
}




export class NotificationBuilder {
	/**
	 * Create the Notification object from base model
	 * @param type type of notification
	 * @param notificationWithoutType base model
	 * @returns Notification
	 */
	public static createFromNotificationWithoutType (
		type: NotificationType = NotificationType.Error,
		notificationWithoutType: NotificationWithoutType
	): Notification {
		return new Notification(
			type,
			notificationWithoutType.message,
			notificationWithoutType.autoClose,
			notificationWithoutType.duration
		);
	}


	/**
	 * Create error Notification object from base model
	 * @param notificationWithoutType base model
	 * @returns Notification
	 */
	public static createErrorNotice(
		notificationWithoutType: NotificationWithoutType
	) {
		return NotificationBuilder.createFromNotificationWithoutType(
			NotificationType.Error,
			notificationWithoutType
		);
	}
	/**
	 * Create warning Notification object from base model
	 * @param notificationWithoutType base model
	 * @returns Notification
	 */
	public static createWarningNotice(
		notificationWithoutType: NotificationWithoutType
	) {
		return NotificationBuilder.createFromNotificationWithoutType(
			NotificationType.Warning,
			notificationWithoutType
		);
	}
	/**
	 * Create success Notification object from base model
	 * @param notificationWithoutType base model
	 * @returns Notification
	 */
	public static createSuccessNotice(
		notificationWithoutType: NotificationWithoutType
	) {
		return NotificationBuilder.createFromNotificationWithoutType(
			NotificationType.Success,
			notificationWithoutType
		);
	}
	/**
	 * Create info Notification object from base model
	 * @param notificationWithoutType base model
	 * @returns Notification
	 */
	public static createInfoNotice(
		notificationWithoutType: NotificationWithoutType
	) {
		return NotificationBuilder.createFromNotificationWithoutType(
			NotificationType.Info,
			notificationWithoutType
		);
	}




	/**
	 * Create error Notification object from base model
	 * @param notificationWithoutType base model
	 * @returns Notification
	 */
	public static createErrorNoticeByMessage(
		message: string
	) {
		return NotificationBuilder.createFromNotificationWithoutType(
			NotificationType.Error,
			new NotificationWithoutType(message)
		);
	}
	/**
	 * Create warning Notification object from base model
	 * @param notificationWithoutType base model
	 * @returns Notification
	 */
	public static createWarningNoticeByMessage(
		message: string
	) {
		return NotificationBuilder.createFromNotificationWithoutType(
			NotificationType.Warning,
			new NotificationWithoutType(message)
		);
	}
	/**
	 * Create success Notification object from base model
	 * @param notificationWithoutType base model
	 * @returns Notification
	 */
	public static createSuccessNoticeByMessage(
		message: string
	) {
		return NotificationBuilder.createFromNotificationWithoutType(
			NotificationType.Success,
			new NotificationWithoutType(message)
		);
	}
	/**
	 * Create info Notification object from base model
	 * @param notificationWithoutType base model
	 * @returns Notification
	 */
	public static createInfoNoticeByMessage(
		message: string
	) {
		return NotificationBuilder.createFromNotificationWithoutType(
			NotificationType.Info,
			new NotificationWithoutType(message)
		);
	}
}



