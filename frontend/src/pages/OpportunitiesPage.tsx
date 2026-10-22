import React, { useState } from 'react';
import { useOpportunities, useCreateOpportunity, useUpdateOpportunity, useDeleteOpportunity, useAccounts, useContacts } from '../hooks/useApi';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Modal } from '../components/ui/Modal';
import { Table } from '../components/ui/Table';
import { Pagination } from '../components/ui/Pagination';
import { useToast } from '../components/Toast';
import type { Opportunity, OpportunityCreate } from '../types/api';

const stageOptions = [
  { value: 'prospecting', label: 'Prospecting' },
  { value: 'qualification', label: 'Qualification' },
  { value: 'proposal', label: 'Proposal' },
  { value: 'negotiation', label: 'Negotiation' },
  { value: 'closed_won', label: 'Closed Won' },
  { value: 'closed_lost', label: 'Closed Lost' },
];

const initialFormState: OpportunityCreate = {
  name: '',
  stage: 'prospecting',
  amount: undefined,
  probability: 0,
  expected_close_date: undefined,
  actual_close_date: undefined,
  description: '',
  next_step: '',
  account_id: 0,
  contact_id: 0,
};

export const OpportunitiesPage: React.FC = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [stage, setStage] = useState('');
  const [accountId, setAccountId] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOpportunity, setEditingOpportunity] = useState<Opportunity | null>(null);
  const [formData, setFormData] = useState<OpportunityCreate>(initialFormState);
  const [errors, setErrors] = useState<Partial<OpportunityCreate>>({});

  const { data, isLoading, error } = useOpportunities({ page, page_size: 20, search: search || undefined, stage: stage || undefined, account_id: accountId ? parseInt(accountId) : undefined });
  const { data: accountsData } = useAccounts({ page_size: 100 });
  const { data: contactsData } = useContacts({ page_size: 100 });
  const createMutation = useCreateOpportunity();
  const updateMutation = useUpdateOpportunity();
  const deleteMutation = useDeleteOpportunity();
  const { addToast } = useToast();

  const columns = [
    { key: 'name', header: 'Name', render: (o: Opportunity) => o.name },
    { key: 'stage', header: 'Stage', render: (o: Opportunity) => {
      const stageColors: Record<string, string> = {
        prospecting: 'secondary',
        qualification: 'primary',
        proposal: 'warning',
        negotiation: 'warning',
        closed_won: 'success',
        closed_lost: 'danger',
      };
      const color = stageColors[o.stage] || 'secondary';
      return <span className={`badge badge-${color}`}>{o.stage.replace('_', ' ')}</span>;
    }},
    { key: 'amount', header: 'Amount', render: (o: Opportunity) => o.amount ? `$${o.amount.toLocaleString()}` : '—' },
    { key: 'probability', header: 'Probability', render: (o: Opportunity) => `${o.probability}%` },
    { key: 'expected_close_date', header: 'Expected Close', render: (o: Opportunity) => o.expected_close_date ? new Date(o.expected_close_date).toLocaleDateString() : '—' },
    { key: 'account', header: 'Account', render: (o: Opportunity) => accountsData?.items.find(a => a.id === o.account_id)?.name || '—' },
    {
      key: 'actions',
      header: 'Actions',
      render: (o: Opportunity) => (
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); handleEdit(o); }}>Edit</Button>
          <Button variant="danger" size="sm" onClick={(e) => { e.stopPropagation(); handleDelete(o); }}>Delete</Button>
        </div>
      ),
    },
  ];

  const validateForm = () => {
    const newErrors: Partial<Record<string, string>> = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.account_id) newErrors.account_id = 'Account is required';
    if (!formData.contact_id) newErrors.contact_id = 'Contact is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      if (editingOpportunity) {
        await updateMutation.mutateAsync({ id: editingOpportunity.id, data: formData });
        addToast('Opportunity updated successfully', 'success');
      } else {
        await createMutation.mutateAsync(formData);
        addToast('Opportunity created successfully', 'success');
      }
      closeModal();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Operation failed';
      addToast(message, 'error');
    }
  };

  const handleEdit = (opportunity: Opportunity) => {
    setEditingOpportunity(opportunity);
    setFormData({
      name: opportunity.name,
      stage: opportunity.stage,
      amount: opportunity.amount,
      probability: opportunity.probability,
      expected_close_date: opportunity.expected_close_date?.split('T')[0],
      actual_close_date: opportunity.actual_close_date?.split('T')[0],
      description: opportunity.description || '',
      next_step: opportunity.next_step || '',
      account_id: opportunity.account_id,
      contact_id: opportunity.contact_id,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (opportunity: Opportunity) => {
    if (!window.confirm(`Delete ${opportunity.name}?`)) return;
    try {
      await deleteMutation.mutateAsync(opportunity.id);
      addToast('Opportunity deleted', 'success');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Delete failed';
      addToast(message, 'error');
    }
  };

  const openCreateModal = () => {
    setEditingOpportunity(null);
    setFormData({
      ...initialFormState,
      account_id: accountsData?.items[0]?.id || 0,
      contact_id: contactsData?.items[0]?.id || 0,
    });
    setErrors({});
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingOpportunity(null);
    setFormData(initialFormState);
    setErrors({});
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '0.25rem' }}>Opportunities</h1>
          <p style={{ color: 'var(--color-text-muted)' }}>Track your sales pipeline</p>
        </div>
        <Button onClick={openCreateModal} disabled={!accountsData?.items.length || !contactsData?.items.length}>
          Add Opportunity
        </Button>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-body" style={{ padding: '1rem 1.5rem' }}>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <Input
              placeholder="Search by name or description..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              style={{ minWidth: '250px', flex: 1 }}
            />
            <Select
              placeholder="Filter by stage"
              value={stage}
              onChange={(e) => { setStage(e.target.value); setPage(1); }}
              options={[{ value: '', label: 'All Stages' }, ...stageOptions]}
              style={{ minWidth: '180px' }}
            />
            <Select
              placeholder="Filter by account"
              value={accountId}
              onChange={(e) => { setAccountId(e.target.value); setPage(1); }}
              options={[{ value: '', label: 'All Accounts' }, ...(accountsData?.items || []).map(a => ({ value: a.id.toString(), label: a.name }))]}
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
              <p style={{ marginTop: '1rem' }}>Loading opportunities...</p>
            </div>
          ) : error ? (
            <div className="empty-state" style={{ padding: '3rem' }}>
              <span className="empty-state-icon">⚠️</span>
              <p>Failed to load opportunities</p>
              <Button variant="outline" onClick={() => window.location.reload()}>Retry</Button>
            </div>
          ) : (
            <>
              <Table
                columns={columns}
                data={data?.items || []}
                keyExtractor={(o) => o.id}
                emptyMessage="No opportunities found. Click 'Add Opportunity' to create one."
              />
              {data && data.total_pages > 1 && (
                <div className="card-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                    Showing {((page - 1) * 20) + 1} to {Math.min(page * 20, data.total)} of {data.total} opportunities
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
        title={editingOpportunity ? 'Edit Opportunity' : 'New Opportunity'}
        footer={
          <>
            <Button variant="outline" onClick={closeModal}>Cancel</Button>
            <Button
              onClick={handleSubmit}
              loading={createMutation.isPending || updateMutation.isPending}
            >
              {editingOpportunity ? 'Save Changes' : 'Create Opportunity'}
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
              label="Stage"
              value={formData.stage}
              onChange={(e) => setFormData({ ...formData, stage: e.target.value as OpportunityCreate['stage'] })}
              options={stageOptions}
            />
            <Input
              label="Amount"
              type="number"
              step="0.01"
              value={formData.amount?.toString() || ''}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value ? parseFloat(e.target.value) : undefined })}
            />
            <Input
              label="Probability (%)"
              type="number"
              min="0"
              max="100"
              value={formData.probability?.toString() || '0'}
              onChange={(e) => setFormData({ ...formData, probability: parseInt(e.target.value) || 0 })}
            />
            <Input
              label="Expected Close Date"
              type="date"
              value={formData.expected_close_date || ''}
              onChange={(e) => setFormData({ ...formData, expected_close_date: e.target.value || undefined })}
            />
            <Input
              label="Actual Close Date"
              type="date"
              value={formData.actual_close_date || ''}
              onChange={(e) => setFormData({ ...formData, actual_close_date: e.target.value || undefined })}
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <Select
              label="Account *"
              value={formData.account_id.toString()}
              onChange={(e) => setFormData({ ...formData, account_id: parseInt(e.target.value) })}
              options={[{ value: '', label: 'Select Account' }, ...(accountsData?.items || []).map(a => ({ value: a.id.toString(), label: a.name }))]}
              error={errors.account_id ? 'Required' : undefined}
            />
            <Select
              label="Contact *"
              value={formData.contact_id.toString()}
              onChange={(e) => setFormData({ ...formData, contact_id: parseInt(e.target.value) })}
              options={[{ value: '', label: 'Select Contact' }, ...(contactsData?.items || []).map(c => ({ value: c.id.toString(), label: `${c.first_name} ${c.last_name} (${c.email})` }))]}
              error={errors.contact_id ? 'Required' : undefined}
            />
          </div>
          <Input
            label="Next Step"
            value={formData.next_step}
            onChange={(e) => setFormData({ ...formData, next_step: e.target.value })}
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