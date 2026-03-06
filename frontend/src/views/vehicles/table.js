function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function getPaginationState(currentPage, pageSize, totalRows) {
  const totalPages = Math.max(1, Math.ceil(totalRows / pageSize));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);
  const start = (safePage - 1) * pageSize;
  const end = start + pageSize;

  return { currentPage: safePage, totalPages, start, end };
}

export function renderVehicleTable({
  rows,
  currentPage,
  pageSize,
  tableBody,
  resultSummary,
  paginationInfo,
  pagePrevBtn,
  pageNextBtn,
}) {
  const availableCount = rows.filter((row) => (row.estado_operacion || 'Disponible') === 'Disponible')
    .length;
  resultSummary.textContent = `${rows.length} resultados | ${availableCount} disponibles`;

  const pagination = getPaginationState(currentPage, pageSize, rows.length);
  const { totalPages, start, end } = pagination;
  const paginatedRows = rows.slice(start, end);
  const from = rows.length ? start + 1 : 0;
  const to = rows.length ? Math.min(end, rows.length) : 0;
  paginationInfo.textContent = `Mostrando ${from}-${to} de ${rows.length} | Pagina ${pagination.currentPage} de ${totalPages}`;
  pagePrevBtn.disabled = pagination.currentPage <= 1;
  pageNextBtn.disabled = pagination.currentPage >= totalPages;

  if (!rows.length) {
    tableBody.innerHTML = '<tr><td colspan="7" class="empty-cell">No hay vehiculos para este filtro.</td></tr>';
    return pagination;
  }

  tableBody.innerHTML = paginatedRows
    .map(
      (auto) => `
        <tr>
          <td><strong>${escapeHtml(auto.placa)}</strong></td>
          <td>${escapeHtml(auto.marca)}</td>
          <td>${escapeHtml(auto.color)}</td>
          <td>${escapeHtml(auto.estado_vehiculo)}</td>
          <td>${Number(auto.kilometraje).toLocaleString('es-CO')}</td>
          <td>
            <span class="status-chip ${(auto.estado_operacion || 'Disponible') === 'Vendido' ? 'sold' : 'available'}">
              ${escapeHtml(auto.estado_operacion || 'Disponible')}
            </span>
          </td>
          <td class="inline-actions">
            <button type="button" class="small-button ghost-button" data-edit="${escapeHtml(auto.placa)}">Editar</button>
            <button type="button" class="small-button danger-button" data-delete="${escapeHtml(auto.placa)}">Eliminar</button>
          </td>
        </tr>
      `
    )
    .join('');

  return pagination;
}
