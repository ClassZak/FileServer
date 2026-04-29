import { Routes } from '@angular/router';

export const routes: Routes = [
	{ path: '', loadComponent: () => import('./page/home/home').then(m => m.Home) },
	{ path: 'home', redirectTo: '/' },
	{ path: 'about', loadComponent: () => import('./page/about/about').then(m => m.About) },
	{ path: 'account', loadComponent: () => import('./page/account-page/account-page').then(m => m.AccountPage) },
	{ path: 'login', loadComponent: () => import('./page/login-page/login-page').then(m => m.LoginPage) },
	{ path: 'users', loadComponent: () => import('./page/users-page/users-page').then(m => m.UsersPage) },
	{ path: 'user/:email', loadComponent: () => import('./page/user-page/user-page').then(m => m.UserPage) },
	{ path: 'groups', loadComponent: () => import('./page/groups-page/groups-page').then(m => m.GroupsPage) },
	{ path: 'group/:name', loadComponent: () => import('./page/group-page/group-page').then(m => m.GroupPage) },
	{ path: 'files/**', loadComponent: () => import('./page/files-page/files-page').then(m => m.FilesPageComponent) },
	{ path: 'history', loadComponent: () => import('./page/history-page/history-page').then(m => m.HistoryPage) },
	{ path: 'history/email/:email', loadComponent: () => import('./page/history-page/history-page').then(m => m.HistoryPage) }
];