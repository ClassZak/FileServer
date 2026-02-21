import { Component } from '@angular/core';
import { FileSearch } from "../file-search/file-search";

@Component({
	selector: 'app-app-header',
	imports: [FileSearch],
	templateUrl: './app-header.html',
	styleUrl: './app-header.css',
})
export class AppHeader {

}
