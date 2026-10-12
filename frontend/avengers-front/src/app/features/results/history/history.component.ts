import { Component, OnInit } from '@angular/core';
import { HistoryService } from './service/history.service';
import { HistoryViewModel } from './model/history-view-model.interface';

@Component({
  selector: 'app-history',
  templateUrl: './history.component.html',
  styleUrls: ['./history.component.css'],
  standalone: false,
})
export class HistoryComponent implements OnInit {
  constructor(private readonly historyService: HistoryService) {}

  get pageState(): HistoryViewModel {
    return this.historyService.getViewModel();
  }
  ngOnInit(): void {
    this.historyService.initialize();
  }
}
