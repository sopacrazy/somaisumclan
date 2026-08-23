import type { ClanInfo, ClanMember, CurrentWar, Player, PlayerHero, WarAttack, WarClanSummary, WarMember } from './types';
import { armyPresetFor } from './data/armyPresets';
import { buildStrategyPrompt, fetchAIStrategy, suggestTarget, StrategyApiError } from './warStrategy';

// Oculto por enquanto: a IA só recebe dados textuais (CV, posição, placar),
// sem imagem da base, então a sugestão ainda é genérica por CV, não análise
// da base real. Trocar para true reativa o botão "Ver Estratégia" no mapa.
const SHOW_STRATEGY_BUTTON = false;

export function renderClanLoading(): void {
  const el = document.getElementById('clanRoot');
  if (!el) return;
  el.innerHTML = `<div class="status-block">Carregando dados do clã…</div>`;
}

export function renderClanError(message: string): void {
  const el = document.getElementById('clanRoot');
  if (!el) return;
  el.innerHTML = `
    <div class="status-block status-error">⚠️ ${message}</div>
    <button class="btn btn-ghost" id="retryBtn" style="margin-top:14px">Tentar novamente</button>
  `;
}

export function renderWarLoading(): void {
  const el = document.getElementById('warRoot');
  if (!el) return;
  el.innerHTML = `<div class="status-block">Carregando guerra atual…</div>`;
}

export function renderWarError(message: string): void {
  const el = document.getElementById('warRoot');
  if (!el) return;
  el.innerHTML = `
    <div class="status-block status-error">⚠️ ${message}</div>
    <button class="btn btn-ghost" id="warRetryBtn" style="margin-top:14px">Tentar novamente</button>
  `;
}

const PLAYER_BACK_BTN = `<button class="btn btn-ghost player-back-btn" type="button" id="playerBackBtn">← Voltar</button>`;

export function renderPlayerLoading(): void {
  const el = document.getElementById('playerRoot');
  if (!el) return;
  el.innerHTML = `${PLAYER_BACK_BTN}<div class="status-block">Carregando jogador…</div>`;
  wirePlayerBackButton();
}

export function renderPlayerError(message: string): void {
  const el = document.getElementById('playerRoot');
  if (!el) return;
  el.innerHTML = `
    ${PLAYER_BACK_BTN}
    <div class="status-block status-error">⚠️ ${message}</div>
    <button class="btn btn-ghost" id="playerRetryBtn" style="margin-top:14px">Tentar novamente</button>
  `;
  wirePlayerBackButton();
}

function wirePlayerBackButton(): void {
  document.getElementById('playerBackBtn')?.addEventListener('click', () => {
    window.location.hash = '';
  });
}

const ROLE_LABEL: Record<string, string> = {
  member: 'Membro',
  admin: 'Ancião',
  elder: 'Ancião',
  coLeader: 'Vice-líder',
  leader: 'Líder',
};

const TYPE_LABEL: Record<string, string> = {
  open: 'Aberto',
  inviteOnly: 'Somente convite',
  closed: 'Fechado',
};

const WAR_FREQ_LABEL: Record<string, string> = {
  always: 'Sempre',
  moreThanOncePerWeek: 'Mais de 1x por semana',
  oncePerWeek: '1x por semana',
  lessThanOncePerWeek: 'Menos de 1x por semana',
  never: 'Nunca',
  unknown: 'Não informado',
};

const WAR_STATE_LABEL: Record<string, string> = {
  notInWar: 'Sem guerra no momento',
  preparation: 'Em preparação',
  inWar: 'Guerra em andamento',
  warEnded: 'Guerra encerrada',
};

const MEMBERS_PER_PAGE = 6;

function roleLabel(role: string): string {
  return ROLE_LABEL[role] ?? role;
}

function parseCocDate(value?: string): Date | undefined {
  if (!value) return undefined;
  const iso = value.replace(
    /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})\.000Z$/,
    '$1-$2-$3T$4:$5:$6.000Z'
  );
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function formatTimeRemaining(target?: Date): string {
  if (!target) return '—';
  const diffMs = target.getTime() - Date.now();
  if (diffMs <= 0) return 'a qualquer momento';
  const totalMinutes = Math.round(diffMs / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours <= 0) return `${minutes}min`;
  return `${hours}h ${minutes}min`;
}

function formatDateTime(date?: Date): string {
  if (!date) return '—';
  return date.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

function bestAttack(m: WarMember): WarAttack | undefined {
  if (!m.attacks?.length) return undefined;
  return [...m.attacks].sort((a, b) => b.stars - a.stars || b.destructionPercentage - a.destructionPercentage)[0];
}

function starDisplay(stars: number): string {
  return '⭐'.repeat(Math.max(0, stars)) + '☆'.repeat(Math.max(0, 3 - stars));
}

function warMapRow(m: WarMember, attacksPerMember: number, showStrategyBtn: boolean): string {
  const attack = bestAttack(m);
  const attacksUsed = m.attacks?.length ?? 0;
  const result = attack
    ? `<span class="war-row-stars">${starDisplay(attack.stars)}</span><span class="war-row-pct">${attack.destructionPercentage}%</span>`
    : `<span class="war-row-pending">Sem ataque ainda</span>`;

  return `
    <div class="war-row" data-player-tag="${m.tag}">
      <div class="war-row-pos">${m.mapPosition}</div>
      <div class="war-row-main">
        <strong>${m.name}</strong>
        <span>CV ${m.townhallLevel} · ${attacksUsed}/${attacksPerMember} ataques</span>
      </div>
      <div class="war-row-result">${result}</div>
      ${showStrategyBtn ? `<button class="war-strategy-btn" type="button" data-strategy-tag="${m.tag}">⚔️ Ver Estratégia</button>` : ''}
    </div>
  `;
}

function warClanHead(c: WarClanSummary, side: 'us' | 'them'): string {
  return `
    <div class="war-side war-side-${side}">
      <img class="war-side-badge" src="${c.badgeUrls.medium}" alt="${c.name}"
           onerror="this.style.display='none'">
      <div class="war-side-name">${c.name}</div>
      <div class="war-side-level">Nível ${c.clanLevel}</div>
    </div>
  `;
}

function memberCard(m: ClanMember, i: number): string {
  const page = Math.floor(i / MEMBERS_PER_PAGE);

  return `
    <article class="member-card" data-member-page="${page}" data-player-tag="${m.tag}">
      <div class="member-rank">
        <span>${i + 1}</span>
      </div>
      <div class="member-main">
        <div class="member-name-line">
          <strong>${m.name}</strong>
          ${rankDelta(m.clanRank, m.previousClanRank)}
        </div>
        <span>${roleLabel(m.role)} · Nv. ${m.expLevel}</span>
      </div>
      <div class="member-donations">
        <span>Doou <strong>${m.donations.toLocaleString('pt-BR')}</strong></span>
        <span>Recebeu <strong>${m.donationsReceived.toLocaleString('pt-BR')}</strong></span>
      </div>
      <div class="member-trophies">
        <strong>${m.trophies.toLocaleString('pt-BR')}</strong>
        <span>🏆</span>
      </div>
    </article>
  `;
}

function countryFlag(code?: string): string {
  if (!code || code.length !== 2) return '';
  const base = 0x1f1e6;
  const chars = code
    .toUpperCase()
    .split('')
    .map((c) => String.fromCodePoint(base + (c.charCodeAt(0) - 65)));
  return chars.join('');
}

function rankDelta(current: number, previous: number): string {
  if (!previous || current === previous) return '<span class="delta delta-flat">–</span>';
  if (current < previous) return `<span class="delta delta-up">▲ ${previous - current}</span>`;
  return `<span class="delta delta-down">▼ ${current - previous}</span>`;
}

function updateBannerBadge(imgUrl: string, alt: string): void {
  const img = document.getElementById('bannerBadge') as HTMLImageElement | null;
  const fallback = document.getElementById('bannerBadgeFallback');
  if (!img) return;
  img.src = imgUrl;
  img.alt = alt;
  img.style.display = '';
  img.onload = () => fallback?.style.setProperty('display', 'none');
  img.onerror = () => {
    img.style.display = 'none';
    fallback?.style.removeProperty('display');
  };
}

export function renderClan(clan: ClanInfo): void {
  updateBannerBadge(clan.badgeUrls.large, clan.name);

  const el = document.getElementById('clanRoot');
  if (!el) return;

  const members = [...clan.memberList].sort((a, b) => a.clanRank - b.clanRank);
  const totalWars = clan.warWins + clan.warTies + clan.warLosses;
  const winPct = totalWars ? Math.round((clan.warWins / totalWars) * 100) : 0;
  const tiePct = totalWars ? Math.round((clan.warTies / totalWars) * 100) : 0;
  const lossPct = totalWars ? 100 - winPct - tiePct : 0;
  const pageCount = Math.max(1, Math.ceil(members.length / MEMBERS_PER_PAGE));

  el.innerHTML = `
    <div class="profile">
      <img class="profile-badge" src="${clan.badgeUrls.large}" alt="${clan.name}"
           onerror="this.outerHTML='<span class=\\'profile-badge-fallback\\'>🛡️</span>'">
      <div class="profile-main">
        <h1 class="profile-name">${clan.name}</h1>
        <div class="profile-tag">${clan.tag} · Nível ${clan.clanLevel}</div>
        <div class="profile-pills">
          <span class="pill">${TYPE_LABEL[clan.type] ?? clan.type}</span>
          ${clan.location ? `<span class="pill">${countryFlag(clan.location.countryCode)} ${clan.location.name}</span>` : ''}
          ${clan.chatLanguage ? `<span class="pill">💬 ${clan.chatLanguage.name}</span>` : ''}
        </div>
        ${clan.description ? `<p class="profile-desc">${clan.description}</p>` : ''}
        ${
          clan.labels.length
            ? `<div class="label-row">
                ${clan.labels
                  .map(
                    (l) => `
                  <span class="label-chip">
                    <img src="${l.iconUrls.small}" alt="${l.name}" onerror="this.style.display='none'">
                    ${l.name}
                  </span>
                `
                  )
                  .join('')}
              </div>`
            : ''
        }
      </div>
    </div>

    <div class="stat-grid">
      <div class="stat-tile"><div class="stat-value">🏆 ${clan.clanPoints.toLocaleString('pt-BR')}</div><div class="stat-label">Troféus do clã</div></div>
      <div class="stat-tile"><div class="stat-value">👥 ${clan.members}/50</div><div class="stat-label">Membros</div></div>
      <div class="stat-tile"><div class="stat-value">🔨 ${clan.clanBuilderBasePoints.toLocaleString('pt-BR')}</div><div class="stat-label">Pontos base do construtor</div></div>
      <div class="stat-tile"><div class="stat-value">🏛️ ${clan.clanCapitalPoints.toLocaleString('pt-BR')}</div><div class="stat-label">Pontos da capital</div></div>
      <div class="stat-tile"><div class="stat-value">${clan.requiredTrophies.toLocaleString('pt-BR')}</div><div class="stat-label">Troféus mínimos p/ entrar</div></div>
      <div class="stat-tile"><div class="stat-value">CV ${clan.requiredTownhallLevel ?? '—'}</div><div class="stat-label">Centro de vila mínimo</div></div>
    </div>

    <div class="two-col">
      <div class="panel">
        <h2 class="panel-title">⚔️ Guerra de clãs</h2>
        <div class="war-bar">
          <div class="war-bar-win" style="width:${winPct}%"></div>
          <div class="war-bar-tie" style="width:${tiePct}%"></div>
          <div class="war-bar-loss" style="width:${lossPct}%"></div>
        </div>
        <div class="war-legend">
          <span><i class="dot dot-win"></i> ${clan.warWins} vitórias</span>
          <span><i class="dot dot-tie"></i> ${clan.warTies} empates</span>
          <span><i class="dot dot-loss"></i> ${clan.warLosses} derrotas</span>
        </div>
        <div class="panel-rows">
          <div class="panel-row"><span>Sequência atual</span><strong>🔥 ${clan.warWinStreak}</strong></div>
          <div class="panel-row"><span>Frequência</span><strong>${WAR_FREQ_LABEL[clan.warFrequency] ?? clan.warFrequency}</strong></div>
          ${clan.warLeague ? `<div class="panel-row"><span>Liga de guerra</span><strong>${clan.warLeague.name}</strong></div>` : ''}
          <div class="panel-row"><span>Registro público</span><strong>${clan.isWarLogPublic ? 'Sim' : 'Não'}</strong></div>
        </div>
      </div>

      <div class="panel">
        <h2 class="panel-title">🏛️ Capital do clã</h2>
        <div class="panel-rows">
          <div class="panel-row"><span>Nível do Pico da Capital</span><strong>${clan.clanCapital?.capitalHallLevel ?? '—'}</strong></div>
          ${clan.capitalLeague ? `<div class="panel-row"><span>Liga da capital</span><strong>${clan.capitalLeague.name}</strong></div>` : ''}
        </div>
        ${
          clan.clanCapital?.districts.length
            ? `<div class="district-grid">
                ${clan.clanCapital.districts
                  .map(
                    (d) => `
                  <div class="district-chip">
                    <div class="district-name">${d.name}</div>
                    <div class="district-lv">Nv. ${d.districtHallLevel}</div>
                  </div>
                `
                  )
                  .join('')}
              </div>`
            : ''
        }
      </div>
    </div>

    <div class="panel member-panel">
      <div class="member-panel-head">
        <h2 class="panel-title">👥 Membros (${members.length})</h2>
        <div class="member-sort-badge">Mais troféus e liga mais alta</div>
      </div>
      <div class="member-list" id="memberList">
        ${members.map(memberCard).join('')}
      </div>
      <div class="member-pagination" id="memberPagination" aria-label="Paginação dos membros">
        <button class="page-btn" type="button" data-page-action="prev" aria-label="Página anterior">‹</button>
        <span id="memberPageLabel">Página 1/${pageCount}</span>
        <button class="page-btn" type="button" data-page-action="next" aria-label="Próxima página">›</button>
      </div>
    </div>
  `;

  let currentPage = 0;
  const cards = [...el.querySelectorAll<HTMLElement>('[data-member-page]')];
  const pageLabel = el.querySelector<HTMLElement>('#memberPageLabel');
  const pageButtons = [...el.querySelectorAll<HTMLButtonElement>('[data-page-action]')];
  const renderPage = (page: number) => {
    currentPage = Math.min(Math.max(page, 0), pageCount - 1);
    cards.forEach((card) => {
      card.hidden = Number(card.dataset.memberPage) !== currentPage;
    });
    if (pageLabel) pageLabel.textContent = `Página ${currentPage + 1}/${pageCount}`;
    pageButtons.forEach((button) => {
      const action = button.dataset.pageAction;
      button.disabled = (action === 'prev' && currentPage === 0) || (action === 'next' && currentPage === pageCount - 1);
    });
  };
  pageButtons.forEach((button) => {
    button.addEventListener('click', () => {
      renderPage(currentPage + (button.dataset.pageAction === 'next' ? 1 : -1));
    });
  });
  renderPage(0);

  el.querySelectorAll<HTMLElement>('[data-player-tag]').forEach((card) => {
    card.addEventListener('click', () => {
      window.location.hash = `#/player/${encodeURIComponent(card.dataset.playerTag!)}`;
    });
  });
}

let currentWar: CurrentWar | null = null;

export function renderWar(war: CurrentWar): void {
  const el = document.getElementById('warRoot');
  if (!el) return;

  currentWar = war;

  if (war.state === 'notInWar' || !war.clan || !war.opponent) {
    el.innerHTML = `
      <div class="panel war-empty">
        <div class="war-empty-icon">⚔️</div>
        <p>O clã não está em guerra no momento.</p>
      </div>
    `;
    return;
  }

  const { clan, opponent } = war;
  const attacksPerMember = war.attacksPerMember ?? 2;
  const totalAttacks = (war.teamSize ?? clan.members.length) * attacksPerMember;
  const clanPct = clan.attacks + opponent.attacks ? Math.round((clan.stars / Math.max(1, clan.stars + opponent.stars)) * 100) : 50;

  const prep = parseCocDate(war.preparationStartTime);
  const start = parseCocDate(war.startTime);
  const end = parseCocDate(war.endTime);

  const timeInfo =
    war.state === 'preparation'
      ? `<div class="panel-row"><span>Guerra começa</span><strong>${formatDateTime(start)} · em ${formatTimeRemaining(start)}</strong></div>`
      : war.state === 'inWar'
        ? `<div class="panel-row"><span>Guerra termina</span><strong>${formatDateTime(end)} · em ${formatTimeRemaining(end)}</strong></div>`
        : `<div class="panel-row"><span>Terminou em</span><strong>${formatDateTime(end)}</strong></div>`;

  const clanMembers = [...clan.members].sort((a, b) => a.mapPosition - b.mapPosition);
  const opponentMembers = [...opponent.members].sort((a, b) => a.mapPosition - b.mapPosition);
  const canAttack = SHOW_STRATEGY_BUTTON && (war.state === 'preparation' || war.state === 'inWar');

  el.innerHTML = `
    <div class="panel war-head">
      <div class="war-vs-row">
        ${warClanHead(clan, 'us')}
        <div class="war-vs-divider">VS</div>
        ${warClanHead(opponent, 'them')}
      </div>
      <div class="war-state-pill">${WAR_STATE_LABEL[war.state] ?? war.state}</div>
      <div class="panel-rows" style="margin-top:16px">
        <div class="panel-row"><span>Tamanho da guerra</span><strong>${war.teamSize ?? clan.members.length} vs ${war.teamSize ?? opponent.members.length}</strong></div>
        <div class="panel-row"><span>Ataques por membro</span><strong>${attacksPerMember}</strong></div>
        ${prep && war.state === 'preparation' ? `<div class="panel-row"><span>Preparação iniciou</span><strong>${formatDateTime(prep)}</strong></div>` : ''}
        ${timeInfo}
      </div>
    </div>

    <div class="panel war-score">
      <div class="war-score-bar">
        <div class="war-score-bar-us" style="width:${clanPct}%"></div>
        <div class="war-score-bar-them" style="width:${100 - clanPct}%"></div>
      </div>
      <div class="war-score-grid">
        <div class="war-score-tile">
          <div class="war-score-value">⭐ ${clan.stars}</div>
          <div class="war-score-sub">${clan.destructionPercentage.toFixed(1)}% destruição</div>
          <div class="war-score-sub">${clan.attacks}/${totalAttacks} ataques</div>
        </div>
        <div class="war-score-tile war-score-tile-them">
          <div class="war-score-value">⭐ ${opponent.stars}</div>
          <div class="war-score-sub">${opponent.destructionPercentage.toFixed(1)}% destruição</div>
          <div class="war-score-sub">${opponent.attacks}/${totalAttacks} ataques</div>
        </div>
      </div>
    </div>

    <div class="panel war-map-panel">
      <h2 class="panel-title">🗺️ Mapa de guerra</h2>
      <div class="war-map">
        <div class="war-map-col">
          <div class="war-map-col-head">${clan.name}</div>
          ${clanMembers.map((m) => warMapRow(m, attacksPerMember, canAttack)).join('')}
        </div>
        <div class="war-map-col">
          <div class="war-map-col-head">${opponent.name}</div>
          ${opponentMembers.map((m) => warMapRow(m, attacksPerMember, false)).join('')}
        </div>
      </div>
    </div>
  `;

  el.querySelectorAll<HTMLButtonElement>('[data-strategy-tag]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      openStrategyModal(btn.dataset.strategyTag!);
    });
  });

  el.querySelectorAll<HTMLElement>('.war-row[data-player-tag]').forEach((row) => {
    row.addEventListener('click', () => {
      window.location.hash = `#/player/${encodeURIComponent(row.dataset.playerTag!)}`;
    });
  });
}

function getModalRoot(): HTMLElement {
  let root = document.getElementById('modalRoot');
  if (!root) {
    root = document.createElement('div');
    root.id = 'modalRoot';
    document.body.appendChild(root);
  }
  return root;
}

function troopChip(t: { name: string; emoji: string; quantity: number; imagePath?: string }): string {
  // TODO: substituir emoji por imagem real quando t.imagePath estiver disponível
  const icon = t.imagePath
    ? `<img src="${t.imagePath}" alt="${t.name}" onerror="this.replaceWith(document.createTextNode('${t.emoji}'))">`
    : t.emoji;
  return `
    <div class="troop-chip" title="${t.name}">
      <span class="troop-chip-icon">${icon}</span>
      <span class="troop-chip-qty">x${t.quantity}</span>
    </div>
  `;
}

function formatAIResponse(text: string): string {
  const escaped = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const withBold = escaped.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  const lines = withBold.split('\n');
  let html = '';
  let inList = false;
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (/^[-*]\s+/.test(line)) {
      if (!inList) {
        html += '<ul>';
        inList = true;
      }
      html += `<li>${line.replace(/^[-*]\s+/, '')}</li>`;
    } else {
      if (inList) {
        html += '</ul>';
        inList = false;
      }
      if (line) html += `<p>${line}</p>`;
    }
  }
  if (inList) html += '</ul>';
  return html || '<p>Sem resposta.</p>';
}

function closeStrategyModal(): void {
  const root = document.getElementById('modalRoot');
  if (root) root.innerHTML = '';
  document.removeEventListener('keydown', modalKeydownHandler);
}

function modalKeydownHandler(e: KeyboardEvent): void {
  if (e.key === 'Escape') closeStrategyModal();
}

const aiResponseCache = new Map<string, string>();

function cacheKey(attacker: WarMember, target: WarMember): string {
  return `${attacker.tag}:${target.tag}`;
}

function renderAIResult(text: string): string {
  return `
    <div class="ai-result">${formatAIResponse(text)}</div>
    <button class="btn btn-ghost" id="aiRegenerateBtn" type="button">🔄 Regenerar</button>
  `;
}

async function runAIStrategy(attacker: WarMember, target: WarMember, war: CurrentWar, force = false): Promise<void> {
  const panel = document.getElementById('aiStrategyPanel');
  if (!panel) return;

  const key = cacheKey(attacker, target);
  if (!force && aiResponseCache.has(key)) {
    panel.innerHTML = renderAIResult(aiResponseCache.get(key)!);
    document.getElementById('aiRegenerateBtn')?.addEventListener('click', () => runAIStrategy(attacker, target, war, true));
    return;
  }

  panel.innerHTML = `<div class="ai-loading"><span class="ai-spinner"></span> 🤖 Analisando guerra…</div>`;

  try {
    const prompt = buildStrategyPrompt(attacker, target, war);
    const text = await fetchAIStrategy(prompt);
    aiResponseCache.set(key, text);
    panel.innerHTML = renderAIResult(text);
    document.getElementById('aiRegenerateBtn')?.addEventListener('click', () => runAIStrategy(attacker, target, war, true));
  } catch (err) {
    const message = err instanceof StrategyApiError ? err.message : 'Não foi possível gerar a estratégia.';
    panel.innerHTML = `
      <div class="status-block status-error">⚠️ ${message}</div>
      <button class="btn btn-ghost" id="aiRegenerateBtn" type="button">Tentar novamente</button>
    `;
    document.getElementById('aiRegenerateBtn')?.addEventListener('click', () => runAIStrategy(attacker, target, war, true));
  }
}

function openStrategyModal(attackerTag: string): void {
  if (!currentWar?.clan || !currentWar.opponent) return;
  const attacker = currentWar.clan.members.find((m) => m.tag === attackerTag);
  if (!attacker) return;

  const target = suggestTarget(attacker.mapPosition, currentWar.opponent.members);
  if (!target) return;

  const preset = armyPresetFor(attacker.townhallLevel);

  const root = getModalRoot();
  root.innerHTML = `
    <div class="modal-backdrop" id="strategyBackdrop">
      <div class="modal" role="dialog" aria-modal="true">
        <button class="modal-close" type="button" id="strategyCloseBtn" aria-label="Fechar">✕</button>

        <div class="strategy-vs">
          <div class="strategy-side">
            <div class="strategy-avatar">🏰<span>${attacker.townhallLevel}</span></div>
            <strong>${attacker.name}</strong>
            <span>CV ${attacker.townhallLevel} · Posição ${attacker.mapPosition}</span>
          </div>
          <div class="strategy-arrow">→</div>
          <div class="strategy-side">
            <div class="strategy-avatar strategy-avatar-target">🏯<span>${target.townhallLevel}</span></div>
            <strong>${target.name}</strong>
            <span>CV ${target.townhallLevel} · Posição ${target.mapPosition}</span>
          </div>
        </div>

        <div class="strategy-target-info">
          Alvo sugerido: mesma posição no mapa${target.mapPosition !== attacker.mapPosition ? ' (ajustado, alvo original já com 3⭐)' : ''} ·
          ${target.opponentAttacks} ataque(s) recebido(s) · melhor resultado: ${starDisplay(target.bestOpponentAttack?.stars ?? 0)}
        </div>

        ${
          preset
            ? `
        <div class="strategy-section">
          <h3 class="strategy-section-title">⚔️ Exército recomendado — ${preset.name}</h3>
          <p class="strategy-section-desc">${preset.description}</p>
          <div class="troop-grid">${preset.troops.map(troopChip).join('')}</div>
          <div class="troop-grid troop-grid-spells">${preset.spells.map(troopChip).join('')}</div>
        </div>
        `
            : ''
        }

        <div class="strategy-section strategy-ai-section">
          <h3 class="strategy-section-title">🤖 Estratégia gerada por IA</h3>
          <div id="aiStrategyPanel">
            ${
              aiResponseCache.has(cacheKey(attacker, target))
                ? renderAIResult(aiResponseCache.get(cacheKey(attacker, target))!)
                : `<button class="btn btn-primary" id="aiGenerateBtn" type="button">🤖 Gerar Estratégia com IA</button>`
            }
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn btn-ghost" id="strategyFooterCloseBtn" type="button">Fechar</button>
          <span class="modal-disclaimer">Sugestão gerada por IA · Adapte conforme seu estilo</span>
        </div>
      </div>
    </div>
  `;

  const war = currentWar;
  document.getElementById('aiGenerateBtn')?.addEventListener('click', () => runAIStrategy(attacker, target, war));
  document.getElementById('aiRegenerateBtn')?.addEventListener('click', () => runAIStrategy(attacker, target, war, true));
  document.getElementById('strategyCloseBtn')?.addEventListener('click', closeStrategyModal);
  document.getElementById('strategyFooterCloseBtn')?.addEventListener('click', closeStrategyModal);
  document.getElementById('strategyBackdrop')?.addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeStrategyModal();
  });
  document.addEventListener('keydown', modalKeydownHandler);
}

function heroBar(h: PlayerHero): string {
  const pct = Math.round((h.level / h.maxLevel) * 100);
  return `
    <div class="hero-row">
      <div class="hero-row-name">${h.name}</div>
      <div class="hero-row-bar"><div class="hero-row-fill" style="width:${pct}%"></div></div>
      <div class="hero-row-level">${h.level}/${h.maxLevel}</div>
    </div>
  `;
}

export function renderPlayer(player: Player): void {
  const el = document.getElementById('playerRoot');
  if (!el) return;

  el.innerHTML = `
    ${PLAYER_BACK_BTN}

    <div class="profile">
      ${
        player.clan
          ? `<img class="profile-badge" src="${player.clan.badgeUrls.large}" alt="${player.clan.name}"
               onerror="this.outerHTML='<span class=\\'profile-badge-fallback\\'>🛡️</span>'">`
          : `<span class="profile-badge-fallback">🙂</span>`
      }
      <div class="profile-main">
        <h1 class="profile-name">${player.name}</h1>
        <div class="profile-tag">${player.tag} · CV ${player.townHallLevel} · Nv. ${player.expLevel}</div>
        <div class="profile-pills">
          <span class="pill">${roleLabel(player.role)}</span>
          ${player.league ? `<span class="pill">🏆 ${player.league.name}</span>` : ''}
          ${player.clan ? `<span class="pill">${player.clan.name} · Nível ${player.clan.clanLevel}</span>` : ''}
        </div>
      </div>
    </div>

    <div class="stat-grid">
      <div class="stat-tile"><div class="stat-value">🏆 ${player.trophies.toLocaleString('pt-BR')}</div><div class="stat-label">Troféus</div></div>
      <div class="stat-tile"><div class="stat-value">🥇 ${player.bestTrophies.toLocaleString('pt-BR')}</div><div class="stat-label">Recorde de troféus</div></div>
      <div class="stat-tile"><div class="stat-value">⭐ ${player.warStars.toLocaleString('pt-BR')}</div><div class="stat-label">Estrelas de guerra</div></div>
      <div class="stat-tile"><div class="stat-value">⚔️ ${player.attackWins.toLocaleString('pt-BR')}</div><div class="stat-label">Vitórias no ataque</div></div>
      <div class="stat-tile"><div class="stat-value">🛡️ ${player.defenseWins.toLocaleString('pt-BR')}</div><div class="stat-label">Vitórias na defesa</div></div>
      <div class="stat-tile"><div class="stat-value">🎁 ${player.donations.toLocaleString('pt-BR')}</div><div class="stat-label">Doou</div></div>
      <div class="stat-tile"><div class="stat-value">📦 ${player.donationsReceived.toLocaleString('pt-BR')}</div><div class="stat-label">Recebeu</div></div>
      <div class="stat-tile"><div class="stat-value">🏛️ ${player.clanCapitalContributions.toLocaleString('pt-BR')}</div><div class="stat-label">Contribuição na capital</div></div>
    </div>

    ${
      player.heroes.length
        ? `<div class="panel">
            <h2 class="panel-title">🦸 Heróis</h2>
            <div class="hero-list">${player.heroes.map(heroBar).join('')}</div>
          </div>`
        : ''
    }
  `;

  wirePlayerBackButton();
}
