import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Notification, NotificationBuilder, NotificationType, NotificationWithoutType } from '../model/notification';

@Injectable({ providedIn: 'root' })
export class NoticeService {
	private notifications: Notification[] = [];
	private currentNotificationSubject = new BehaviorSubject<Notification | null>(null);
	public currentNotification$: Observable<Notification | null> = this.currentNotificationSubject.asObservable();



	/**
	 * Add a notification to the queue.
	 * If no notification is currently displayed, the next one is shown immediately.
	 */
	public addNotification(notification: Notification): void {
		this.notifications.push(notification);
		this.processQueue();
	}
	/**
	 * Add an error notification to the queue.
	 * If no notification is currently displayed, the next one is shown immediately.
	 */
	public addNotificationErrorType(notification: NotificationWithoutType): void {
		this.notifications.push(
			NotificationBuilder.createFromNotificationWithoutType(NotificationType.Error, notification)
		);
		this.processQueue();
	}
	/**
	 * Add a success notification to the queue.
	 * If no notification is currently displayed, the next one is shown immediately.
	 */
	public addNotificationSuccessType(notification: NotificationWithoutType): void {
		this.notifications.push(
			NotificationBuilder.createSuccessNotice(notification)
		);
		this.processQueue();
	}
	/**
	 * Add an info notification to the queue.
	 * If no notification is currently displayed, the next one is shown immediately.
	 */
	public addNotificationInfoType(notification: NotificationWithoutType): void {
		this.notifications.push(
			NotificationBuilder.createInfoNotice(notification)
		);
		this.processQueue();
	}
	/**
	 * Add a warning notification to the queue.
	 * If no notification is currently displayed, the next one is shown immediately.
	 */
	public addNotificationWarningType(notification: NotificationWithoutType): void {
		this.notifications.push(
			NotificationBuilder.createWarningNotice(notification)
		);
		this.processQueue();
	}
	/**
	 * Add an error notification to the queue.
	 * If no notification is currently displayed, the next one is shown immediately.
	 */
	public addNotificationErrorTypeByMessage(message: string): void {
		this.notifications.push(
			NotificationBuilder.createErrorNoticeByMessage(message)
		);
		this.processQueue();
	}
	/**
	 * Add a success notification to the queue.
	 * If no notification is currently displayed, the next one is shown immediately.
	 */
	public addNotificationSuccessTypeByMessage(message: string): void {
		this.notifications.push(
			NotificationBuilder.createSuccessNoticeByMessage(message)
		);
		this.processQueue();
	}
	/**
	 * Add an info notification to the queue.
	 * If no notification is currently displayed, the next one is shown immediately.
	 */
	public addNotificationInfoTypeByMessage(message: string): void {
		this.notifications.push(
			NotificationBuilder.createWarningNoticeByMessage(message)
		);
		this.processQueue();
	}
	/**
	 * Add a warning notification to the queue.
	 * If no notification is currently displayed, the next one is shown immediately.
	 */
	public addNotificationWarningTypeByMessage(message: string): void {
		this.notifications.push(
			NotificationBuilder.createWarningNoticeByMessage(message)
		);
		this.processQueue();
	}



	/**
	 * Close the currently displayed notification
	 */
	public closeCurrent(): void {
		this.currentNotificationSubject.next(null);
	}


	/**
	 * To be called by the component when the leave animation finishes.
	 * Moves to the next notification in the queue.
	 */
	public onAnimationDone(): void {
		this.closeCurrent();
		this.processQueue();
	}

	
	private processQueue(): void {
		if (this.currentNotificationSubject.getValue() === null) {
			const nextNotification = this.notifications.shift();
			if (nextNotification) {
				this.currentNotificationSubject.next(nextNotification);
			}
		}
	}
}