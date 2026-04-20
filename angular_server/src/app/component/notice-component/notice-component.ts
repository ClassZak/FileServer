import {
	Component,
	OnDestroy,
	OnInit,
	HostListener,
	ElementRef,
	ViewChild,
	Renderer2,
	ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { NoticeService } from '../../core/view-core/service/notice-service';
import { Notification, NotificationType } from '../../core/view-core/model/notification';

@Component({
	selector: 'app-notice-component',
	standalone: true,
	imports: [CommonModule],
	templateUrl: './notice-component.html',
	styleUrl: './notice-component.css'
})
export class NoticeComponent implements OnInit, OnDestroy {
	NotificationType = NotificationType;

	currentNotification: Notification | null = null;
	private subscription: Subscription | null = null;
	private autoCloseTimer: any;
	private touchStartX: number = 0;
	private touchCurrentX: number = 0;
	private isSwiping: boolean = false;
	private readonly SWIPE_THRESHOLD = 80; // px

	// Animation visibility flag
	isVisible: boolean = false;
	// CSS-classes states
	animationState: 'enter' | 'leave' | '' = '';

	@ViewChild('notificationContainer', { static: false }) containerRef!: ElementRef<HTMLElement>;

	constructor(
		private noticeService: NoticeService,
		private renderer: Renderer2,
		private cdr: ChangeDetectorRef
	) {}

	ngOnInit(): void {
		this.subscription = this.noticeService.currentNotification$.subscribe(notification => {
			if (notification) {
				this.currentNotification = notification;
				this.isVisible = true;
				this.animationState = 'enter';
				this.startAutoCloseTimer();
			} else {
				// Start leave animation
				this.animationState = 'leave';
				this.clearAutoCloseTimer();
			}
			this.cdr.detectChanges();
		});
	}

	ngOnDestroy(): void {
		this.subscription?.unsubscribe();
		this.clearAutoCloseTimer();
	}

	/**
	 * Closes the current notification and triggers leave animation.
	 */
	close(): void {
		if (this.animationState === 'leave') return; // уже уходит
		this.clearAutoCloseTimer();
		this.animationState = 'leave';
		this.cdr.detectChanges();
	}

	/**
	 * Returns CSS class based on notification type.
	 */
	getTypeClass(): string {
		if (!this.currentNotification) return '';
		switch (this.currentNotification.type) {
			case NotificationType.Success:	return 'success';
			case NotificationType.Error:	return 'error';
			case NotificationType.Warning:	return 'warning';
			case NotificationType.Info:		return 'info';
			default: return '';
		}
	}

	/**
	 * Returns CSS class based on notification type.
	 */
	getButtonClass(): string {
		let result = 'btn';
		if (!this.currentNotification) return result;
		
		switch (this.currentNotification.type) {
			case NotificationType.Success:	result += ' btn-green';		break;
			case NotificationType.Error:	result += ' btn-red';		break;
			case NotificationType.Warning:	result += ' btn-orange';	break;
			case NotificationType.Info:		result += ' btn-blue';		break;
		}
		
		return result;
	}

	/**
	 * Returns icon based on notification type.
	 */
	getIcon(): string {
		if (!this.currentNotification) return '';
		let iconsRoot = '/assets/img/';
		switch (this.currentNotification.type) {
			case NotificationType.Success:	iconsRoot += 'success.svg';	break;
			case NotificationType.Error:	iconsRoot += 'error.svg';	break;
			case NotificationType.Warning:	iconsRoot += 'warning.png';	break;
			case NotificationType.Info:		iconsRoot += 'info.svg';	break;
			default: iconsRoot = ''; break;
		}

		return iconsRoot;
	}

	// ---------- Auto close timer ----------
	private startAutoCloseTimer(): void {
		if (!this.currentNotification?.autoClose) return;
		this.clearAutoCloseTimer();
		this.autoCloseTimer = setTimeout(() => {
			this.close();
		}, this.currentNotification.duration);
	}

	private clearAutoCloseTimer(): void {
		if (this.autoCloseTimer) {
			clearTimeout(this.autoCloseTimer);
			this.autoCloseTimer = null;
		}
	}

	// ---------- Swipe handling for mobile ----------
	onTouchStart(event: TouchEvent): void {
		if (this.animationState === 'leave') return;
		this.touchStartX = event.touches[0].clientX;
		this.touchCurrentX = this.touchStartX;
		this.isSwiping = true;
	}

	onTouchMove(event: TouchEvent): void {
		if (!this.isSwiping) return;
		this.touchCurrentX = event.touches[0].clientX;
		const deltaX = this.touchCurrentX - this.touchStartX;
		if (deltaX > 0 && this.containerRef) {
			this.renderer.setStyle(this.containerRef.nativeElement, 'transform', `translateX(${deltaX}px)`);
			this.renderer.setStyle(this.containerRef.nativeElement, 'opacity', `${1 - deltaX / 200}`);
		}
	}

	onTouchEnd(event: TouchEvent): void {
		if (!this.isSwiping) return;
		this.isSwiping = false;

		const deltaX = this.touchCurrentX - this.touchStartX;
		if (deltaX > this.SWIPE_THRESHOLD) {
			this.close();
		} else if (this.containerRef) {
			this.renderer.setStyle(this.containerRef.nativeElement, 'transform', 'translateX(0)');
			this.renderer.setStyle(this.containerRef.nativeElement, 'opacity', '1');
		}
	}

	@HostListener('touchmove', ['$event'])
	onTouchMovePrevent(event: TouchEvent): void {
		if (this.isSwiping) {
			event.preventDefault();
		}
	}
}