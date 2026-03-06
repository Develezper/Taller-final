export const vehiclesViewTemplate = `
  <section class="page-stack">
    <section class="panel panel-no-bg">
      <div class="panel-head">
        <div>
          <h2>Registro de vehiculo</h2>
          <p class="hint">Usa este formulario para crear o actualizar unidades.</p>
        </div>
      </div>
      <form id="vehicle-form" class="form-grid vehicle-form-grid">
        <label>
          Placa
          <input name="placa" required maxlength="10" placeholder="ABC123" />
        </label>
        <label>
          Marca
          <input name="marca" required placeholder="Toyota" />
        </label>
        <label>
          Color
          <input name="color" required placeholder="Negro" />
        </label>
        <label>
          Estado del vehiculo
          <select name="estadoVehiculo" required>
            <option value="Nuevo">Nuevo</option>
            <option value="Usado">Usado</option>
          </select>
        </label>
        <label>
          Kilometraje
          <input name="kilometraje" type="number" min="0" required placeholder="0" />
        </label>
        <div class="actions">
          <button type="submit" id="save-btn">Guardar</button>
          <button type="button" id="cancel-btn" class="ghost-button" hidden>Cancelar</button>
        </div>
      </form>
      <p id="vehicle-message" class="message"></p>
    </section>

    <section class="panel">
      <div class="panel-head">
        <div>
          <h2>Inventario</h2>
          <p id="result-summary" class="hint">Sin datos cargados</p>
        </div>
        <button type="button" id="refresh-btn" class="ghost-button">Actualizar</button>
      </div>

      <div class="toolbar">
        <input id="plate-filter" placeholder="Filtrar por placa exacta" />
        <select id="status-filter">
          <option value="">Todos</option>
          <option value="Disponible">Disponible</option>
          <option value="Vendido">Vendido</option>
        </select>
        <button type="button" id="clear-filters-btn" class="ghost-button">Limpiar filtros</button>
      </div>

      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>Placa</th>
              <th>Marca</th>
              <th>Color</th>
              <th>Condicion</th>
              <th>Km</th>
              <th>Operacion</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody id="vehicles-tbody"></tbody>
        </table>
      </div>
      <div class="inventory-footer">
        <p id="pagination-info" class="hint">Mostrando 0 de 0</p>
        <div class="pagination-controls">
          <label class="page-size-label" for="page-size-select">
            Filas por pagina
            <select id="page-size-select">
              <option value="5">5</option>
              <option value="10" selected>10</option>
              <option value="20">20</option>
              <option value="50">50</option>
            </select>
          </label>
          <button type="button" id="page-prev-btn" class="ghost-button small-button">Anterior</button>
          <button type="button" id="page-next-btn" class="ghost-button small-button">Siguiente</button>
        </div>
      </div>
      <p class="hint">Actualizacion automatica cada 8 segundos.</p>
    </section>
  </section>
`;
