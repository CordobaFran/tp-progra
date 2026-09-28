import { Component, OnInit } from '@angular/core';
import { TeamStatusService } from './service/team-status.service';

@Component({
  selector: 'app-team-status',
  templateUrl: './team-status.component.html',
  styleUrls: ['./team-status.component.css'],
  standalone: false,
})
export class TeamStatusComponent implements OnInit {
  constructor(private readonly teamstatusService: TeamStatusService) {}

  ngOnInit(): void {
    this.teamstatusService.initialize();
  }
}
