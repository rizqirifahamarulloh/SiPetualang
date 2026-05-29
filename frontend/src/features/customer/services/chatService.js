import api from '@/services/api';

export const chatService = {
  async getConversations() {
    const response = await api.get('/customer/chat/conversations');
    return response.data;
  },

  async getAvailableCustomers() {
    const response = await api.get('/customer/chat/customers');
    return response.data;
  },

  async getOrCreateConversation(userId) {
    const response = await api.post(`/customer/chat/conversation/${userId}`);
    return response.data;
  },

  async getMessages(conversationId) {
    const response = await api.get(`/customer/chat/messages/${conversationId}`);
    return response.data;
  },

  async sendMessage(conversationId, message) {
    const response = await api.post('/customer/chat/message', {
      id_conversation: conversationId,
      message: message,
    });
    return response.data;
  },
}