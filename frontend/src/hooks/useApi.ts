import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { contactsApi, accountsApi, opportunitiesApi } from '../api/client';
import type { ContactCreate, ContactUpdate, AccountCreate, AccountUpdate, OpportunityCreate, OpportunityUpdate } from '../types/api';

export function useContacts(params?: { page?: number; page_size?: number; search?: string; company?: string }) {
  return useQuery({
    queryKey: ['contacts', params],
    queryFn: () => contactsApi.list(params).then(res => res.data),
  });
}

export function useContact(id: number) {
  return useQuery({
    queryKey: ['contacts', id],
    queryFn: () => contactsApi.get(id).then(res => res.data),
    enabled: !!id,
  });
}

export function useCreateContact() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ContactCreate) => contactsApi.create(data).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
    },
  });
}

export function useUpdateContact() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: ContactUpdate }) => contactsApi.update(id, data).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
    },
  });
}

export function useDeleteContact() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => contactsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
    },
  });
}

export function useAccounts(params?: { page?: number; page_size?: number; search?: string; type?: string; industry?: string }) {
  return useQuery({
    queryKey: ['accounts', params],
    queryFn: () => accountsApi.list(params).then(res => res.data),
  });
}

export function useAccount(id: number) {
  return useQuery({
    queryKey: ['accounts', id],
    queryFn: () => accountsApi.get(id).then(res => res.data),
    enabled: !!id,
  });
}

export function useCreateAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: AccountCreate) => accountsApi.create(data).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
  });
}

export function useUpdateAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: AccountUpdate }) => accountsApi.update(id, data).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
  });
}

export function useDeleteAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => accountsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
  });
}

export function useOpportunities(params?: { page?: number; page_size?: number; search?: string; stage?: string; account_id?: number; contact_id?: number }) {
  return useQuery({
    queryKey: ['opportunities', params],
    queryFn: () => opportunitiesApi.list(params).then(res => res.data),
  });
}

export function useOpportunity(id: number) {
  return useQuery({
    queryKey: ['opportunities', id],
    queryFn: () => opportunitiesApi.get(id).then(res => res.data),
    enabled: !!id,
  });
}

export function useCreateOpportunity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: OpportunityCreate) => opportunitiesApi.create(data).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['opportunities'] });
    },
  });
}

export function useUpdateOpportunity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: OpportunityUpdate }) => opportunitiesApi.update(id, data).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['opportunities'] });
    },
  });
}

export function useDeleteOpportunity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => opportunitiesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['opportunities'] });
    },
  });
}