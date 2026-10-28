// Creo el molde para TeamConfiguration
export interface HeroTeamConfig {
  heroId: string;
  name?: string;
  role?: string;
  isStarting: boolean;
}

export interface ConfigurationData {
  leaderId: string;
  companionIds?: string[];
  activeHeroIds: string[];
  strategy?: string;
}

export interface TeamConfigResponse { // se pide el dato por metodo http GET
  teamId: string;
  heroes?: HeroTeamConfig[];
  configuration?: ConfigurationData;
}

export interface UpdateTeamConfigRequest { // actualizar el Equipo con PUT
  companionIds?: string[];
  activeHeroIds: string[];
  strategy?: 'AGGRESSIVE' | 'DEFENSIVE' | 'BALANCED' | 'PRAGMATIC' | string;
}