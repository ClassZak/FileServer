import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
	selector: 'app-error-message',
	standalone: true,
	imports: [CommonModule],
	templateUrl: './error-message-component.html',
	styleUrls: ['./error-message-component.css']
})
export class ErrorMessageComponent {
	@Input() message: string = '';
	@Input() showNavigation: boolean = false;
	@Input() showUpButton: boolean = false;
	@Output() onClose = new EventEmitter<void>();
	@Output() onNavigateUp = new EventEmitter<void>();
}