import { Component } from '@angular/core';
import { AppFooter } from '../../app-footer/app-footer'
import { AppHeader } from "../../app-header/app-header";

@Component({
  selector: 'app-about',
  imports: [AppFooter, AppHeader],
  templateUrl: './about.html',
  styleUrl: './about.css',
})
export class About {

}
