import api from './axios';

export const notificationsApi = {
  // Client / all users
  getAll:      ()    => api.get('/notifications'),
  unreadCount: ()    => api.get('/notifications/unread-count'),
  markRead:    (id)  => api.post(`/notifications/${id}/read`),
  markAllRead: ()    => api.post('/notifications/read-all'),

  // Admin only
  adminSend:   (data) => api.post('/admin/notifications/send', data),
  adminLog:    ()     => api.get('/admin/notifications/log'),
  adminUsers:  ()     => api.get('/admin/notifications/users'),
};
