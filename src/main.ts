import './style.css';
import { CLAN_TAG } from './data';
import { renderClan, renderClanLoading, renderClanError, renderWar, renderWarLoading, renderWarError } from './render';
import { fetchClan, fetchCurrentWar, ClanApiError } from './api';

const app = document.querySelector<HTMLDivElement>('#app')!;

app.innerHTML = `
  <header class="topnav">
    <div class="topnav-inner">
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

function setupTabs(): void {
  const tabBar = document.getElementById('tabBar');
  const panels: Record<string, HTMLElement | null> = {
    overview: document.getElementById('clanRoot'),
    war: document.getElementById('warRoot'),
  };

  tabBar?.addEventListener('click', (event) => {
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-tab]');
    if (!button) return;
    const tab = button.dataset.tab!;

    tabBar.querySelectorAll<HTMLButtonElement>('.tab-btn').forEach((btn) => {
      const active = btn === button;
      btn.classList.toggle('active', active);
      btn.setAttribute('aria-selected', String(active));
    });

    Object.entries(panels).forEach(([key, panel]) => {
      if (panel) panel.hidden = key !== tab;
    });

    if (tab === 'war' && !warLoaded) {
      loadWar();
    }
  });
}

setupTabs();
loadClan();
