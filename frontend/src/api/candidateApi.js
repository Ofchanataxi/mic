import { httpClient } from './httpClient.js';

export const candidateApi = {
  async createProfileFromCv(payload) {
    const { data } = await httpClient.post('/candidates/profile/from-cv', payload);
    return data;
  },
  async getMyProfile() {
    const { data } = await httpClient.get('/me/profile');
    return data;
  },
  async updateMyProfile(payload) {
    const { data } = await httpClient.patch('/me/profile', payload);
    return data;
  },
  async getMyTopics() {
    const { data } = await httpClient.get('/me/topics');
    return data;
  },
};
