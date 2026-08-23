import type { CurrentWar, WarMember, WarState } from './types';

export function suggestTarget(mapPosition: number, opponentMembers: WarMember[]): WarMember | undefined {
  const sorted = [...opponentMembers].sort((a, b) => a.mapPosition - b.mapPosition);
  if (!sorted.length) return undefined;

  const isFullyStarred = (m: WarMember) => (m.bestOpponentAttack?.stars ?? 0) >= 3;

  const same = sorted.find((m) => m.mapPosition === mapPosition);
  if (same && !isFullyStarred(same)) return same;

  const startIdx = sorted.findIndex((m) => m.mapPosition === mapPosition);
  for (let i = 1; i <= sorted.length; i++) {
    const candidate = sorted[(startIdx + i + sorted.length) % sorted.length];
    if (!isFullyStarred(candidate)) return candidate;
  }

  return same ?? sorted[0];
}

const WAR_STATE_PROMPT_LABEL: Record<WarState, string> = {
  notInWar: 'sem guerra',
  preparation: 'preparação',
  inWar: 'guerra em andamento',
  warEnded: 'guerra encerrada',
};

export function buildStrategyPrompt(
  attacker: WarMember,
  target: WarMember,
  war: CurrentWar
): string {
  const attacksUsed = attacker.attacks?.length ?? 0;
  const attacksPerMember = war.attacksPerMember ?? 2;
  const attacksRemaining = attacksPerMember - attacksUsed;
  const remainingClanAttacks =
    (war.teamSize ?? 0) * attacksPerMember - (war.clan?.attacks ?? 0);

  return `Coach de Clash of Clans. Ataque: CV${attacker.townhallLevel} (pos. ${attacker.mapPosition}, ${attacksRemaining} ataques restantes) vs CV${target.townhallLevel} (pos. ${target.mapPosition}, ${target.opponentAttacks} ataques recebidos, melhor resultado ${target.bestOpponentAttack?.stars ?? 0}⭐). Placar da guerra: ${war.clan?.stars ?? 0}x${war.opponent?.stars ?? 0}, ${remainingClanAttacks} ataques restantes no clã, fase ${WAR_STATE_PROMPT_LABEL[war.state]}.

Responda em português, direto e prático, com: composição de exército, estratégia de ataque (entrada e prioridade), tropas de suporte, e uma dica baseada no placar. Máximo 150 palavras.`;
}

export class StrategyApiError extends Error {}

export async function fetchAIStrategy(prompt: string): Promise<string> {
  const res = await fetch('/api/strategy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new StrategyApiError(body?.error ?? `Falha ao gerar estratégia (HTTP ${res.status}).`);
  }

  const data = (await res.json()) as { text: string };
  return data.text;
}
