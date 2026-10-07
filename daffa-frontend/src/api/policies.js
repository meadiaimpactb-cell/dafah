import api from './axios';

const p = (wid, params = {}) => wid ? { ...params, workflow_id: wid } : params;
const b = (wid, data   = {}) => wid ? { ...data,   workflow_id: wid } : data;

export const policiesApi = {
  workflows:       ()                       => api.get('/policies/workflows'),
  getPageData:     (wid)                    => api.get('/policies/page-data', { params: p(wid) }),
  getPolicyTypes:  ()                       => api.get('/policies/policy-types'),
  start:           (forceNew = false)       => api.post('/policies/workflow/start', forceNew ? { force_new: true } : {}),
  selectPolicies:  (wid, data)             => api.post('/policies/workflow/select-policies', b(wid, data)),
  pay:             (wid, data)             => api.post('/policies/workflow/pay', b(wid, data)),
  requestDesign:   (wid, data)             => api.post('/policies/workflow/design', b(wid, data)),
  requestDesignWithBrief: (wid, brief, logoFile, paymentMethod) => {
    const fd = new FormData();
    fd.append('workflow_id',    wid);
    fd.append('want_design',    '1');
    fd.append('payment_method', paymentMethod);
    fd.append('design_brief',   JSON.stringify(brief));
    if (logoFile) fd.append('design_logo', logoFile);
    return api.post('/policies/workflow/design', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  getSelections:   (wid)                   => api.get('/policies/selections', { params: p(wid) }),
  getSelection:    (wid, id)               => api.get(`/policies/selections/${id}`, { params: p(wid) }),
  saveSelection:   (wid, id, data)         => api.post(`/policies/selections/${id}/save`, b(wid, data)),
  submitSelection: (wid, id, data)         => api.post(`/policies/selections/${id}/submit`, b(wid, data)),
  getPdfLink:      (wid, selId)            => api.get(`/policies/workflow/pdf-link/${selId}`, { params: p(wid) }),
  downloadPdf:     (wid, selId)            => api.get(`/policies/workflow/pdf/${selId}`, { params: p(wid), responseType: 'blob' }),
};

export const policiesDesignApi = {
  approve:         (wid)        => api.post('/policies/design/approve', b(wid)),
  requestRevision: (wid, notes) => api.post('/policies/design/revision', b(wid, { notes })),
};

export const consultantPoliciesApi = {
  getPendingReviews:  ()           => api.get('/consultant/policies/reviews/pending'),
  getCompletedReviews:()           => api.get('/consultant/policies/reviews/completed'),
  getSelection:       (id)         => api.get(`/consultant/policies/selections/${id}`),
  approve:            (id, data)   => api.post(`/consultant/policies/selections/${id}/approve`, data),
  requestRevision:    (id, data)   => api.post(`/consultant/policies/selections/${id}/revision`, data),
  getDesignRequests:  ()           => api.get('/consultant/policies/designs'),
  uploadDesign:       (id, file)   => {
    const fd = new FormData();
    fd.append('design_file', file);
    return api.post(`/consultant/policies/designs/${id}/upload`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
};
