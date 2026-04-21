import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { NoticeComponent } from './app/component/notice-component/notice-component';

bootstrapApplication(App, appConfig)
	.catch((err) => console.error(err));
