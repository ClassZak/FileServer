import { Routes } from '@angular/router';
import { About } from './page/about/about';
import { Home } from './page/home/home';

export const routes: Routes = [
	{ path: '', component: Home},
	{ path: 'about', component: About},
	{ path: '', redirectTo: '/home', pathMatch: 'full'}
];
