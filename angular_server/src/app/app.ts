import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NoticeComponent } from './component/notice-component/notice-component';

@Component({
	selector: 'app-root',
	imports: [RouterOutlet, NoticeComponent],
	templateUrl: './app.html',
	styleUrl: './app.css',
	standalone: true
})
export class App {
	protected readonly title = signal('file_server');
}
