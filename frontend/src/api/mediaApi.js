import { httpClient } from './httpClient.js';

export const mediaApi = {
  async uploadMedia({ file, resourceType, ownerId, interviewId, onUploadProgress }) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('resourceType', resourceType);
    formData.append('ownerId', ownerId);
    if (interviewId) formData.append('interviewId', interviewId);

    const { data } = await httpClient.post('/media/upload', formData, { onUploadProgress });
    return data;
  },
  async getMediaStatus(mediaId) {
    const { data } = await httpClient.get(`/media/${encodeURIComponent(mediaId)}/status`);
    return data;
  },
  async getMediaAccess(mediaId) {
    const { data } = await httpClient.get(`/media/${encodeURIComponent(mediaId)}/access`);
    return data;
  },
};
