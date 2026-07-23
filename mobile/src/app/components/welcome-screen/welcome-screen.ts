import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-welcome-screen',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './welcome-screen.html',
  styleUrls: ['./welcome-screen.css']
})
export class WelcomeScreen {
  constructor(private router: Router) {}

  startLearning() {
    this.router.navigate(['/login']);
  }
}
