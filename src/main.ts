import './style.css';
import { CLAN_TAG } from './data';
import {
  renderClan,
  renderClanLoading,
  renderClanError,
  renderWar,
  renderWarLoading,
  renderWarError,
  renderPlayer,
  renderPlayerLoading,
  renderPlayerError,
} from './render';
import { fetchClan, fetchCurrentWar, fetchPlayer, ClanApiError } from './api';

const app = document.querySelector<HTMLDivElement>('#app')!;

app.innerHTML = `
  <header class="topnav">
    <div class="topnav-inner">
      <img class="topnav-logo" src="${import.meta.env.BASE_URL}coc-logo.png" alt="Clash of Clans">
      <div class="brand">S.M.U.C</div>
      <span class="brand-sub">Só Mais Um Clã</span>
    </div>
  </header>

  <section class="banner">
    <div class="banner-overlay">
      <span class="banner-badge-fallback" id="bannerBadgeFallback">🛡️</span>
      <img class="banner-badge" id="bannerBadge" alt="S.M.U.C" style="display:none">
      <h1 class="banner-title">S.M.U.C</h1>
    </div>
  </section>

  <main class="section-inner page">
    <nav class="tab-bar" id="tabBar" role="tablist">
      <button class="tab-btn active" type="button" data-tab="overview" role="tab" aria-selected="true">🏠 Visão geral</button>
      <button class="tab-btn" type="button" data-tab="war" role="tab" aria-selected="false">⚔️ Guerra atual</button>
    </nav>
    <div id="clanRoot" class="tab-panel"></div>
    <div id="warRoot" class="tab-panel" hidden></div>
    <div id="playerRoot" class="tab-panel" hidden></div>
  </main>

  <footer class="site-footer">
    <div class="section-inner">
      Dados via Clash of Clans API oficial · brasão e ícones via
      <code>api-assets.clashofclans.com</code> / <code>assets.clashk.ing</code> ·
      S.M.U.C não é afiliado à Supercell ·
      <a href="https://supercell.com/en/fan-content-policy/" target="_blank" rel="noopener noreferrer">Fan Content Policy</a>
    </div>
  </footer>
`;

async function loadClan(): Promise<void> {
  renderClanLoading();
  try {
    const clan = await fetchClan(CLAN_TAG);
    renderClan(clan);
  } catch (err) {
    const message =
      err instanceof ClanApiError ? err.message : 'Não foi possível carregar o clã.';
    renderClanError(message);
    document.getElementById('retryBtn')?.addEventListener('click', loadClan);
  }
}

let warLoaded = false;

async function loadWar(): Promise<void> {
  renderWarLoading();
  try {
    const war = await fetchCurrentWar(CLAN_TAG);
    renderWar(war);
    warLoaded = true;
  } catch (err) {
    const message =
      err instanceof ClanApiError ? err.message : 'Não foi possível carregar a guerra.';
    renderWarError(message);
    document.getElementById('warRetryBtn')?.addEventListener('click', loadWar);
  }
}

type Tab = 'overview' | 'war';

let lastTab: Tab = 'overview';
const PLAYER_HASH_PREFIX = '#/player/';

function showTab(tab: Tab): void {
  const tabBar = document.getElementById('tabBar');
  const panels: Record<Tab, HTMLElement | null> = {
    overview: document.getElementById('clanRoot'),
    war: document.getElementById('warRoot'),
  };
  const playerRoot = document.getElementById('playerRoot');

  if (tabBar) tabBar.hidden = false;
  if (playerRoot) playerRoot.hidden = true;

  tabBar?.querySelectorAll<HTMLButtonElement>('.tab-btn').forEach((btn) => {
    const active = btn.dataset.tab === tab;
    btn.classList.toggle('active', active);
    btn.setAttribute('aria-selected', String(active));
  });

  (Object.entries(panels) as [Tab, HTMLElement | null][]).forEach(([key, panel]) => {
    if (panel) panel.hidden = key !== tab;
  });

  if (tab === 'war' && !warLoaded) {
    loadWar();
  }
}

function goToTab(tab: Tab): void {
  lastTab = tab;
  if (window.location.hash) {
    window.location.hash = ''; // dispara hashchange -> handleRoute -> showTab(lastTab)
  } else {
    showTab(tab);
  }
}

async function showPlayer(tag: string): Promise<void> {
  const tabBar = document.getElementById('tabBar');
  const clanRoot = document.getElementById('clanRoot');
  const warRoot = document.getElementById('warRoot');
  const playerRoot = document.getElementById('playerRoot');

  if (tabBar) tabBar.hidden = true;
  if (clanRoot) clanRoot.hidden = true;
  if (warRoot) warRoot.hidden = true;
  if (playerRoot) playerRoot.hidden = false;

  renderPlayerLoading();
  try {
    const player = await fetchPlayer(tag);
    renderPlayer(player);
  } catch (err) {
    const message =
      err instanceof ClanApiError ? err.message : 'Não foi possível carregar o jogador.';
    renderPlayerError(message);
    document.getElementById('playerRetryBtn')?.addEventListener('click', () => showPlayer(tag));
  }
}

function handleRoute(): void {
  const hash = window.location.hash;
  if (hash.startsWith(PLAYER_HASH_PREFIX)) {
    showPlayer(decodeURIComponent(hash.slice(PLAYER_HASH_PREFIX.length)));
  } else {
    showTab(lastTab);
  }
}

function setupTabs(): void {
  const tabBar = document.getElementById('tabBar');
  tabBar?.addEventListener('click', (event) => {
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-tab]');
    if (!button) return;
    goToTab(button.dataset.tab as Tab);
  });
}

setupTabs();
window.addEventListener('hashchange', handleRoute);
handleRoute();
loadClan();
