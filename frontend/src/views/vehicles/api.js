import { api } from '../../api/client';

export async function fetchVehicles(params) {
  const { data } = await api.get('/autos', { params });
  return data;
}

export async function fetchVehicleByPlate(plate) {
  const { data } = await api.get(`/autos/${plate}`);
  return data;
}

export async function createVehicle(payload) {
  await api.post('/autos', payload);
}

export async function updateVehicle(plate, payload) {
  await api.put(`/autos/${plate}`, payload);
}

export async function deleteVehicle(plate) {
  await api.delete(`/autos/${plate}`);
}
