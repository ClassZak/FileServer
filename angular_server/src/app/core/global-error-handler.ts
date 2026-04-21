import { ErrorHandler, Injectable, Injector } from '@angular/core';
import { NoticeService } from './view-core/service/notice-service';
import { Notification, NotificationType } from './view-core/model/notification';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
	constructor(private injector: Injector) {}

	handleError(error: any): void {
		const noticeService = this.injector.get(NoticeService);

		console.error('Unhandled error:', error);

		let message = 'An unexpected error occurred.';
		if (error?.message) {
			message = error.message;
		} else if (typeof error === 'string') {
			message = error;
		}

		noticeService.addNotification(
			new Notification(NotificationType.Error, message)
		);
	}
}