import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AppShell } from '@charity/shared';
@Component({
  selector: 'app-root',
  imports: [RouterOutlet, AppShell],
  template: '<hh-shell area="Charity events"><router-outlet /></hh-shell>',
})
export class App {}
