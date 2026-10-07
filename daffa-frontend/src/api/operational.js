import api from './axios';

const p = (wid) => wid ? { params: { workflow_id: wid } } : {};
const b = (wid, data) => wid ? { ...data, workflow_id: wid } : data;

export const operationalApi = {
  listWorkflows:           ()               => api.get('/operational/workflows'),
  getPageData:             (wid)            => api.get('/operational/page-data',            p(wid)),
  getWorkflow:             (wid)            => api.get('/operational/workflow',              p(wid)),
  getProgress:             (wid)            => api.get('/operational/workflow/progress',     p(wid)),
  start:                   (data)           => api.post('/operational/workflow/start',       data || {}),
  getConsultants:          ()               => api.get('/operational/consultants'),
  selectConsultant:        (wid, data)      => api.post('/operational/workflow/consultant',  b(wid, data)),
  pay:                     (wid, data)      => api.post('/operational/workflow/pay',         b(wid, data)),
  getUnits:                (wid)            => api.get('/operational/units',                 p(wid)),
  getUnit:                 (wid, num)       => api.get(`/operational/units/${num}`,          p(wid)),
  saveUnit:                (wid, num, data) => api.post(`/operational/units/${num}/save`,    b(wid, data)),
  submitUnit:              (wid, num, data) => api.post(`/operational/units/${num}/submit`,  b(wid, data)),
  getStrategicInitiatives: (wid)            => api.get('/operational/strategic-initiatives', p(wid)),
  getPdfLink:              (wid)            => api.get('/operational/workflow/pdf-link',     p(wid)),
  requestArbitration:      (wid, data)      => api.post('/operational/workflow/arbitration', b(wid, data)),
};
