import './style.css';
import { CLAN_TAG } from './data';
import { renderClan, renderClanLoading, renderClanError } from './render';
import { fetchClan, ClanApiError } from './api';

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
    <div id="clanRoot"></div>
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

loadClan();
