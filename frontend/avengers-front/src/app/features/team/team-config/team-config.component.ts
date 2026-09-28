import { Component, OnInit } from '@angular/core';
import { TeamConfigService } from './service/team-config.service';

@Component({
  selector: 'app-team-config',
  templateUrl: './team-config.component.html',
  styleUrls: ['./team-config.component.css'],
  standalone: false,
})
export class TeamConfigComponent implements OnInit {
  constructor(private readonly teamconfigService: TeamConfigService) {}

  ngOnInit(): void {
    this.teamconfigService.initialize();
  }
}
