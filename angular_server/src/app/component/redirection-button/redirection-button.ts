import { Component, Input } from '@angular/core';
import { RouterLink } from "@angular/router";

@Component({
	selector: 'app-redirection-button',
	imports: [RouterLink],
	templateUrl: './redirection-button.html',
	styleUrl: './redirection-button.css',
})
export class RedirectionButton {
	@Input() title: string = '';
	@Input() reference: string = '';
	@Input() className: string = '';
}
