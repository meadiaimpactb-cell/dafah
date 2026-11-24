import api from './axios';

// تغيير المستشار — العميل
export const consultantChangesApi = {
  list:   ()     => api.get('/consultant-changes'),
  create: (data) => api.post('/consultant-changes', data),
  cancel: (id)   => api.post(`/consultant-changes/${id}/cancel`),
};

// تغيير المستشار — المشرف
export const adminConsultantChangesApi = {
  list:         (status)     => api.get('/admin/consultant-changes', { params: { status } }),
  pendingCount: ()           => api.get('/admin/consultant-changes/pending-count'),
  plan:         (system, id) => api.get(`/admin/consultant-changes/plan/${system}/${id}`),
  approve:      (id, data)   => api.post(`/admin/consultant-changes/${id}/approve`, data),
  reject:       (id, data)   => api.post(`/admin/consultant-changes/${id}/reject`, data),
  direct:       (data)       => api.post('/admin/consultant-changes/direct', data),
  candidates:   ()           => api.get('/admin/outputs/consultants'),
};
