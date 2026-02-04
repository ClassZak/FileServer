import { Component } from '@angular/core';
import { AppFooter } from '../../app-footer/app-footer'
import { AppHeader } from "../../app-header/app-header";

@Component({
  selector: 'app-home',
  imports: [AppFooter, AppHeader],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {

}
