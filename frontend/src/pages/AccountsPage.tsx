import React, { useState } from 'react';
import { useAccounts, useCreateAccount, useUpdateAccount, useDeleteAccount, useContacts } from '../hooks/useApi';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Modal } from '../components/ui/Modal';
import { Table } from '../components/ui/Table';
import { Pagination } from '../components/ui/Pagination';
import { useToast } from '../components/Toast';
import type { Account, AccountCreate } from '../types/api';

const accountTypeOptions = [
  { value: 'customer', label: 'Customer' },
  { value: 'prospect', label: 'Prospect' },
  { value: 'partner', label: 'Partner' },
  { value: 'vendor', label: 'Vendor' },
];

const initialFormState: AccountCreate = {
  name: '',
  type: 'prospect',
  industry: '',
  website: '',
  phone: '',
  address: '',
  annual_revenue: undefined,
  employee_count: undefined,
  description: '',
  primary_contact_id: undefined,
};

export const AccountsPage: React.FC = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
  const [industry, setIndustry] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [formData, setFormData] = useState<AccountCreate>(initialFormState);
  const [errors, setErrors] = useState<Partial<AccountCreate>>({});

  const { data, isLoading, error } = useAccounts({ page, page_size: 20, search: search || undefined, type: type || undefined, industry: industry || undefined });
  const { data: contactsData } = useContacts({ page_size: 100 });
  const createMutation = useCreateAccount();
  const updateMutation = useUpdateAccount();
  const deleteMutation = useDeleteAccount();
  const { addToast } = useToast();

  const columns = [
    { key: 'name', header: 'Name', render: (a: Account) => a.name },
    { key: 'type', header: 'Type', render: (a: Account) => (
      <span className={`badge badge-${a.type === 'customer' ? 'success' : a.type === 'prospect' ? 'primary' : a.type === 'partner' ? 'warning' : 'secondary'}`}>
        {a.type}
      </span>
    )},
    { key: 'industry', header: 'Industry', render: (a: Account) => a.industry || '—' },
    { key: 'website', header: 'Website', render: (a: Account) => a.website ? <a href={a.website} target="_blank" rel="noopener noreferrer">{a.website}</a> : '—' },
    { key: 'phone', header: 'Phone', render: (a: Account) => a.phone || '—' },
    {
      key: 'actions',
      header: 'Actions',
      render: (a: Account) => (
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); handleEdit(a); }}>Edit</Button>
          <Button variant="danger" size="sm" onClick={(e) => { e.stopPropagation(); handleDelete(a); }}>Delete</Button>
        </div>
      ),
    },
  ];

  const validateForm = () => {
    const newErrors: Partial<AccountCreate> = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      if (editingAccount) {
        await updateMutation.mutateAsync({ id: editingAccount.id, data: formData });
        addToast('Account updated successfully', 'success');
      } else {
        await createMutation.mutateAsync(formData);
        addToast('Account created successfully', 'success');
      }
      closeModal();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Operation failed';
      addToast(message, 'error');
    }
  };

  const handleEdit = (account: Account) => {
    setEditingAccount(account);
    setFormData({
      name: account.name,
      type: account.type,
      industry: account.industry || '',
      website: account.website || '',
      phone: account.phone || '',
      address: account.address || '',
      annual_revenue: account.annual_revenue,
      employee_count: account.employee_count,
      description: account.description || '',
      primary_contact_id: account.primary_contact_id,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (account: Account) => {
    if (!window.confirm(`Delete ${account.name}?`)) return;
    try {
      await deleteMutation.mutateAsync(account.id);
      addToast('Account deleted', 'success');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Delete failed';
      addToast(message, 'error');
    }
  };

  const openCreateModal = () => {
    setEditingAccount(null);
    setFormData(initialFormState);
    setErrors({});
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingAccount(null);
    setFormData(initialFormState);
    setErrors({});
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '0.25rem' }}>Accounts</h1>
          <p style={{ color: 'var(--color-text-muted)' }}>Manage your accounts and companies</p>
        </div>
        <Button onClick={openCreateModal}>Add Account</Button>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-body" style={{ padding: '1rem 1.5rem' }}>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <Input
              placeholder="Search by name or industry..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              style={{ minWidth: '250px', flex: 1 }}
            />
            <Select
              placeholder="Filter by type"
              value={type}
              onChange={(e) => { setType(e.target.value); setPage(1); }}
              options={[{ value: '', label: 'All Types' }, ...accountTypeOptions]}
              style={{ minWidth: '180px' }}
            />
            <Input
              placeholder="Filter by industry..."
              value={industry}
              onChange={(e) => { setIndustry(e.target.value); setPage(1); }}
              style={{ minWidth: '200px' }}
            />
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-body" style={{ padding: 0 }}>
          {isLoading ? (
            <div className="empty-state" style={{ padding: '3rem' }}>
              <span className="loading-spinner" style={{ width: '2rem', height: '2rem', borderWidth: '3px' }} />
              <p style={{ marginTop: '1rem' }}>Loading accounts...</p>
            </div>
          ) : error ? (
            <div className="empty-state" style={{ padding: '3rem' }}>
              <span className="empty-state-icon">⚠️</span>
              <p>Failed to load accounts</p>
              <Button variant="outline" onClick={() => window.location.reload()}>Retry</Button>
            </div>
          ) : (
            <>
              <Table
                columns={columns}
                data={data?.items || []}
                keyExtractor={(a) => a.id}
                emptyMessage="No accounts found. Click 'Add Account' to create one."
              />
              {data && data.total_pages > 1 && (
                <div className="card-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                    Showing {((page - 1) * 20) + 1} to {Math.min(page * 20, data.total)} of {data.total} accounts
                  </p>
                  <Pagination currentPage={page} totalPages={data.total_pages} onPageChange={setPage} />
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingAccount ? 'Edit Account' : 'New Account'}
        footer={
          <>
            <Button variant="outline" onClick={closeModal}>Cancel</Button>
            <Button
              onClick={handleSubmit}
              loading={createMutation.isPending || updateMutation.isPending}
            >
              {editingAccount ? 'Save Changes' : 'Create Account'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <Input
              label="Name *"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              error={errors.name}
            />
            <Select
              label="Type"
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as AccountCreate['type'] })}
              options={accountTypeOptions}
            />
            <Input
              label="Industry"
              value={formData.industry}
              onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
            />
            <Input
              label="Website"
              type="url"
              value={formData.website}
              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
            />
            <Input
              label="Phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
            <Input
              label="Annual Revenue"
              type="number"
              value={formData.annual_revenue?.toString() || ''}
              onChange={(e) => setFormData({ ...formData, annual_revenue: e.target.value ? parseInt(e.target.value) : undefined })}
            />
            <Input
              label="Employee Count"
              type="number"
              value={formData.employee_count?.toString() || ''}
              onChange={(e) => setFormData({ ...formData, employee_count: e.target.value ? parseInt(e.target.value) : undefined })}
            />
          </div>
          <Input
            label="Address"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          />
          <Select
            label="Primary Contact"
            value={formData.primary_contact_id?.toString() || ''}
            onChange={(e) => setFormData({ ...formData, primary_contact_id: e.target.value ? parseInt(e.target.value) : undefined })}
            options={[{ value: '', label: 'None' }, ...(contactsData?.items || []).map(c => ({ value: c.id.toString(), label: `${c.first_name} ${c.last_name} (${c.email})` }))]}
          />
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              className="form-input"
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};