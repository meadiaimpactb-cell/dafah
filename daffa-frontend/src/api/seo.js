import api from './axios';

// «الظهور والقياس» في لوحة الأدمن
export const seoApi = {
  pages:        ()             => api.get('/admin/seo/pages'),
  savePage:     (page, data)   => api.put(`/admin/seo/pages/${page}`, data),
  uploadImage:  (page, file)   => { const fd = new FormData(); fd.append('image', file); return api.post(`/admin/seo/pages/${page}/image`, fd, { headers: { 'Content-Type': 'multipart/form-data' } }); },
  saveKeywords: (page, data)   => api.put(`/admin/seo/pages/${page}/keywords`, data),
  content:      (page)         => api.get(`/admin/seo/pages/${page}/content`),
  robots:       ()             => api.get('/admin/seo/robots'),
  saveRobots:   (text)         => api.put('/admin/seo/robots', { text }),
  aiBots:       (block)        => api.put('/admin/seo/ai-bots', { block }),
  sitemap:      ()             => api.get('/admin/seo/sitemap'),
  status:       ()             => api.get('/admin/seo/status'),
  saveLog:      (data)         => api.put('/admin/seo/log', data),
  indexNow:     ()             => api.post('/admin/seo/indexnow'),
  tracking:     ()             => api.get('/admin/seo/tracking'),
  saveTracking: (values)       => api.put('/admin/seo/tracking', { values }),
};
