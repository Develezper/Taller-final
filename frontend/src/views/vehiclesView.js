import {
  createVehicle,
  deleteVehicle,
  fetchVehicleByPlate,
  fetchVehicles,
  updateVehicle,
} from './vehicles/api';
import { getPaginationState, renderVehicleTable } from './vehicles/table';
import { vehiclesViewTemplate } from './vehicles/template';

const DEFAULT_PAGE_SIZE = 10;
const POLL_INTERVAL_MS = 8000;

function getViewElements(container) {
  return {
    form: container.querySelector('#vehicle-form'),
    cancelBtn: container.querySelector('#cancel-btn'),
    saveBtn: container.querySelector('#save-btn'),
    messageEl: container.querySelector('#vehicle-message'),
    tableBody: container.querySelector('#vehicles-tbody'),
    filterPlate: container.querySelector('#plate-filter'),
    filterStatus: container.querySelector('#status-filter'),
    refreshBtn: container.querySelector('#refresh-btn'),
    clearFiltersBtn: container.querySelector('#clear-filters-btn'),
    resultSummary: container.querySelector('#result-summary'),
    paginationInfo: container.querySelector('#pagination-info'),
    pageSizeSelect: container.querySelector('#page-size-select'),
    pagePrevBtn: container.querySelector('#page-prev-btn'),
    pageNextBtn: container.querySelector('#page-next-btn'),
  };
}

function getVehiclePayload(form) {
  return {
    placa: String(form.placa.value).trim().toUpperCase(),
    marca: String(form.marca.value).trim(),
    color: String(form.color.value).trim(),
    estadoVehiculo: String(form.estadoVehiculo.value),
    kilometraje: Number(form.kilometraje.value),
  };
}

export function renderVehiclesView(container) {
  container.innerHTML = vehiclesViewTemplate;
  const ui = getViewElements(container);

  const state = {
    editingPlate: null,
    pollTimer: null,
    allRows: [],
    currentPage: 1,
    pageSize: DEFAULT_PAGE_SIZE,
    loadRequestId: 0,
  };

  function showMessage(text, isError = false) {
    ui.messageEl.textContent = text;
    ui.messageEl.className = isError ? 'message error' : 'message ok';
  }

  function resetForm() {
    state.editingPlate = null;
    ui.form.reset();
    ui.form.estadoVehiculo.value = 'Nuevo';
    ui.form.placa.disabled = false;
    ui.saveBtn.textContent = 'Guardar';
    ui.cancelBtn.hidden = true;
  }

  function fillForm(vehicle) {
    ui.form.placa.value = vehicle.placa;
    ui.form.marca.value = vehicle.marca;
    ui.form.color.value = vehicle.color;
    ui.form.estadoVehiculo.value = vehicle.estado_vehiculo;
    ui.form.kilometraje.value = vehicle.kilometraje;
  }

  function renderRows() {
    const pagination = renderVehicleTable({
      rows: state.allRows,
      currentPage: state.currentPage,
      pageSize: state.pageSize,
      tableBody: ui.tableBody,
      resultSummary: ui.resultSummary,
      paginationInfo: ui.paginationInfo,
      pagePrevBtn: ui.pagePrevBtn,
      pageNextBtn: ui.pageNextBtn,
    });

    state.currentPage = pagination.currentPage;
  }

  async function loadVehicles() {
    const requestId = ++state.loadRequestId;

    try {
      const params = {};
      const plate = ui.filterPlate.value.trim().toUpperCase();
      const status = ui.filterStatus.value;
      if (plate) params.placa = plate;
      if (status) params.estado_operacion = status;

      const rows = await fetchVehicles(params);
      if (requestId !== state.loadRequestId) {
        return;
      }

      state.allRows = rows;
      renderRows();
    } catch (error) {
      if (requestId !== state.loadRequestId) {
        return;
      }
      showMessage(error?.response?.data?.error || 'No fue posible cargar inventario', true);
    }
  }

  ui.form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const payload = getVehiclePayload(ui.form);

    try {
      if (state.editingPlate) {
        await updateVehicle(state.editingPlate, {
          marca: payload.marca,
          color: payload.color,
          estadoVehiculo: payload.estadoVehiculo,
          kilometraje: payload.kilometraje,
        });
        showMessage('Vehiculo actualizado');
      } else {
        await createVehicle(payload);
        showMessage('Vehiculo creado');
        state.currentPage = 1;
      }

      resetForm();
      await loadVehicles();
    } catch (error) {
      showMessage(error?.response?.data?.error || 'No fue posible guardar', true);
    }
  });

  ui.cancelBtn.addEventListener('click', () => {
    resetForm();
    showMessage('Edicion cancelada');
  });

  ui.tableBody.addEventListener('click', async (event) => {
    const editPlate = event.target.dataset.edit;
    const deletePlate = event.target.dataset.delete;

    if (editPlate) {
      try {
        const vehicle = await fetchVehicleByPlate(editPlate);
        state.editingPlate = vehicle.placa;
        fillForm(vehicle);
        ui.form.placa.disabled = true;
        ui.saveBtn.textContent = 'Actualizar';
        ui.cancelBtn.hidden = false;
        showMessage(`Editando ${vehicle.placa}`);
      } catch (error) {
        showMessage(error?.response?.data?.error || 'No fue posible cargar el vehiculo', true);
      }
      return;
    }

    if (!deletePlate) {
      return;
    }

    if (!window.confirm(`Eliminar vehiculo ${deletePlate}?`)) {
      return;
    }

    try {
      await deleteVehicle(deletePlate);
      showMessage('Vehiculo eliminado');
      await loadVehicles();
    } catch (error) {
      showMessage(error?.response?.data?.error || 'No fue posible eliminar', true);
    }
  });

  ui.filterPlate.addEventListener('input', () => {
    state.currentPage = 1;
    loadVehicles();
  });

  ui.filterStatus.addEventListener('change', () => {
    state.currentPage = 1;
    loadVehicles();
  });

  ui.refreshBtn.addEventListener('click', loadVehicles);

  ui.clearFiltersBtn.addEventListener('click', () => {
    ui.filterPlate.value = '';
    ui.filterStatus.value = '';
    state.currentPage = 1;
    loadVehicles();
  });

  ui.pageSizeSelect.addEventListener('change', () => {
    const value = Number(ui.pageSizeSelect.value);
    if (Number.isInteger(value) && value > 0) {
      state.pageSize = value;
      state.currentPage = 1;
      renderRows();
    }
  });

  ui.pagePrevBtn.addEventListener('click', () => {
    if (state.currentPage > 1) {
      state.currentPage -= 1;
      renderRows();
    }
  });

  ui.pageNextBtn.addEventListener('click', () => {
    const { totalPages } = getPaginationState(state.currentPage, state.pageSize, state.allRows.length);
    if (state.currentPage < totalPages) {
      state.currentPage += 1;
      renderRows();
    }
  });

  resetForm();
  loadVehicles();
  state.pollTimer = setInterval(loadVehicles, POLL_INTERVAL_MS);

  return () => {
    if (state.pollTimer) {
      clearInterval(state.pollTimer);
    }
  };
}
