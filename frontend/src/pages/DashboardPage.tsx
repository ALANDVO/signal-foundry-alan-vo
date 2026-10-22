import React from 'react';
import { useContacts, useAccounts, useOpportunities } from '../hooks/useApi';
import { Link } from 'react-router-dom';
import type { AccountType, OpportunityStage } from '../types/api';

export const DashboardPage: React.FC = () => {
  const { data: contactsData } = useContacts({ page_size: 5 });
  const { data: accountsData, isLoading: accountsLoading } = useAccounts({ page_size: 5 });
  const { data: opportunitiesData, isLoading: opportunitiesLoading } = useOpportunities({ page_size: 5 });

  const stats = [
    {
      label: 'Total Contacts',
      value: contactsData?.total || 0,
      icon: '👥',
      color: 'var(--color-primary)',
      link: '/contacts',
    },
    {
      label: 'Total Accounts',
      value: accountsData?.total || 0,
      icon: '🏢',
      color: '#16a34a',
      link: '/accounts',
    },
    {
      label: 'Open Opportunities',
      value: opportunitiesData?.items.filter(o => o.stage !== 'closed_won' && o.stage !== 'closed_lost').length || 0,
      icon: '💼',
      color: '#f59e0b',
      link: '/opportunities',
    },
    {
      label: 'Pipeline Value',
      value: '$' + (opportunitiesData?.items
        .filter(o => o.stage !== 'closed_won' && o.stage !== 'closed_lost')
        .reduce((sum, o) => sum + (o.amount || 0), 0) || 0).toLocaleString(),
      icon: '💰',
      color: '#dc2626',
      link: '/opportunities',
    },
  ];

  const stageColors: Record<OpportunityStage, string> = {
    prospecting: 'var(--color-secondary)',
    qualification: 'var(--color-primary)',
    proposal: '#f59e0b',
    negotiation: '#f59e0b',
    closed_won: '#16a34a',
    closed_lost: '#dc2626',
  };

  const typeColors: Record<AccountType, string> = {
    customer: '#16a34a',
    prospect: 'var(--color-primary)',
    partner: '#f59e0b',
    vendor: 'var(--color-secondary)',
  };

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.875rem', fontWeight: '700', marginBottom: '0.5rem' }}>Dashboard</h1>
        <p style={{ color: 'var(--color-text-muted)' }}>Overview of your CRM data</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        {stats.map((stat) => (
          <Link key={stat.label} to={stat.link} style={{ textDecoration: 'none' }}>
            <div className="card" style={{ transition: 'transform 0.15s ease, box-shadow 0.15s ease' }}>
              <div className="card-body">
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <div>
                    <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>{stat.label}</p>
                    <p style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--color-text)' }}>{stat.value}</p>
                  </div>
                  <div style={{ fontSize: '2.5rem', color: stat.color }}>{stat.icon}</div>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
        <div className="card">
          <div className="card-header">
            <h2 style={{ fontSize: '1rem', fontWeight: '600' }}>Recent Opportunities</h2>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            {opportunitiesLoading ? (
              <div className="empty-state" style={{ padding: '2rem' }}>
                <span className="loading-spinner" />
                <p style={{ marginTop: '0.5rem' }}>Loading...</p>
              </div>
            ) : opportunitiesData?.items.length === 0 ? (
              <div className="empty-state" style={{ padding: '2rem' }}>
                <span className="empty-state-icon">💼</span>
                <p>No opportunities yet</p>
                <Link to="/opportunities" style={{ marginTop: '1rem', display: 'inline-block' }}>
                  <button className="btn btn-primary btn-sm">Create Opportunity</button>
                </Link>
              </div>
            ) : (
              <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                {opportunitiesData?.items.map((opp) => (
                  <div key={opp.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.5rem', borderBottom: '1px solid var(--color-border)' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontWeight: '500', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{opp.name}</p>
                      <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                        {accountsData?.items.find(a => a.id === opp.account_id)?.name || 'Unknown Account'}
                      </p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <span
                        className="badge"
                        style={{ backgroundColor: `${stageColors[opp.stage]}20`, color: stageColors[opp.stage] }}
                      >
                        {opp.stage.replace('_', ' ')}
                      </span>
                      {opp.amount && (
                        <span style={{ fontWeight: '600', color: 'var(--color-text)' }}>
                          ${opp.amount.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h2 style={{ fontSize: '1rem', fontWeight: '600' }}>Recent Accounts</h2>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            {accountsLoading ? (
              <div className="empty-state" style={{ padding: '2rem' }}>
                <span className="loading-spinner" />
                <p style={{ marginTop: '0.5rem' }}>Loading...</p>
              </div>
            ) : accountsData?.items.length === 0 ? (
              <div className="empty-state" style={{ padding: '2rem' }}>
                <span className="empty-state-icon">🏢</span>
                <p>No accounts yet</p>
                <Link to="/accounts" style={{ marginTop: '1rem', display: 'inline-block' }}>
                  <button className="btn btn-primary btn-sm">Create Account</button>
                </Link>
              </div>
            ) : (
              <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                {accountsData?.items.map((acc) => (
                  <div key={acc.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.5rem', borderBottom: '1px solid var(--color-border)' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontWeight: '500', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{acc.name}</p>
                      <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>{acc.industry || 'No industry'}</p>
                    </div>
                    <span
                      className="badge"
                      style={{ backgroundColor: `${typeColors[acc.type]}20`, color: typeColors[acc.type] }}
                    >
                      {acc.type}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};