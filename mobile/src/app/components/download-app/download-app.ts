import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-download-app',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './download-app.html',
  styleUrls: ['./download-app.css']
})
export class DownloadAppComponent {}
