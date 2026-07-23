import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Nav } from '../nav/nav';

@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, Nav],
  template: `
    <app-nav />
    <router-outlet />
  `,
})
export class Shell {}
