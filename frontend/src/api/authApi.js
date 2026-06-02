import { httpClient } from './httpClient.js';

export const authApi = {
  async login(payload) {
    const { data } = await httpClient.post('/auth/login', payload);
    return data;
  },
  async register(payload) {
    const { data } = await httpClient.post('/auth/register', payload);
    return data;
  },
  async refresh(refreshToken) {
    const { data } = await httpClient.post('/auth/refresh', { refreshToken });
    return data;
  },
  async getCurrentUser() {
    const { data } = await httpClient.get('/me');
    return data.user || data;
  },
  async logout(refreshToken) {
    const { data } = await httpClient.post('/auth/logout', { refreshToken });
    return data;
  },
};
