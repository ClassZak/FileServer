import { Routes } from '@angular/router';
import { About } from './page/about/about';
import { Home } from './page/home/home';
import { AccoutPage } from './page/accout-page/accout-page';
import { LoginPage } from './page/login-page/login-page';

export const routes: Routes = [
	{ path: '', component: Home},
	{ path: 'about', component: About},
	{ path: '', redirectTo: '/home', pathMatch: 'full'},
	{ path: 'account', component: AccoutPage},
	{ path: 'login', component: LoginPage}
];
