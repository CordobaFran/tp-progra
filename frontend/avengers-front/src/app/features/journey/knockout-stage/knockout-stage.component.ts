import { Component, OnInit } from '@angular/core';
import { KnockoutStageService } from './service/knockout-stage.service';
import { KnockoutStageCodeEnum } from './model/knockout-stage-code.enum';
import { KnockoutStageViewModel } from './model/knockout-stage-view-model.interface';

@Component({
  selector: 'app-knockout-stage',
  templateUrl: './knockout-stage.component.html',
  styleUrls: ['./knockout-stage.component.css'],
  standalone: false,
})
export class KnockoutStageComponent implements OnInit {
  readonly knockoutStageCodeEnum = KnockoutStageCodeEnum;
  constructor(private readonly knockoutStageService: KnockoutStageService) {}

  get pageState(): KnockoutStageViewModel {
    return this.knockoutStageService.getViewModel();
  }

  ngOnInit(): void {
    this.knockoutStageService.initialize();
  }

  retry(): void {
    this.knockoutStageService.initialize();
  }
}
