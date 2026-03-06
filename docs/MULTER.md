# Parte 5 - Investigacion de Multer

## 1) Definicion y flujo de un middleware

Un middleware en Express es una funcion que se ejecuta entre la recepcion de la solicitud HTTP y la respuesta final. Recibe `req`, `res` y `next`, y puede:

- leer o modificar la solicitud (`req`)
- validar datos
- cortar el flujo con un error/respuesta
- pasar el control al siguiente middleware con `next()`

Flujo general en este backend:

1. `app.use(express.json())` procesa JSON para rutas normales.
2. `app.use('/api/import', importRoutes)` delega la ruta de importacion.
3. En `POST /api/import/csv`, primero corre `upload.single('file')` (Multer).
4. Si Multer valida, deja el archivo en `req.file` y pasa al handler.
5. El handler convierte `req.file.buffer` a texto, parsea CSV y guarda en BD.
6. Si ocurre un error, se propaga al middleware global de errores.

Flujo especifico de `POST /api/import/csv`:

1. Cliente envia `multipart/form-data` con campo `file`.
2. Multer valida extension (`.csv`) y tamano maximo (5 MB).
3. Multer guarda temporalmente en memoria (`memoryStorage`).
4. El handler parsea filas con `parseCsv`.
5. El servicio `importCsvRows` inserta/actualiza en base de datos.
6. Respuesta `201` con resumen de importacion.

## 2) Protocolo `multipart/form-data`

`multipart/form-data` es un formato HTTP para enviar multiples partes en una sola solicitud, normalmente archivos + campos de texto.

Caracteristicas tecnicas:

- Header `Content-Type`: `multipart/form-data; boundary=...`
- El `boundary` separa cada parte del cuerpo.
- Cada parte incluye headers propios, por ejemplo:
- `Content-Disposition` (nombre del campo, nombre de archivo)
- `Content-Type` (ej. `text/csv`)

Ejemplo simplificado:

```http
POST /api/import/csv HTTP/1.1
Content-Type: multipart/form-data; boundary=----X

------X
Content-Disposition: form-data; name="file"; filename="autos.csv"
Content-Type: text/csv

placa,marca,color
ABC123,Toyota,Rojo
------X--
```

Por que se usa aqui:

- `application/json` no es adecuado para archivos binarios/adjuntos.
- `multipart/form-data` permite subir el CSV como archivo real.
- Multer interpreta ese formato y expone el resultado en `req.file`.

## 3) Multer internamente: `diskStorage` vs `memoryStorage`

Multer ofrece motores de almacenamiento para decidir donde queda el archivo mientras se procesa.

`memoryStorage` (el que usa este proyecto):

- Guarda el archivo en RAM como `Buffer` (`req.file.buffer`).
- No escribe en disco.
- Es rapido para archivos pequenos y procesamiento inmediato.
- Riesgo: mayor consumo de memoria si suben archivos grandes o muchas cargas concurrentes.
- Recomendado usar `limits.fileSize` (ya implementado: 5 MB).

`diskStorage`:

- Escribe el archivo en una carpeta del servidor (`req.file.path`).
- Permite manejar archivos grandes sin saturar RAM.
- Requiere limpieza de archivos temporales.
- Implica costo de I/O en disco y gestion de permisos/rutas.

Comparacion rapida:

- `memoryStorage`: mejor para parsear al instante y no conservar archivo.
- `diskStorage`: mejor para persistir temporalmente o procesar archivos pesados.

Decision tecnica en este backend:

- Se eligio `memoryStorage` porque el CSV se parsea inmediatamente y no se necesita conservarlo.
- Se acompana con validacion de extension y limite de tamano para controlar riesgos.
