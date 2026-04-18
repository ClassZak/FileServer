import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Notification, NotificationType } from '../model/notification';

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