import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import type { PaginatedResponse, Contact, ContactCreate, ContactUpdate, Account, AccountCreate, AccountUpdate, Opportunity, OpportunityCreate, OpportunityUpdate } from '../types/api';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Handle auth errors
    }
    return Promise.reject(error);
  }
);

export const contactsApi = {
  list: (params?: { page?: number; page_size?: number; search?: string; company?: string }) =>
    api.get<PaginatedResponse<Contact>>('/contacts', { params }),

  get: (id: number) =>
    api.get<Contact>(`/contacts/${id}`),

  create: (data: ContactCreate) =>
    api.post<Contact>('/contacts', data),

  update: (id: number, data: ContactUpdate) =>
    api.patch<Contact>(`/contacts/${id}`, data),

  delete: (id: number) =>
    api.delete(`/contacts/${id}`),
};

export const accountsApi = {
  list: (params?: { page?: number; page_size?: number; search?: string; type?: string; industry?: string }) =>
    api.get<PaginatedResponse<Account>>('/accounts', { params }),

  get: (id: number) =>
    api.get<Account>(`/accounts/${id}`),

  create: (data: AccountCreate) =>
    api.post<Account>('/accounts', data),

  update: (id: number, data: AccountUpdate) =>
    api.patch<Account>(`/accounts/${id}`, data),

  delete: (id: number) =>
    api.delete(`/accounts/${id}`),
};

export const opportunitiesApi = {
  list: (params?: { page?: number; page_size?: number; search?: string; stage?: string; account_id?: number; contact_id?: number }) =>
    api.get<PaginatedResponse<Opportunity>>('/opportunities', { params }),

  get: (id: number) =>
    api.get<Opportunity>(`/opportunities/${id}`),

  create: (data: OpportunityCreate) =>
    api.post<Opportunity>('/opportunities', data),

  update: (id: number, data: OpportunityUpdate) =>
    api.patch<Opportunity>(`/opportunities/${id}`, data),

  delete: (id: number) =>
    api.delete(`/opportunities/${id}`),
};

export const healthApi = {
  check: () =>
    api.get<{ status: string; app: string; environment: string }>('/health'),

  dbCheck: () =>
    api.get<{ status: string; database: string }>('/health/db'),
};

export default api;