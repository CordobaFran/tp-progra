import { Injectable } from '@nestjs/common';
import { FinalStageService } from '../shared/final-stage.service';

@Injectable()
export class FinalBattleService {
  constructor(private readonly finalStage: FinalStageService) {}

  getState() {
    return this.finalStage.getState();
  }

  getEvents() {
    return this.finalStage.getEvents();
  }

  // TODO: Implement R9 commands/composition through the Game API.
}
