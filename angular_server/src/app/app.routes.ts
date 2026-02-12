import { Routes } from '@angular/router';
import { About } from './page/about/about';
import { Home } from './page/home/home';
import { AccountPage } from './page/accout-page/accout-page';
import { LoginPage } from './page/login-page/login-page';
import { UsersPage } from './page/users-page/users-page';

export const routes: Routes = [
	{ path: '', component: Home},
	{ path: 'about', component: About},
	{ path: '', redirectTo: '/home', pathMatch: 'full'},
	{ path: 'account', component: AccountPage},
	{ path: 'login', component: LoginPage},
	{ path: 'users', component: UsersPage}
];
