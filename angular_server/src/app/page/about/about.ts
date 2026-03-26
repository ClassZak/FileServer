import { Component } from '@angular/core';
import { AppFooter } from '../../app-footer/app-footer'
import { AppHeader } from "../../app-header/app-header";
import { RouterLink } from "@angular/router";

@Component({
	selector: 'app-about',
	imports: [AppFooter, AppHeader, RouterLink],
	templateUrl: './about.html',
	styleUrl: './about.css',
})
export class About {

}
