import './styles.css';
import { renderVehiclesView } from './views/vehiclesView';
import { renderImportView } from './views/importView';
import { renderDashboardView } from './views/dashboardView';

const app = document.getElementById('app');

app.innerHTML = `
  <main class="app-shell">
    <header class="topbar">
      <div>
        <p class="eyebrow">Concesionaria</p>
        <h1>AutoMarket Pro</h1>
        <p class="subtitle">Gestion rapida de inventario y carga de datos</p>
      </div>
    </header>

    <nav class="nav-tabs" aria-label="Navegacion principal">
      <a href="#/resumen" data-route="resumen">Resumen</a>
      <a href="#/autos" data-route="autos">Vehiculos</a>
      <a href="#/importar" data-route="importar">Importar CSV</a>
    </nav>

    <section id="view-container" class="view-container"></section>
  </main>
`;

const viewContainer = document.getElementById('view-container');

const views = {
  '#/resumen': renderDashboardView,
  '#/autos': renderVehiclesView,
  '#/importar': renderImportView,
};

let cleanupView = null;

function setActiveLink(hash) {
  const links = document.querySelectorAll('.nav-tabs a');
  links.forEach((link) => {
    const route = `#/${link.dataset.route}`;
    link.classList.toggle('active', route === hash);
  });
}

function renderRoute() {
  const hash = window.location.hash || '#/resumen';
  const renderer = views[hash] || views['#/resumen'];

  if (cleanupView) {
    cleanupView();
  }

  cleanupView = renderer(viewContainer);
  setActiveLink(hash);
}

window.addEventListener('hashchange', renderRoute);

if (!window.location.hash) {
  window.location.hash = '#/resumen';
}

renderRoute();
