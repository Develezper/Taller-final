import { api } from '../api/client';

const numberFormatter = new Intl.NumberFormat('es-CO');

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function getTopBrands(rows, size = 5) {
  const counters = rows.reduce((acc, row) => {
    const brand = String(row.marca || 'Sin marca').trim() || 'Sin marca';
    acc.set(brand, (acc.get(brand) || 0) + 1);
    return acc;
  }, new Map());

  return [...counters.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, size);
}

function setMessage(element, text, isError = false) {
  element.textContent = text;
  element.className = isError ? 'message error' : 'message ok';
}

export function renderDashboardView(container) {
  container.innerHTML = `
    <section class="page-stack">
      <section class="panel hero-panel">
        <p class="eyebrow">Resumen operativo</p>
        <h2>Panorama del inventario</h2>
        <p class="hint">Metricas calculadas en tiempo real usando <code>/api/autos</code>.</p>
      </section>

      <section class="stats-grid">
        <article class="stat-card stat-total">
          <p class="stat-label">Total de vehiculos</p>
          <p id="stat-total" class="stat-value">0</p>
        </article>
        <article class="stat-card stat-available">
          <p class="stat-label">Disponibles</p>
          <p id="stat-available" class="stat-value">0</p>
        </article>
        <article class="stat-card stat-sold">
          <p class="stat-label">Vendidos</p>
          <p id="stat-sold" class="stat-value">0</p>
        </article>
        <article class="stat-card stat-average">
          <p class="stat-label">Km promedio</p>
          <p id="stat-average" class="stat-value">0</p>
        </article>
      </section>

      <section class="panel">
        <div class="panel-head">
          <h3>Marcas con mas unidades</h3>
          <button type="button" id="dashboard-refresh" class="ghost-button">Actualizar</button>
        </div>
        <ol id="top-brands" class="brand-list"></ol>
        <p id="dashboard-message" class="message"></p>
      </section>
    </section>
  `;

  const totalEl = container.querySelector('#stat-total');
  const availableEl = container.querySelector('#stat-available');
  const soldEl = container.querySelector('#stat-sold');
  const averageEl = container.querySelector('#stat-average');
  const topBrandsEl = container.querySelector('#top-brands');
  const refreshBtn = container.querySelector('#dashboard-refresh');
  const messageEl = container.querySelector('#dashboard-message');

  let pollTimer = null;
  let loadRequestId = 0;

  function renderBrandList(entries) {
    if (!entries.length) {
      topBrandsEl.innerHTML = `<li class="hint">Aun no hay datos para mostrar.</li>`;
      return;
    }

    topBrandsEl.innerHTML = entries
      .map(
        ([brand, count]) => `
          <li>
            <span>${escapeHtml(brand)}</span>
            <strong>${numberFormatter.format(count)}</strong>
          </li>
        `
      )
      .join('');
  }

  async function loadSummary() {
    const requestId = ++loadRequestId;

    try {
      const { data } = await api.get('/autos');
      if (requestId !== loadRequestId) {
        return;
      }
      const total = data.length;
      const sold = data.filter((row) => row.estado_operacion === 'Vendido').length;
      const available = total - sold;
      const averageMileage = total
        ? Math.round(data.reduce((acc, row) => acc + Number(row.kilometraje || 0), 0) / total)
        : 0;

      totalEl.textContent = numberFormatter.format(total);
      availableEl.textContent = numberFormatter.format(available);
      soldEl.textContent = numberFormatter.format(sold);
      averageEl.textContent = numberFormatter.format(averageMileage);
      renderBrandList(getTopBrands(data));
      setMessage(messageEl, `Actualizado ${new Date().toLocaleTimeString('es-CO')}`);
    } catch (error) {
      if (requestId !== loadRequestId) {
        return;
      }
      setMessage(
        messageEl,
        error?.response?.data?.error || 'No fue posible cargar el resumen',
        true
      );
    }
  }

  refreshBtn.addEventListener('click', loadSummary);

  loadSummary();
  pollTimer = setInterval(loadSummary, 15000);

  return () => {
    if (pollTimer) {
      clearInterval(pollTimer);
    }
  };
}
