import { 
	Component, 
	Input, 
	Output, 
	EventEmitter, 
	OnDestroy, 
	ElementRef, 
	ViewChild,
	OnChanges,
	SimpleChanges
} from '@angular/core';

@Component({
	selector: 'app-modal',
	standalone: true,
	templateUrl: './modal.html',
	styleUrls: ['./modal.css']
})
export class ModalComponent implements OnDestroy, OnChanges {
	@Input() isOpen: boolean = false;
	@Input() title: string = '';
	@Input() className: string = '';
	@Output() onClose = new EventEmitter<void>();

	@ViewChild('modalContent') modalContent!: ElementRef<HTMLDivElement>;

	private escapeListener: ((event: KeyboardEvent) => void) | null = null;

	ngOnChanges(changes: SimpleChanges): void {
		if (changes['isOpen']) {
			this.handleModalStateChange();
		}
	}

	ngOnDestroy(): void {
		this.cleanup();
	}

	private handleModalStateChange(): void {
		if (this.isOpen) {
			this.addBodyScrollLock();
			this.addEscapeListener();
		} else {
			this.removeBodyScrollLock();
			this.removeEscapeListener();
		}
	}

	private addBodyScrollLock(): void {
		document.body.classList.add('modal-open');
	}

	private removeBodyScrollLock(): void {
		document.body.classList.remove('modal-open');
	}

	private addEscapeListener(): void {
		this.escapeListener = (event: KeyboardEvent) => {
			if (event.key === 'Escape') {
				this.closeModal();
			}
		};
		document.addEventListener('keydown', this.escapeListener);
	}

	private removeEscapeListener(): void {
		if (this.escapeListener) {
			document.removeEventListener('keydown', this.escapeListener);
			this.escapeListener = null;
		}
	}

	closeModal(): void {
		this.onClose.emit();
	}

	handleOverlayClick(event: MouseEvent): void {
		if (event.target === event.currentTarget) {
			this.closeModal();
		}
	}

	private cleanup(): void {
		this.removeBodyScrollLock();
		this.removeEscapeListener();
	}
}