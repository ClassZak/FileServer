import { Component, Input } from '@angular/core';

@Component({
	selector: 'app-redirection-button',
	imports: [],
	templateUrl: './redirection-button.html',
	styleUrl: './redirection-button.css',
})
export class RedirectionButton {
	@Input() title: string = '';
	@Input() reference: string = '';
	@Input() className: string = '';
}
