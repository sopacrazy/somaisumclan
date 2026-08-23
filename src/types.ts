export interface ClanLabel {
  name: string;
  iconUrls: { small: string; medium: string };
}

export interface LeagueRef {
  name: string;
  iconUrls?: { small: string; tiny?: string; medium?: string; large?: string };
}

export interface CapitalDistrict {
  name: string;
  districtHallLevel: number;
}

export interface ClanMember {
  tag: string;
  name: string;
  role: string;
  townHallLevel: number;
  expLevel: number;
  trophies: number;
  builderBaseTrophies: number;
  donations: number;
  donationsReceived: number;
  clanRank: number;
  previousClanRank: number;
  league?: LeagueRef;
}

export interface WarAttack {
  attackerTag: string;
  defenderTag: string;
  stars: number;
  destructionPercentage: number;
  order: number;
}

export interface WarMember {
  tag: string;
  name: string;
  mapPosition: number;
  townhallLevel: number;
  attacks?: WarAttack[];
  opponentAttacks: number;
  bestOpponentAttack?: WarAttack;
}

export interface WarClanSummary {
  tag: string;
  name: string;
  badgeUrls: { small: string; medium: string; large: string };
  clanLevel: number;
  attacks: number;
  stars: number;
  destructionPercentage: number;
  members: WarMember[];
}

export type WarState = 'notInWar' | 'preparation' | 'inWar' | 'warEnded';

export interface CurrentWar {
  state: WarState;
  teamSize?: number;
  attacksPerMember?: number;
  preparationStartTime?: string;
  startTime?: string;
  endTime?: string;
  clan?: WarClanSummary;
  opponent?: WarClanSummary;
}

export interface ClanInfo {
  tag: string;
  name: string;
  description: string;
  type: string;
  location?: { name: string; countryCode?: string };
  clanLevel: number;
  clanPoints: number;
  clanBuilderBasePoints: number;
  clanCapitalPoints: number;
  capitalLeague?: LeagueRef;
  members: number;
  requiredTrophies: number;
  requiredTownhallLevel?: number;
  requiredBuilderBaseTrophies?: number;
  warFrequency: string;
  warWinStreak: number;
  warWins: number;
  warTies: number;
  warLosses: number;
  isWarLogPublic: boolean;
  warLeague?: LeagueRef;
  badgeUrls: {
    small: string;
    medium: string;
    large: string;
  };
  memberList: ClanMember[];
  labels: ClanLabel[];
  chatLanguage?: { name: string };
  clanCapital?: {
    capitalHallLevel: number;
    districts: CapitalDistrict[];
  };
}
