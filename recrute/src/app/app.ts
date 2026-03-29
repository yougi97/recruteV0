import { Component, signal } from '@angular/core';
import { Navbar } from "./navbar/navbar";
import { RouterModule } from "@angular/router";


@Component({
  selector: 'app-root',
  imports: [Navbar, RouterModule],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('recrute');
}
