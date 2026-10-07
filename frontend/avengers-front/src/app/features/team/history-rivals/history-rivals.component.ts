import { Component, OnInit } from '@angular/core';
import { AppCopyKey, AppLanguage, I18nService } from '../../../core/services/i18n.service';
import { HistoryRivalsViewModel } from './model/history-rivals-view-model.interface';
import { HistoryRivalsService } from './service/history-rivals.service';

@Component({
  selector: 'app-history-rivals',
  templateUrl: './history-rivals.component.html',
  styleUrls: ['./history-rivals.component.css'],
  standalone: false,
})
export class HistoryRivalsComponent implements OnInit {
  constructor(
    private readonly historyRivalsService: HistoryRivalsService,
    private readonly i18nService: I18nService,
  ) {}

  get pageState(): HistoryRivalsViewModel {
    return this.historyRivalsService.getViewModel();
  }

  ngOnInit(): void {
    this.historyRivalsService.initialize();
  }

  retry(): void {
    this.historyRivalsService.initialize();
  }

  translate(key: AppCopyKey, lang: AppLanguage): string {
    return this.i18nService.translate(key, lang);
  }
}
