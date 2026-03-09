import { Component } from '@angular/core';
import { FileSearchHeader } from "../file-search-header/file-search-header";

@Component({
	selector: 'app-app-header',
	imports: [FileSearchHeader],
	templateUrl: './app-header.html',
	styleUrl: './app-header.css',
})
export class AppHeader {

}
