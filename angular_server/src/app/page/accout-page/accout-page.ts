import { Component } from '@angular/core';
import { AppFooter } from '../../app-footer/app-footer'
import { AppHeader } from "../../app-header/app-header";
import { LoadingSpinner } from "../../component/loading-spinner/loading-spinner";


@Component({
  selector: 'app-accout-page',
  imports: [AppFooter, AppHeader, LoadingSpinner],
  templateUrl: './accout-page.html',
  styleUrl: './accout-page.css',
})
export class AccoutPage {

}
