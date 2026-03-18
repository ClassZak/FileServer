import { Component } from '@angular/core';
import { FileSearchHeader } from "../file-search-header/file-search-header";
import { RouterLink } from "@angular/router";

@Component({
	selector: 'app-app-header',
	imports: [FileSearchHeader, RouterLink],
	templateUrl: './app-header.html',
	styleUrl: './app-header.css',
})
export class AppHeader {

}
