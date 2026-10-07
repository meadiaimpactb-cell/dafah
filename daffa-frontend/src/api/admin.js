import api from './axios';

export const adminApi = {
  // Consultants
  getConsultants:         ()           => api.get('/admin/consultants'),
  getConsultant:          (id)         => api.get(`/admin/consultants/${id}`),
  createConsultant:       (data)       => api.post('/admin/consultants', data),
  updateConsultant:       (id, data)   => api.put(`/admin/consultants/${id}`, data),
  deleteConsultant:       (id)         => api.delete(`/admin/consultants/${id}`),
  toggleConsultant:       (id)         => api.post(`/admin/consultants/${id}/toggle`),
  uploadConsultantAvatar: (id, file)   => {
    const fd = new FormData();
    fd.append('avatar', file);
    return api.post(`/admin/consultants/${id}/avatar`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
  },

  // Users
  updateUserPermissions: (id, permissions) => api.put(`/admin/users/${id}/permissions`, { permissions }),
  uploadUserAvatar: (id, file) => {
    const fd = new FormData();
    fd.append('avatar', file);
    return api.post(`/admin/users/${id}/avatar`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
  },

  // Content Management
  getStrategicContent:    ()        => api.get('/admin/content/strategic'),
  updateStrategicContent: (id, d)   => api.put(`/admin/content/strategic/${id}`, d),
  getOperationalContent:  ()        => api.get('/admin/content/operational'),
  updateOperationalContent:(id, d)  => api.put(`/admin/content/operational/${id}`, d),
  getPoliciesContent:     ()        => api.get('/admin/content/policies'),
  updatePolicyContent:    (tid, d)  => api.put(`/admin/content/policies/${tid}`, d),

  // Services & Pricing
  getSettings:         ()           => api.get('/admin/services/settings'),
  updateSetting:       (key, data)  => api.put(`/admin/services/settings/${key}`, data),
  getDiscounts:        ()           => api.get('/admin/services/discounts'),
  createDiscount:      (data)       => api.post('/admin/services/discounts', data),
  updateDiscount:      (id, data)   => api.put(`/admin/services/discounts/${id}`, data),
  toggleDiscount:      (id)         => api.post(`/admin/services/discounts/${id}/toggle`),
  deleteDiscount:      (id)         => api.delete(`/admin/services/discounts/${id}`),

  // Policy Designs (Admin manages instead of consultant)
  getPolicyDesigns: () => api.get('/admin/policies/designs'),
  uploadPolicyDesign: (id, file) => {
    const fd = new FormData();
    fd.append('design_file', file);
    return api.post(`/admin/policies/designs/${id}/upload`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
  },

  // Organizations
  getOrganizations:  (params)     => api.get('/admin/organizations', { params }),
  getOrganization:   (id)         => api.get(`/admin/organizations/${id}`),
  createOrg:         (data)       => api.post('/admin/organizations', data),
  updateOrg:         (id, data)   => api.put(`/admin/organizations/${id}`, data),
  deleteOrg:         (id)         => api.delete(`/admin/organizations/${id}`),
  toggleOrg:         (id)         => api.post(`/admin/organizations/${id}/toggle`),
  uploadOrgLogo:     (id, file)   => {
    const fd = new FormData();
    fd.append('logo', file);
    return api.post(`/admin/organizations/${id}/logo`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
};
