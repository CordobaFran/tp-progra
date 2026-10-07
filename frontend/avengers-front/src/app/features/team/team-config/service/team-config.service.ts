import {Injectable}  from '@angular/core';
import {Observable} from 'rxjs'; 
import {ApiService} from '../../../../core/services/api.service';
import {BaseApiService} from '../../../../core/services/base-api.service'; // La base tiene metodo abstracto para utilizar los metodos get,post,put.
import {TeamConfigResponse, UpdateTeamConfigRequest} from '../model/team-config.interface'; //

@Injectable({ providedIn: 'root' })
export class TeamConfigService extends BaseApiService {
  constructor(api: ApiService) {
    super(api);
  }

  // GET: Obtiene la alineación actual del equipo desde el backend
  getTeamConfiguration(teamId: string): Observable<TeamConfigResponse> 
  {
    return this.getData<TeamConfigResponse>(`/my-team/configuration/${teamId}`);
  }

  // PUT: Guarda los titulares seleccionados en el backend
  updateTeamConfiguration(teamId: string, datos: UpdateTeamConfigRequest,): Observable<void> 
  {
    return this.putData<void>(`/my-team/configuration/${teamId}`, datos);
  }
}