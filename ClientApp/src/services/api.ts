import axios from 'axios';

const API_BASE_URL = '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Attach Authorization header if token exists
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 Unauthorized errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const adminService = {
  getDashboardData: async () => {
    const response = await api.get('/admin/dashboard');
    return response.data;
  },
  getCustomers: async () => {
    const response = await api.get('/admin/customers');
    return response.data;
  },
  deleteCustomer: async (id: string) => {
    const response = await api.delete(`/admin/customers/${id}`);
    return response.data;
  },
  addCustomer: async (customerData: any) => {
    const response = await api.post('/admin/customers', customerData);
    return response.data;
  },
  updateCustomer: async (id: string, customerData: any) => {
    const response = await api.put(`/admin/customers/${id}`, customerData);
    return response.data;
  },
  getCustomerDetails: async (id: string) => {
    const response = await api.get(`/admin/customers/${id}`);
    return response.data;
  },
  toggleSubscription: async (id: string, status: string) => {
    const response = await api.post(`/admin/customers/${id}/toggle-subscription?status=${status}`);
    return response.data;
  },
  renewSubscription: async (id: string, days: number, fee: number) => {
    const response = await api.post(`/admin/customers/${id}/renew`, { days, fee });
    return response.data;
  },
};

export const knowledgeService = {
  getKnowledge: async (customerId: string) => {
    const response = await api.get(`/knowledge/${customerId}`);
    return response.data;
  },
  createKnowledge: async (data: any, file?: File) => {
    const formData = new FormData();
    formData.append('customerId', data.customerId);
    formData.append('topic', data.topic);
    if (data.content) formData.append('content', data.content);
    if (file) formData.append('file', file);
    const response = await api.post('/knowledge', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
  updateKnowledge: async (id: number, data: any, file?: File) => {
    const formData = new FormData();
    formData.append('topic', data.topic);
    if (data.content) formData.append('content', data.content);
    if (file) formData.append('file', file);
    const response = await api.put(`/knowledge/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
  deleteKnowledge: async (id: number) => {
    const response = await api.delete(`/knowledge/${id}`);
    return response.data;
  },
};

export const leadsService = {
  getAllLeads: async () => {
    const response = await api.get('/leads/all');
    return response.data;
  },
  getLeads: async (customerId: string) => {
    const response = await api.get(`/leads/${customerId}`);
    return response.data;
  },
  getLead: async (id: number) => {
    const response = await api.get(`/leads/detail/${id}`);
    return response.data;
  },
  createLead: async (data: any) => {
    const response = await api.post('/leads', data);
    return response.data;
  },
  updateLead: async (id: number, data: any) => {
    const response = await api.put(`/leads/${id}`, data);
    return response.data;
  },
  deleteLead: async (id: number) => {
    const response = await api.delete(`/leads/${id}`);
    return response.data;
  },
  logActivity: async (leadId: number, data: { type: string; note: string; newFollowUpDate?: string }) => {
    const response = await api.post(`/leads/${leadId}/activity`, data);
    return response.data;
  },
  getActivities: async (leadId: number) => {
    const response = await api.get(`/leads/${leadId}/activities`);
    return response.data;
  },
  recordPayment: async (leadId: number, data: { amount: number; date: string; note?: string }) => {
    const response = await api.post(`/leads/${leadId}/payment`, data);
    return response.data;
  },
  deletePayment: async (paymentId: number) => {
    const response = await api.delete(`/leads/payment/${paymentId}`);
    return response.data;
  },
};

export const authService = {
  login: async (credentials: any) => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },
  logout: async () => {
    localStorage.removeItem('token');
    const response = await api.post('/auth/logout');
    return response.data;
  },
  getCurrentUser: async () => {
    const response = await api.get('/auth/user');
    return response.data;
  },
  updateProfile: async (profileData: any) => {
    const response = await api.put('/auth/profile', profileData);
    return response.data;
  },
  uploadProfileImage: async (formData: FormData) => {
    const response = await api.post('/auth/profile/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
};

export const clientService = {
  getDashboard: async () => {
    const response = await api.get('/client/dashboard');
    return response.data;
  },
  toggleAgent: async (isActive: boolean) => {
    const response = await api.post(`/client/toggle-agent?isActive=${isActive}`);
    return response.data;
  },
  getSettings: async () => {
    const response = await api.get('/client/settings');
    return response.data;
  },
  updateSettings: async (settings: any) => {
    const response = await api.put('/client/settings', settings);
    return response.data;
  },
};

export const evolutionService = {
  getQR: async (instanceName: string) => {
    const response = await api.get(`/evolution/qr/${instanceName}`);
    return response.data;
  },
  getPairingCode: async (instanceName: string, number: string) => {
    const response = await api.get(`/evolution/pairing/${instanceName}?number=${number}`);
    return response.data;
  },
  getStatus: async (instanceName: string) => {
    const response = await api.get(`/evolution/status/${instanceName}`);
    return response.data;
  },
  logout: async (instanceName: string) => {
    const response = await api.post(`/evolution/logout/${instanceName}`);
    return response.data;
  },
};

export const teamService = {
  getMembers: async () => {
    const response = await api.get('/team');
    return response.data;
  },
  getCommissions: async () => {
    const response = await api.get('/team/commissions');
    return response.data;
  },
  getMember: async (id: number) => {
    const response = await api.get(`/team/${id}`);
    return response.data;
  },
  createMember: async (data: any) => {
    const response = await api.post('/team', data);
    return response.data;
  },
  updateMember: async (id: number, data: any) => {
    const response = await api.put(`/team/${id}`, data);
    return response.data;
  },
  toggleMember: async (id: number) => {
    const response = await api.patch(`/team/${id}/toggle`);
    return response.data;
  },
  deleteMember: async (id: number) => {
    const response = await api.delete(`/team/${id}`);
    return response.data;
  },
};

export default api;
