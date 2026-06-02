import { httpClient } from './httpClient.js';

export const mediaApi = {
  async uploadMedia({ file, resourceType, ownerId, interviewId, onUploadProgress }) {
    const formData = new FormData();
    const uploadFile = resourceType === 'VIDEO' && !file.type?.startsWith('video/')
      ? new File([file], file.name || 'interview-video.webm', { type: 'video/webm' })
      : file;
    formData.append('file', uploadFile, uploadFile.name || (resourceType === 'VIDEO' ? 'interview-video.webm' : 'upload.bin'));
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
