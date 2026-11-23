'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import Logo from '@/components/Logo';
import { apiRequest, money } from '@/lib/api';

type AdminOverview = {
  counts: { users: string; projects: string; events: string; published_events: string; paid_orders: string };
  platformFeeBps: number;
  salesByCurrency: { currency: string; paid_orders: number; gross_minor: string | number; platform_fees_minor: string | number }[];
  recentEvents: { id: string; title: string; project_name: string; status: string; starts_at: string; paid_orders: number }[];
  recentUsers: { id: string; full_name: string; email: string; created_at: string }[];
  recentPayments: { id: string; event_title: string; buyer_name: string; buyer_email: string; quantity: number; amount_minor: string | number; platform_fee_minor: string | number; currency: string; provider: string; status: string; paid_at: string | null }[];
};

export default function AdminPage() {
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    void Promise.resolve().then(() => {
      if (!active) return;
      const token = window.localStorage.getItem('gatepass.accessToken');
      if (!token) {
        setError('Sign in with an administrator account to view this page.');
        setLoading(false);
        return;
      }
      return apiRequest<AdminOverview>('/admin/overview', { token })
        .then((value) => { if (active) setOverview(value); })
        .catch((requestError: Error) => { if (active) setError(requestError.message); })
        .finally(() => { if (active) setLoading(false); });
    });
    return () => { active = false; };
  }, []);

  return (
    <main className="admin-page">
      <header className="admin-header"><Link href="/dashboard" aria-label="Gatepass dashboard"><Logo/></Link><Link href="/dashboard">Organizer dashboard</Link></header>
      <section className="admin-content">
        <h1>Gatepass overview</h1>
        <p className="admin-lede">Account, project, and event activity across the platform.</p>
        {loading ? <p className="admin-message">Loading platform activity…</p> : error ? <div className="admin-message admin-error" role="alert"><p>{error}</p><Link href="/dashboard">Return to dashboard</Link></div> : overview ? (
          <>
            <dl className="admin-metrics">
              <div><dt>Accounts</dt><dd>{Number(overview.counts.users).toLocaleString()}</dd></div>
              <div><dt>Projects</dt><dd>{Number(overview.counts.projects).toLocaleString()}</dd></div>
              <div><dt>Events</dt><dd>{Number(overview.counts.events).toLocaleString()}</dd></div>
              <div><dt>Paid orders</dt><dd>{Number(overview.counts.paid_orders).toLocaleString()}</dd></div>
            </dl>
            <section className="admin-events" aria-labelledby="admin-sales-title">
              <div className="admin-section-heading"><h2 id="admin-sales-title">Platform sales</h2><span>{overview.platformFeeBps / 100}% fee on paid orders</span></div>
              {overview.salesByCurrency.length ? <div className="admin-sales-list">{overview.salesByCurrency.map((sale) => <div key={sale.currency}><span>{sale.currency} gross</span><strong>{money(sale.gross_minor, sale.currency)}</strong><span>Fees earned</span><strong>{money(sale.platform_fees_minor, sale.currency)}</strong></div>)}</div> : <p className="admin-message">No paid orders recorded yet.</p>}
            </section>
            <section className="admin-events" aria-labelledby="admin-events-title">
              <div className="admin-section-heading"><h2 id="admin-events-title">Recent events</h2><span>{overview.platformFeeBps / 100}% platform fee per paid order</span></div>
              {overview.recentEvents.length ? (
                  <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th scope="col">Event</th><th scope="col">Project</th><th scope="col">Date</th><th scope="col">Paid orders</th><th scope="col">Status</th></tr></thead><tbody>
                  {overview.recentEvents.map((event) => <tr key={event.id}><td>{event.title}</td><td>{event.project_name}</td><td>{new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(event.starts_at))}</td><td>{event.paid_orders}</td><td>{event.status === 'PUBLISHED' ? 'Published' : 'Draft'}</td></tr>)}
                </tbody></table></div>
              ) : <p className="admin-message">No events have been created yet.</p>}
            </section>
            <section className="admin-events" aria-labelledby="admin-payment-title">
              <div className="admin-section-heading"><h2 id="admin-payment-title">Recent payments</h2><span>Latest {overview.recentPayments.length} records</span></div>
              {overview.recentPayments.length ? <div className="admin-table-wrap"><table className="admin-table admin-payment-table"><thead><tr><th scope="col">Event</th><th scope="col">Buyer</th><th scope="col">Amount</th><th scope="col">Fee</th><th scope="col">Status</th><th scope="col">Date</th></tr></thead><tbody>
                {overview.recentPayments.map((payment) => <tr key={payment.id}><td>{payment.event_title}</td><td><strong>{payment.buyer_name}</strong><a href={`mailto:${payment.buyer_email}`}>{payment.buyer_email}</a></td><td>{money(payment.amount_minor, payment.currency)}<small>{payment.provider} · {payment.quantity} ticket(s)</small></td><td>{money(payment.platform_fee_minor, payment.currency)}</td><td><span className={`payment-status payment-status-${payment.status.toLowerCase()}`}>{payment.status}</span></td><td>{payment.paid_at ? new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(payment.paid_at)) : '—'}</td></tr>)}
              </tbody></table></div> : <p className="admin-message">Payment records appear here after a provider confirms a checkout.</p>}
            </section>
            <section className="admin-events" aria-labelledby="admin-users-title">
              <div className="admin-section-heading"><h2 id="admin-users-title">Recent accounts</h2><span>Latest {overview.recentUsers.length} signups</span></div>
              {overview.recentUsers.length ? <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th scope="col">Name</th><th scope="col">Email</th><th scope="col">Joined</th></tr></thead><tbody>
                {overview.recentUsers.map((account) => <tr key={account.id}><td>{account.full_name}</td><td><a href={`mailto:${account.email}`}>{account.email}</a></td><td>{new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(account.created_at))}</td></tr>)}
              </tbody></table></div> : <p className="admin-message">No accounts have been created yet.</p>}
            </section>
            <p className="admin-note">Payment history stays empty until a provider integration confirms transactions. No sample payment data is shown.</p>
          </>
        ) : null}
      </section>
    </main>
  );
}
