import api from './axios';

const p = (wid) => wid ? { params: { workflow_id: wid } } : {};
const b = (wid, data) => wid ? { ...data, workflow_id: wid } : data;

export const strategicApi = {
  listWorkflows:    ()               => api.get('/strategic/workflows'),
  getPageData:      (wid)            => api.get('/strategic/page-data', p(wid)),
  getWorkflow:      (wid)            => api.get('/strategic/workflow',   p(wid)),
  getProgress:      (wid)            => api.get('/strategic/workflow/progress', p(wid)),
  start:            (data)           => api.post('/strategic/workflow/start', data),
  getConsultants:   ()               => api.get('/strategic/consultants'),
  selectConsultant: (wid, data)      => api.post('/strategic/workflow/consultant', b(wid, data)),
  pay:              (wid, data)      => api.post('/strategic/workflow/pay',        b(wid, data)),
  getUnits:         (wid)            => api.get('/strategic/units',               p(wid)),
  getUnit:          (wid, num)       => api.get(`/strategic/units/${num}`,        p(wid)),
  saveUnit:         (wid, num, data) => api.post(`/strategic/units/${num}/save`,   b(wid, data)),
  submitUnit:       (wid, num, data) => api.post(`/strategic/units/${num}/submit`, b(wid, data)),
  getPdfLink:       (wid)            => api.get('/strategic/workflow/pdf-link',   p(wid)),
  downloadPDF:      (wid)            => api.get('/strategic/workflow/pdf', { responseType: 'blob', ...p(wid) }),
};
