// Creo el molde para TeamConfiguration
export interface HeroTeamConfig {
  heroId: string;
  name?: string;
  role?: string;
  isStarting: boolean;
}

export interface TeamConfigResponse { // se pide el dato por metodo http GET
  teamId: string;
  heroes: HeroTeamConfig[]; // trae el array de HeroTeamConfig
}


export interface UpdateTeamConfigRequest { // actualizar el Equipo con PUT
  startingHeroIds: string[];
}