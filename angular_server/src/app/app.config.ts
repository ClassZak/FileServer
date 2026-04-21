import { ApplicationConfig, ErrorHandler } from '@angular/core';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { routes } from './app.routes';
import { GlobalErrorHandler } from './core/global-error-handler';

export const appConfig: ApplicationConfig = {
	providers: [
		provideRouter(
			routes,
			withInMemoryScrolling({
				anchorScrolling: 'enabled',				// scroll to fragment
				scrollPositionRestoration: 'enabled'	// scroll position restoration
			})
		),
		provideHttpClient(),
		{ provide: ErrorHandler, useClass: GlobalErrorHandler }
	]
};