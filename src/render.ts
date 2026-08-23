import { CDN } from './data';
import type { ClanInfo, ClanMember } from './types';

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

const MEMBERS_PER_PAGE = 6;

const LEAGUE_ICON_BY_NAME: Record<string, string> = {
  'bronze league iii': 'Icon_HV_League_Bronze_1.png',
  'bronze league ii': 'Icon_HV_League_Bronze_1.png',
  'bronze league i': 'Icon_HV_League_Bronze_2.png',
  'silver league iii': 'Icon_HV_League_Silver_1.png',
  'silver league ii': 'Icon_HV_League_Silver_1.png',
  'silver league i': 'Icon_HV_League_Silver_2.png',
  'gold league iii': 'Icon_HV_League_Gold_1.png',
  'gold league ii': 'Icon_HV_League_Gold_1.png',
  'gold league i': 'Icon_HV_League_Gold_2.png',
  'crystal league iii': 'Icon_HV_League_Crystal_1.png',
  'crystal league ii': 'Icon_HV_League_Crystal_1.png',
  'crystal league i': 'Icon_HV_League_Crystal_2.png',
  'master league iii': 'Icon_HV_League_Master_1.png',
  'master league ii': 'Icon_HV_League_Master_1.png',
  'master league i': 'Icon_HV_League_Master_2.png',
  'champion league iii': 'Icon_HV_League_Champion.png',
  'champion league ii': 'Icon_HV_League_Champion.png',
  'champion league i': 'Icon_HV_League_Champion.png',
  'titan league iii': 'Icon_HV_League_Titan_1.png',
  'titan league ii': 'Icon_HV_League_Titan_1.png',
  'titan league i': 'Icon_HV_League_Titan_2.png',
  'legend league': 'Icon_HV_League_Legend_1.png',
};

function roleLabel(role: string): string {
  return ROLE_LABEL[role] ?? role;
}

function leagueIconSrc(m: ClanMember): string | undefined {
  const leagueName = m.league?.name?.trim();
  if (!leagueName || leagueName.toLowerCase() === 'unranked') return undefined;

  const localIcon = LEAGUE_ICON_BY_NAME[leagueName.toLowerCase()];
  return localIcon ? `${import.meta.env.BASE_URL}league-icons/${localIcon}` : m.league?.iconUrls?.small;
}

function leagueIcon(m: ClanMember): string {
  const iconSrc = leagueIconSrc(m);
  const leagueName = m.league?.name ?? 'Sem liga';

  if (!iconSrc) return '';

  return `
    <img class="member-league" src="${iconSrc}" alt="${leagueName}" title="${leagueName}"
         onerror="this.style.display='none'">
  `;
}

function memberCard(m: ClanMember, i: number): string {
  const page = Math.floor(i / MEMBERS_PER_PAGE);

  return `
    <article class="member-card" data-member-page="${page}">
      <div class="member-rank">
        <span>${i + 1}</span>
      </div>
      <div class="member-icons">
        ${leagueIcon(m)}
        <span class="townhall-badge">
          <img src="${CDN}/townhalls/townhall${m.townHallLevel}/icon.webp" alt="CV ${m.townHallLevel}"
               onerror="this.style.display='none'">
          <strong>${m.townHallLevel}</strong>
        </span>
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
}
