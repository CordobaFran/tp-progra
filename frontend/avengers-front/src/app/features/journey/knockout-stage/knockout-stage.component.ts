import { Component, OnInit } from '@angular/core';
import { KnockoutStageService } from './service/knockout-stage.service';

@Component({
  selector: 'app-knockout-stage',
  templateUrl: './knockout-stage.component.html',
  styleUrls: ['./knockout-stage.component.css'],
  standalone: false,
})
export class KnockoutStageComponent implements OnInit {
  constructor(private readonly knockoutstageService: KnockoutStageService) {}

  ngOnInit(): void {
    this.knockoutstageService.initialize();
  }
}
