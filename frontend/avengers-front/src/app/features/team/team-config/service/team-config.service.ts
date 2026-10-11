import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService } from '../../../../core/services/api.service';
import { BaseApiService } from '../../../../core/services/base-api.service';
import { TeamConfigResponse, UpdateTeamConfigRequest } from '../model/team-config.interface';

@Injectable({ providedIn: 'root' })
export class TeamConfigService extends BaseApiService {
  constructor(private readonly apiService: ApiService) {
    super(apiService);
  }

  // GET -> Obtiene la alineación actual del equipo desde el backend
  getTeamConfiguration(teamId: string): Observable<TeamConfigResponse> {
    return this.apiService.get<TeamConfigResponse>(`/my-team/configuration/${teamId}`).pipe(
      map((res: unknown): TeamConfigResponse => {
        const payload = res as { data?: TeamConfigResponse };
        if (payload && payload.data !== undefined) {
          return payload.data;
        }
        return res as TeamConfigResponse;
      })
    );
  }

  // PUT -> Guarda los titulares seleccionados en el backend
  updateTeamConfiguration(teamId: string, datos: UpdateTeamConfigRequest): Observable<void> {
    return this.apiService.put<void>(`/my-team/configuration/${teamId}`, datos).pipe(
      map(() => undefined)
    );
  }

  // GET -> Obtiene la lista de héroes pertenecientes al equipo
  getMyTeamHeroes(): Observable<unknown> {
    return this.getData<unknown>('/my-team/heroes');
  }
}