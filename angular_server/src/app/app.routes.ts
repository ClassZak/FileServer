import { Routes } from '@angular/router';
import { About } from './page/about/about';
import { Home } from './page/home/home';
import { AccountPage } from './page/account-page/account-page';
import { LoginPage } from './page/login-page/login-page';
import { UsersPage } from './page/users-page/users-page';
import { FilesPageComponent } from './page/files-page/files-page';
import { UserPage } from './page/user-page/user-page';
import { GroupsPage } from './page/groups-page/groups-page';
import { GroupPage } from './page/group-page/group-page';

export const routes: Routes = [
	{ path: '', component: Home},
	{ path: 'home', redirectTo: '/' },
	{ path: 'about', component: About},
	{ path: 'account', component: AccountPage},
	{ path: 'login', component: LoginPage},
	{ path: 'users', component: UsersPage},
	{ path: 'user/:email', component: UserPage},
	{ path: 'groups', component: GroupsPage},
	{ path: 'group/:name', component: GroupPage},
	{ path: 'files/**', component: FilesPageComponent},
];
