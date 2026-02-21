import { Routes } from '@angular/router';
import { About } from './page/about/about';
import { Home } from './page/home/home';
import { AccountPage } from './page/accout-page/accout-page';
import { LoginPage } from './page/login-page/login-page';
import { UsersPage } from './page/users-page/users-page';
import { FilesPageComponent } from './page/files-page/files-page';
import { UserPage } from './page/user-page/user-page';
import { GroupsPage } from './page/groups-page/groups-page';
import { GroupPage } from './page/group-page/group-page';

export const routes: Routes = [
	{ path: '', component: Home},
	{ path: 'about', component: About},
	{ path: '', redirectTo: '/home', pathMatch: 'full'},
	{ path: 'account', component: AccountPage},
	{ path: 'login', component: LoginPage},
	{ path: 'users', component: UsersPage},
	{ path: 'user/:email', component: UserPage},
	{ path: 'files/**', component: FilesPageComponent},
	{ path: 'groups', component: GroupsPage},
	{ path: 'group/:name', component: GroupPage},
];
