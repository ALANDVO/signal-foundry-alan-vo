import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';

const navigation = [
  { path: '/contacts', label: 'Contacts' },
  { path: '/accounts', label: 'Accounts' },
  { path: '/opportunities', label: 'Opportunities' },
];

export const Layout: React.FC = () => {
  const location = useLocation();

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-[var(--color-border)] bg-[var(--color-surface)] sticky top-0 z-50">
        <div className="container">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="text-xl font-bold text-[var(--color-primary)]" aria-label="Signal Foundry Home">
              Signal Foundry
            </Link>
            <nav className="flex items-center gap-6" aria-label="Main navigation">
              {navigation.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`text-sm font-medium transition-colors ${
                    location.pathname === item.path
                      ? 'text-[var(--color-primary)]'
                      : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </header>
      <main className="flex-1 container py-6" style={{ width: '100%', maxWidth: '1200px', margin: '0 auto', padding: '1.5rem 1rem' }}>
        <Outlet />
      </main>
      <footer className="border-t border-[var(--color-border)] bg-[var(--color-surface)] py-4">
        <div className="container text-center text-sm text-[var(--color-text-muted)]">
          Signal Foundry \u2014 The open alternative to Salesforce, designed for AI. | Alan Vo alanvo@gmail.com
        </div>
      </footer>
    </div>
  );
};