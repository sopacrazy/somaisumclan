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
