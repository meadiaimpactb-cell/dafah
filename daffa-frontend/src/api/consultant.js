import api from './axios';

export const consultantApi = {
  me:               ()         => api.get('/consultant/me'),
  dashboard:        ()         => api.get('/consultant/dashboard'),
  clients:          ()         => api.get('/consultant/clients'),
  pendingReviews:   ()         => api.get('/consultant/reviews/pending'),
  completedReviews: ()         => api.get('/consultant/reviews/completed'),
  getSubmission:    (id)       => api.get(`/consultant/submissions/${id}`),
  approve:          (id, data) => api.post(`/consultant/submissions/${id}/approve`, data),
  requestRevision:  (id, data) => api.post(`/consultant/submissions/${id}/revision`, data),

  // Operational reviews
  opPendingReviews:   ()         => api.get('/consultant/operational/reviews/pending'),
  opCompletedReviews: ()         => api.get('/consultant/operational/reviews/completed'),
  opGetSubmission:    (id)       => api.get(`/consultant/operational/submissions/${id}`),
  opApprove:          (id, data) => api.post(`/consultant/operational/submissions/${id}/approve`, data),
  opRequestRevision:  (id, data) => api.post(`/consultant/operational/submissions/${id}/revision`, data),
};
