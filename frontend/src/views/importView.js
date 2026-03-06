import { api } from '../api/client';

export function renderImportView(container) {
  container.innerHTML = `
    <section class="page-stack">
      <section class="panel hero-panel">
        <p class="eyebrow">Carga de datos</p>
        <h2>Importar archivo CSV</h2>
        <p class="hint">
          Sube un archivo con el inventario. El sistema evita duplicados por placa de forma automatica.
        </p>
      </section>

      <section class="panel">
        <form id="csv-form" class="csv-form">
          <label class="file-input-wrapper" for="csv-file">
            <span>Seleccionar archivo</span>
            <input type="file" id="csv-file" accept=".csv" required />
          </label>
          <button type="submit">Procesar archivo</button>
        </form>
        <p id="selected-file" class="hint">Ningun archivo seleccionado.</p>
        <p id="import-message" class="message"></p>
        <p id="import-summary" class="hint"></p>
      </section>

      <section class="panel">
        <h3>Flujo recomendado</h3>
        <ol class="steps-list">
          <li>Verifica que el archivo termine en <code>.csv</code>.</li>
          <li>Haz clic en <strong>Procesar archivo</strong>.</li>
          <li>Revisa el resumen final para confirmar insertados y duplicados.</li>
        </ol>
      </section>
    </section>
  `;

  const form = container.querySelector('#csv-form');
  const fileInput = container.querySelector('#csv-file');
  const messageEl = container.querySelector('#import-message');
  const summaryEl = container.querySelector('#import-summary');
  const selectedFileEl = container.querySelector('#selected-file');

  function showMessage(text, isError = false) {
    messageEl.textContent = text;
    messageEl.className = isError ? 'message error' : 'message ok';
  }

  fileInput.addEventListener('change', () => {
    const file = fileInput.files[0];
    selectedFileEl.textContent = file
      ? `Archivo seleccionado: ${file.name}`
      : 'Ningun archivo seleccionado.';
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const file = fileInput.files[0];

    if (!file) {
      showMessage('Selecciona un archivo CSV', true);
      return;
    }

    const data = new FormData();
    data.append('file', file);

    try {
      const response = await api.post('/import/csv', data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const result = response.data;
      showMessage('CSV procesado correctamente');
      summaryEl.textContent = `Total: ${result.total} | Insertados: ${result.inserted} | Duplicados: ${result.duplicates} | Errores: ${result.errors.length}`;
      form.reset();
      selectedFileEl.textContent = 'Ningun archivo seleccionado.';
    } catch (error) {
      showMessage(error?.response?.data?.error || 'Error al procesar el archivo', true);
    }
  });

  return () => {};
}
