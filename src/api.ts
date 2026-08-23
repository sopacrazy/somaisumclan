import type { ClanInfo, CurrentWar } from './types';

export class ClanApiError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = 'ClanApiError';
    this.status = status;
  }
}

function normalizeTag(tag: string): string {
  const trimmed = tag.trim().toUpperCase();
  return trimmed.startsWith('#') ? trimmed : `#${trimmed}`;
}

export async function fetchClan(tag: string): Promise<ClanInfo> {
  const res = await fetch(`/api/coc/clans/${encodeURIComponent(normalizeTag(tag))}`);

  if (!res.ok) {
    if (res.status === 403) {
      throw new ClanApiError(
        'Acesso negado pela API (403). O token só aceita requisições vindas do IP cadastrado em developer.clashofclans.com.',
        403
      );
    }
    if (res.status === 404) {
      throw new ClanApiError('Clã não encontrado. Confira a tag.', 404);
    }
    throw new ClanApiError(`Falha ao buscar clã (HTTP ${res.status}).`, res.status);
  }

  return res.json() as Promise<ClanInfo>;
}

export async function fetchCurrentWar(tag: string): Promise<CurrentWar> {
  const res = await fetch(`/api/coc/clans/${encodeURIComponent(normalizeTag(tag))}/currentwar`);

  if (!res.ok) {
    if (res.status === 403) {
      throw new ClanApiError(
        'Acesso negado pela API (403). O token só aceita requisições vindas do IP cadastrado em developer.clashofclans.com.',
        403
      );
    }
    if (res.status === 404) {
      throw new ClanApiError('Registro de guerra não encontrado ou privado.', 404);
    }
    throw new ClanApiError(`Falha ao buscar guerra (HTTP ${res.status}).`, res.status);
  }

  return res.json() as Promise<CurrentWar>;
}
