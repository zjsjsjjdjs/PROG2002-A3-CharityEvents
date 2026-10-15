import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AppShell } from '@charity/shared';
@Component({
  selector: 'app-root',
  imports: [RouterOutlet, AppShell],
  template: '<hh-shell area="Event management"><router-outlet /></hh-shell>',
})
export class App {}
