import api from './axios';

export const chatApi = {
  conversations:  ()         => api.get('/chat/conversations'),
  startWith:      ()         => api.post('/chat/conversations/start'),
  messages:       (id)       => api.get(`/chat/conversations/${id}/messages`),
  send:           (id, body) => api.post(`/chat/conversations/${id}/messages`, { body }),
  unread:         ()         => api.get('/chat/unread'),
};
