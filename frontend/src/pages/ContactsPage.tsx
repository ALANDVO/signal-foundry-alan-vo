import React, { useState } from 'react';
import { useContacts, useCreateContact, useUpdateContact, useDeleteContact } from '../hooks/useApi';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Table } from '../components/ui/Table';
import { Pagination } from '../components/ui/Pagination';
import { useToast } from '../components/Toast';
import type { Contact, ContactCreate } from '../types/api';

const initialFormState: ContactCreate = {
  email: '',
  first_name: '',
  last_name: '',
  phone: '',
  company: '',
  title: '',
  address: '',
  notes: '',
};

export const ContactsPage: React.FC = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [company, setCompany] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [formData, setFormData] = useState<ContactCreate>(initialFormState);
  const [errors, setErrors] = useState<Partial<ContactCreate>>({});

  const { data, isLoading, error } = useContacts({ page, page_size: 20, search: search || undefined, company: company || undefined });
  const createMutation = useCreateContact();
  const updateMutation = useUpdateContact();
  const deleteMutation = useDeleteContact();
  const { addToast } = useToast();

  const columns = [
    { key: 'first_name', header: 'First Name', render: (c: Contact) => c.first_name },
    { key: 'last_name', header: 'Last Name', render: (c: Contact) => c.last_name },
    { key: 'email', header: 'Email', render: (c: Contact) => c.email },
    { key: 'company', header: 'Company', render: (c: Contact) => c.company || '—' },
    { key: 'title', header: 'Title', render: (c: Contact) => c.title || '—' },
    {
      key: 'actions',
      header: 'Actions',
      render: (c: Contact) => (
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); handleEdit(c); }}>Edit</Button>
          <Button variant="danger" size="sm" onClick={(e) => { e.stopPropagation(); handleDelete(c); }}>Delete</Button>
        </div>
      ),
    },
  ];

  const validateForm = () => {
    const newErrors: Partial<ContactCreate> = {};
    if (!formData.email) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Invalid email format';
    if (!formData.first_name.trim()) newErrors.first_name = 'First name is required';
    if (!formData.last_name.trim()) newErrors.last_name = 'Last name is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      if (editingContact) {
        await updateMutation.mutateAsync({ id: editingContact.id, data: formData });
        addToast('Contact updated successfully', 'success');
      } else {
        await createMutation.mutateAsync(formData);
        addToast('Contact created successfully', 'success');
      }
      closeModal();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Operation failed';
      addToast(message, 'error');
    }
  };

  const handleEdit = (contact: Contact) => {
    setEditingContact(contact);
    setFormData({
      email: contact.email,
      first_name: contact.first_name,
      last_name: contact.last_name,
      phone: contact.phone || '',
      company: contact.company || '',
      title: contact.title || '',
      address: contact.address || '',
      notes: contact.notes || '',
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (contact: Contact) => {
    if (!window.confirm(`Delete ${contact.first_name} ${contact.last_name}?`)) return;
    try {
      await deleteMutation.mutateAsync(contact.id);
      addToast('Contact deleted', 'success');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Delete failed';
      addToast(message, 'error');
    }
  };

  const openCreateModal = () => {
    setEditingContact(null);
    setFormData(initialFormState);
    setErrors({});
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingContact(null);
    setFormData(initialFormState);
    setErrors({});
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '0.25rem' }}>Contacts</h1>
          <p style={{ color: 'var(--color-text-muted)' }}>Manage your contacts and leads</p>
        </div>
        <Button onClick={openCreateModal}>Add Contact</Button>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-body" style={{ padding: '1rem 1.5rem' }}>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <Input
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              style={{ minWidth: '250px', flex: 1 }}
            />
            <Input
              placeholder="Filter by company..."
              value={company}
              onChange={(e) => { setCompany(e.target.value); setPage(1); }}
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
              <p style={{ marginTop: '1rem' }}>Loading contacts...</p>
            </div>
          ) : error ? (
            <div className="empty-state" style={{ padding: '3rem' }}>
              <span className="empty-state-icon">⚠️</span>
              <p>Failed to load contacts</p>
              <Button variant="outline" onClick={() => window.location.reload()}>Retry</Button>
            </div>
          ) : (
            <>
              <Table
                columns={columns}
                data={data?.items || []}
                keyExtractor={(c) => c.id}
                emptyMessage="No contacts found. Click 'Add Contact' to create one."
              />
              {data && data.total_pages > 1 && (
                <div className="card-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                    Showing {((page - 1) * 20) + 1} to {Math.min(page * 20, data.total)} of {data.total} contacts
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
        title={editingContact ? 'Edit Contact' : 'New Contact'}
        footer={
          <>
            <Button variant="outline" onClick={closeModal}>Cancel</Button>
            <Button
              onClick={handleSubmit}
              loading={createMutation.isPending || updateMutation.isPending}
            >
              {editingContact ? 'Save Changes' : 'Create Contact'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <Input
              label="Email *"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              error={errors.email}
            />
            <Input
              label="First Name *"
              value={formData.first_name}
              onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
              error={errors.first_name}
            />
            <Input
              label="Last Name *"
              value={formData.last_name}
              onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
              error={errors.last_name}
            />
            <Input
              label="Phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
            <Input
              label="Company"
              value={formData.company}
              onChange={(e) => setFormData({ ...formData, company: e.target.value })}
            />
            <Input
              label="Title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>
          <Input
            label="Address"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          />
          <div className="form-group">
            <label className="form-label">Notes</label>
            <textarea
              className="form-input"
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};