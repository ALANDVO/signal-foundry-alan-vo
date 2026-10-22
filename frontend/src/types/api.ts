export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface Contact {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  company?: string;
  title?: string;
  address?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface ContactCreate {
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  company?: string;
  title?: string;
  address?: string;
  notes?: string;
}

export interface ContactUpdate {
  email?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  company?: string;
  title?: string;
  address?: string;
  notes?: string;
}

export type AccountType = 'customer' | 'prospect' | 'partner' | 'vendor';

export interface Account {
  id: number;
  name: string;
  type: AccountType;
  industry?: string;
  website?: string;
  phone?: string;
  address?: string;
  annual_revenue?: number;
  employee_count?: number;
  description?: string;
  primary_contact_id?: number;
  created_at: string;
  updated_at: string;
}

export interface AccountCreate {
  name: string;
  type?: AccountType;
  industry?: string;
  website?: string;
  phone?: string;
  address?: string;
  annual_revenue?: number;
  employee_count?: number;
  description?: string;
  primary_contact_id?: number;
}

export interface AccountUpdate {
  name?: string;
  type?: AccountType;
  industry?: string;
  website?: string;
  phone?: string;
  address?: string;
  annual_revenue?: number;
  employee_count?: number;
  description?: string;
  primary_contact_id?: number;
}

export type OpportunityStage = 'prospecting' | 'qualification' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost';

export interface Opportunity {
  id: number;
  name: string;
  stage: OpportunityStage;
  amount?: number;
  probability: number;
  expected_close_date?: string;
  actual_close_date?: string;
  description?: string;
  next_step?: string;
  account_id: number;
  contact_id: number;
  created_at: string;
  updated_at: string;
}

export interface OpportunityCreate {
  name: string;
  stage?: OpportunityStage;
  amount?: number;
  probability?: number;
  expected_close_date?: string;
  actual_close_date?: string;
  description?: string;
  next_step?: string;
  account_id: number;
  contact_id: number;
}

export interface OpportunityUpdate {
  name?: string;
  stage?: OpportunityStage;
  amount?: number;
  probability?: number;
  expected_close_date?: string;
  actual_close_date?: string;
  description?: string;
  next_step?: string;
  account_id?: number;
  contact_id?: number;
}

export interface AuditLog {
  id: number;
  entity_type: string;
  entity_id: number;
  action: 'create' | 'update' | 'delete' | 'view';
  user_id?: number;
  user_email?: string;
  changes?: string;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

export interface HealthResponse {
  status: string;
  app: string;
  environment: string;
}