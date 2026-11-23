'use client';

import Link from 'next/link';
import Image from 'next/image';
import { FormEvent, useEffect, useState } from 'react';
import Logo from '@/components/Logo';
import { apiRequest, Event, EventInput, eventHref, PaymentRecord, Session, Tenant, User, money } from '@/lib/api';

type Stage = 'loading' | 'auth' | 'tenant' | 'workspace';
type TicketDraft = { id: string; name: string; price: string; currency: string; quantity: string };
type Notice = { kind: 'error' | 'success'; text: string } | null;
type DashboardTab = 'overview' | 'events' | 'payments';

function newTicket(): TicketDraft {
  return { id: crypto.randomUUID(), name: 'General admission', price: '', currency: 'NGN', quantity: '100' };
}

function Icon({ name, size = 18 }: { name: 'calendar' | 'arrow' | 'external' | 'copy' | 'close' | 'plus' | 'logout' | 'overview' | 'payments'; size?: number }) {
  const paths: Record<typeof name, React.ReactNode> = {
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/></>,
    arrow: <><path d="M4 12h15M13 6l6 6-6 6"/></>,
    external: <><path d="M13 5h6v6M19 5l-9 9"/><path d="M18 13v5a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/></>,
    copy: <><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/></>,
    close: <><path d="m6 6 12 12M18 6 6 18"/></>,
    plus: <><path d="M12 5v14M5 12h14"/></>,
    logout: <><path d="M10 17l5-5-5-5M15 12H3"/><path d="M12 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6"/></>,
    overview: <><rect x="3" y="3" width="8" height="8" rx="1.5"/><rect x="13" y="3" width="8" height="5" rx="1.5"/><rect x="13" y="10" width="8" height="11" rx="1.5"/><rect x="3" y="13" width="8" height="8" rx="1.5"/></>,
    payments: <><rect x="2.5" y="5" width="19" height="14" rx="2"/><path d="M3 10h18M7 15h4"/></>,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

function NoticeBar({ notice, onDismiss }: { notice: Notice; onDismiss: () => void }) {
  if (!notice) return null;
  return (
    <div className={`notice notice-${notice.kind}`} role={notice.kind === 'error' ? 'alert' : 'status'}>
      <span>{notice.text}</span>
      <button type="button" className="icon-button notice-close" onClick={onDismiss} aria-label="Dismiss message"><Icon name="close" size={16}/></button>
    </div>
  );
}

export default function DashboardApp() {
  const [stage, setStage] = useState<Stage>('loading');
  const [token, setToken] = useState('');
  const [user, setUser] = useState<User | null>(null);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [showEditor, setShowEditor] = useState(false);
  const [salesEvent, setSalesEvent] = useState<Event | null>(null);
  const [activeTab, setActiveTab] = useState<DashboardTab>('overview');
  const [busy, setBusy] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);

  async function setWorkspace(nextTenants: Tenant[], authToken: string, selected?: Tenant) {
    setTenants(nextTenants);
    if (nextTenants.length === 0) {
      setStage('tenant');
      setTenant(null);
      return;
    }
    const active = selected ?? nextTenants[0];
    setTenant(active);
    const rows = await apiRequest<Event[]>(`/tenants/${encodeURIComponent(active.slug)}/events`, { token: authToken });
    setEvents(rows);
    setShowEditor(false);
    setSalesEvent(null);
    setActiveTab('overview');
    setStage('workspace');
  }

  useEffect(() => {
    let active = true;
    void Promise.resolve().then(() => {
      if (!active) return;
      const savedToken = window.localStorage.getItem('gatepass.accessToken');
      const savedUser = window.localStorage.getItem('gatepass.user');
      if (!savedToken) {
        setStage('auth');
        return;
      }
      setToken(savedToken);
      if (savedUser) {
        try { setUser(JSON.parse(savedUser) as User); } catch { window.localStorage.removeItem('gatepass.user'); }
      }
      return apiRequest<Tenant[]>('/tenants', { token: savedToken })
        .then((rows) => active ? setWorkspace(rows, savedToken) : undefined)
        .catch((error: Error) => {
          if (!active) return;
          window.localStorage.removeItem('gatepass.accessToken');
          window.localStorage.removeItem('gatepass.user');
          setToken('');
          setStage('auth');
          setNotice({ kind: 'error', text: error.message });
        });
    });
    return () => { active = false; };
  }, []);

  async function authenticate(mode: 'register' | 'login', values: { fullName?: string; email: string; password: string }) {
    setBusy(true);
    setNotice(null);
    try {
      const session = await apiRequest<Session>(`/auth/${mode}`, { method: 'POST', body: JSON.stringify(values) });
      window.localStorage.setItem('gatepass.accessToken', session.accessToken);
      window.localStorage.setItem('gatepass.user', JSON.stringify(session.user));
      setToken(session.accessToken);
      setUser(session.user);
      const rows = await apiRequest<Tenant[]>('/tenants', { token: session.accessToken });
      await setWorkspace(rows, session.accessToken);
    } catch (error) {
      setNotice({ kind: 'error', text: (error as Error).message });
    } finally {
      setBusy(false);
    }
  }

  async function createTenant(values: { name: string; slug: string }) {
    setBusy(true);
    setNotice(null);
    try {
      const created = await apiRequest<Tenant>('/tenants', { token, method: 'POST', body: JSON.stringify(values) });
      await setWorkspace([...tenants.filter((item) => item.id !== created.id), created], token, created);
      setNotice({ kind: 'success', text: 'Your project is ready.' });
    } catch (error) {
      setNotice({ kind: 'error', text: (error as Error).message });
    } finally {
      setBusy(false);
    }
  }

  async function switchTenant(slug: string) {
    const selected = tenants.find((item) => item.slug === slug);
    if (!selected) return;
    setBusy(true);
    try {
      await setWorkspace(tenants, token, selected);
      setNotice(null);
    } catch (error) {
      setNotice({ kind: 'error', text: (error as Error).message });
    } finally {
      setBusy(false);
    }
  }

  function signOut() {
    window.localStorage.removeItem('gatepass.accessToken');
    window.localStorage.removeItem('gatepass.user');
    setToken('');
    setUser(null);
    setTenant(null);
    setTenants([]);
    setEvents([]);
    setStage('auth');
    setNotice(null);
  }

  async function saveEvent(input: EventInput) {
    if (!tenant) return;
    setBusy(true);
    setNotice(null);
    try {
      const created = await apiRequest<Event>(`/tenants/${encodeURIComponent(tenant.slug)}/events`, {
        token,
        method: 'POST',
        body: JSON.stringify(input),
      });
      setEvents((current) => [created, ...current]);
      setShowEditor(false);
      setActiveTab('events');
      setNotice({ kind: 'success', text: 'Draft saved. Publish it when you’re ready to share.' });
    } catch (error) {
      setNotice({ kind: 'error', text: (error as Error).message });
    } finally {
      setBusy(false);
    }
  }

  async function publishEvent(event: Event) {
    if (!tenant) return;
    setBusy(true);
    setNotice(null);
    try {
      await apiRequest(`/tenants/${encodeURIComponent(tenant.slug)}/events/${encodeURIComponent(event.id)}/publish`, {
        token,
        method: 'POST',
      });
      setEvents((current) => current.map((item) => item.id === event.id ? { ...item, status: 'PUBLISHED' } : item));
      setNotice({ kind: 'success', text: 'Your event is published and ready to share.' });
    } catch (error) {
      setNotice({ kind: 'error', text: (error as Error).message });
    } finally {
      setBusy(false);
    }
  }

  async function copyLink(event: Event) {
    if (!tenant) return;
    const link = `${window.location.origin}${eventHref(tenant.slug, event.slug)}`;
    try {
      await navigator.clipboard.writeText(link);
      setNotice({ kind: 'success', text: 'Event link copied.' });
    } catch {
      setNotice({ kind: 'error', text: 'Your browser could not copy the link. Open the event page to copy its address.' });
    }
  }

  if (stage === 'loading') {
    return <main className="loading-screen"><Logo/><p>Opening your organizer space…</p><span className="loading-line"/></main>;
  }
  if (stage === 'auth') return <AuthPage busy={busy} notice={notice} dismissNotice={() => setNotice(null)} onSubmit={authenticate}/>;
  if (stage === 'tenant') return <TenantSetup busy={busy} notice={notice} dismissNotice={() => setNotice(null)} user={user} projectCount={tenants.length} onSubmit={createTenant} onSignOut={signOut} onCancel={tenant ? () => setStage('workspace') : undefined}/>;
  if (!tenant) return null;

  return (
    <div className="workspace-shell">
      <aside className={`sidebar${mobileMenu ? ' sidebar-open' : ''}`}>
        <div className="sidebar-brand"><Logo/></div>
        <p className="sidebar-caption">Your project</p>
        <label className="tenant-switcher">
          <span className="visually-hidden">Switch project</span>
          <select aria-label="Switch project" value={tenant.slug} onChange={(event) => void switchTenant(event.target.value)} disabled={busy || tenants.length < 2}>
            {tenants.map((item) => <option key={item.id} value={item.slug}>{item.name}</option>)}
          </select>
        </label>
        <button className="project-create" type="button" onClick={() => { setNotice(null); setStage('tenant'); setMobileMenu(false); }}><Icon name="plus" size={15}/>New project</button>
        <nav className="sidebar-nav" aria-label="Workspace navigation">
          <span className="nav-section-label">Manage</span>
          <button className={`nav-item${activeTab === 'overview' ? ' nav-item-active' : ''}`} type="button" onClick={() => { setShowEditor(false); setSalesEvent(null); setActiveTab('overview'); setMobileMenu(false); }}><Icon name="overview"/><span>Overview</span></button>
          <button className={`nav-item${activeTab === 'events' && !showEditor && !salesEvent ? ' nav-item-active' : ''}`} type="button" onClick={() => { setShowEditor(false); setSalesEvent(null); setActiveTab('events'); setMobileMenu(false); }}><Icon name="calendar"/><span>Events</span><span className="nav-count">{events.length}</span></button>
          <button className={`nav-item${activeTab === 'payments' || salesEvent ? ' nav-item-active' : ''}`} type="button" onClick={() => { setShowEditor(false); setSalesEvent(null); setActiveTab('payments'); setMobileMenu(false); }}><Icon name="payments"/><span>Payments</span><span className="nav-count">{events.reduce((sum, item) => sum + Number(item.paid_orders ?? 0), 0)}</span></button>
        </nav>
        <div className="sidebar-bottom">
          <div className="account-row">
            <span className="account-avatar">{user?.fullName?.slice(0, 1).toUpperCase() ?? 'A'}</span>
            <span className="account-details"><strong>{user?.fullName ?? 'Organizer'}</strong><small>{user?.email ?? tenant.name}</small></span>
          </div>
          <button className="signout-button" type="button" onClick={signOut}><Icon name="logout" size={16}/>Sign out</button>
        </div>
      </aside>

      <div className="workspace-main">
        <header className="topbar">
          <button className="mobile-menu-button icon-button" type="button" onClick={() => setMobileMenu((open) => !open)} aria-expanded={mobileMenu} aria-label={mobileMenu ? 'Close navigation' : 'Open navigation'}>
            <span className="menu-lines"/>
          </button>
          <div className="topbar-context"><span className="topbar-dot"/><span>{salesEvent ? salesEvent.title : showEditor ? 'New event' : activeTab === 'overview' ? 'Overview' : activeTab === 'payments' ? 'Payments' : 'Events'}</span></div>
          <div className="topbar-actions">
            <label className="topbar-project-switcher"><span className="visually-hidden">Switch project</span><select aria-label="Switch project" value={tenant.slug} onChange={(event) => void switchTenant(event.target.value)} disabled={busy || tenants.length < 2}>{tenants.map((item) => <option key={item.id} value={item.slug}>{item.name}</option>)}</select></label>
            {user?.isAdmin && <Link className="topbar-admin" href="/admin">Admin dashboard</Link>}
            <a className="topbar-public" href={`/${encodeURIComponent(tenant.slug)}/events`} target="_blank" rel="noreferrer">Project page <Icon name="external" size={15}/></a>
          </div>
        </header>

        <main className="dashboard-content">
          <NoticeBar notice={notice} onDismiss={() => setNotice(null)}/>
          {showEditor ? (
            <EventEditor busy={busy} onCancel={() => setShowEditor(false)} onSave={saveEvent}/>
          ) : salesEvent ? (
            <EventSales token={token} tenant={tenant} event={salesEvent} onBack={() => setSalesEvent(null)}/>
          ) : activeTab === 'overview' ? (
            <OrganizerOverview tenant={tenant} events={events} onEvents={() => setActiveTab('events')} onCreate={() => { setActiveTab('events'); setShowEditor(true); }} onPayments={(event) => { setSalesEvent(event); setActiveTab('payments'); }}/>
          ) : activeTab === 'payments' ? (
            <PaymentsOverview tenant={tenant} events={events} onView={(event) => setSalesEvent(event)}/>
          ) : (
            <>
              <div className="dashboard-heading">
                <div>
                  <h1>Events in {tenant.name}</h1>
                  <p>Create an event, add ticket types, then share its page with your audience.</p>
                </div>
                <button className="button button-primary" type="button" onClick={() => { setNotice(null); setShowEditor(true); }}><Icon name="plus" size={17}/>Create event</button>
              </div>
              <section className="event-section" aria-labelledby="event-list-title">
                <div className="section-heading">
                  <h2 id="event-list-title">All events</h2>
                  <span className="event-total">{events.length} {events.length === 1 ? 'event' : 'events'}</span>
                </div>
                {busy && events.length === 0 ? <EventSkeleton/> : events.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-illustration" aria-hidden="true">
                      <svg viewBox="0 0 96 78" fill="none"><path d="M18 15h48a8 8 0 0 1 8 8v7a8 8 0 0 0 0 16v7a8 8 0 0 1-8 8H18a8 8 0 0 1-8-8v-7a8 8 0 0 0 0-16v-7a8 8 0 0 1 8-8Z" stroke="currentColor" strokeWidth="1.5"/><path d="M28 30h28M28 39h20M28 48h13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><circle cx="80" cy="16" r="7" fill="var(--mint)"/></svg>
                    </div>
                    <h2>Start with one event.</h2>
                    <p>Add details and ticket types. Publish its link when it’s ready to share.</p>
                    <button className="button button-dark" type="button" onClick={() => setShowEditor(true)}><Icon name="plus" size={17}/>Create your first event</button>
                  </div>
                ) : (
                  <div className="event-table-wrap">
                    <table className="event-table">
                      <thead><tr><th scope="col">Event</th><th scope="col">Date</th><th scope="col">Paid orders</th><th scope="col">Gross</th><th scope="col">Status</th><th scope="col"><span className="visually-hidden">Actions</span></th></tr></thead>
                      <tbody>{events.map((event) => (
                        <tr key={event.id}>
                          <td><strong className="event-name">{event.title}</strong><span className="event-venue">{event.venue || 'Venue to be announced'}</span></td>
                          <td className="event-date">{formatEventDate(event.starts_at)}</td>
                          <td className="event-sales-count">{event.paid_orders ?? 0}</td>
                          <td className="event-sales-gross">{event.sales_by_currency?.length ? event.sales_by_currency.map((sale) => <span key={sale.currency}>{money(sale.gross_minor, sale.currency)}</span>) : '—'}</td>
                          <td><span className={`status-badge status-${event.status.toLowerCase()}`}><span/>{event.status === 'PUBLISHED' ? 'Published' : 'Draft'}</span></td>
                          <td className="event-actions">
                            <button className="text-action" type="button" onClick={() => setSalesEvent(event)}>View payments</button>
                            {event.status === 'PUBLISHED' ? <button className="text-action" type="button" onClick={() => void copyLink(event)}><Icon name="copy" size={15}/>Copy link</button> : <button className="text-action publish-action" type="button" disabled={busy} onClick={() => void publishEvent(event)}>Publish <Icon name="arrow" size={15}/></button>}
                          </td>
                        </tr>
                      ))}</tbody>
                    </table>
                  </div>
                )}
              </section>
              <p className="dashboard-footnote">Gatepass’s platform fee is 3% per paid order. Checkout opens when production payment settings are connected.</p>
            </>
          )}
        </main>
      </div>
    </div>
  );
}

function AuthPage({ busy, notice, dismissNotice, onSubmit }: { busy: boolean; notice: Notice; dismissNotice: () => void; onSubmit: (mode: 'register' | 'login', values: { fullName?: string; email: string; password: string }) => Promise<void> }) {
  const [mode, setMode] = useState<'register' | 'login'>('register');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void onSubmit(mode, { ...(mode === 'register' ? { fullName } : {}), email, password });
  }

  return (
    <main className="auth-layout">
      <section className="auth-story">
        <Logo/>
        <div className="auth-story-copy">
          <h1>One good event.<br/><em>One clear link.</em></h1>
          <p>Set up your event, add ticket types, and give your audience one place to find the details.</p>
          <div className="event-preview" aria-label="Example of an event page preview">
            <div className="preview-top"><span className="preview-mark"><Icon name="calendar" size={15}/></span><span>Event page preview</span><span className="preview-status">One shareable page</span></div>
            <div className="preview-line"/>
            <p className="preview-title">Your next event</p>
            <p className="preview-subtitle">A home for the details your guests need.</p>
            <div className="preview-bottom"><span><span className="preview-dot"/>Details in one place</span><span className="preview-link">gatepass.usevoii.com</span></div>
          </div>
        </div>
        <p className="auth-story-foot">An organizer space by Gatepass</p>
      </section>

      <section className="auth-form-side">
        <div className="auth-form-wrap">
          <h2>{mode === 'register' ? 'Create your account.' : 'Sign in to your space.'}</h2>
          <p className="auth-description">{mode === 'register' ? 'Your events and ticket links start here.' : 'Pick up where you left off.'}</p>
          <NoticeBar notice={notice} onDismiss={dismissNotice}/>
          <form className="form-stack" onSubmit={submit}>
            {mode === 'register' && <label className="field"><span>Your name</span><input autoComplete="name" value={fullName} onChange={(event) => setFullName(event.target.value)} minLength={2} maxLength={100} required/></label>}
            <label className="field"><span>Email address</span><input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} maxLength={254} required/></label>
            <label className="field"><span>Password</span><input type="password" autoComplete={mode === 'register' ? 'new-password' : 'current-password'} value={password} onChange={(event) => setPassword(event.target.value)} minLength={8} maxLength={128} required/><small>At least 8 characters.</small></label>
            <button className="button button-dark button-wide" disabled={busy} type="submit">{busy ? 'Please wait…' : mode === 'register' ? 'Create account' : 'Sign in'}<Icon name="arrow" size={16}/></button>
          </form>
          <p className="auth-switch">{mode === 'register' ? 'Already have an account?' : 'New to Gatepass?'} <button type="button" onClick={() => setMode(mode === 'register' ? 'login' : 'register')}>{mode === 'register' ? 'Sign in' : 'Create an account'}</button></p>
        </div>
      </section>
    </main>
  );
}

function TenantSetup({ busy, notice, dismissNotice, user, projectCount, onSubmit, onSignOut, onCancel }: { busy: boolean; notice: Notice; dismissNotice: () => void; user: User | null; projectCount: number; onSubmit: (values: { name: string; slug: string }) => Promise<void>; onSignOut: () => void; onCancel?: () => void }) {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugEdited, setSlugEdited] = useState(false);

  function changeName(value: string) {
    setName(value);
    if (!slugEdited) setSlug(slugify(value));
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void onSubmit({ name: name.trim(), slug: slugify(slug) });
  }

  return (
    <main className="onboarding-page">
      <header className="onboarding-header"><Logo/>{onCancel ? <button className="quiet-button" type="button" onClick={onCancel}>Back to dashboard</button> : <button className="quiet-button" type="button" onClick={onSignOut}>Sign out</button>}</header>
      <section className="onboarding-panel">
        <h1>{projectCount ? 'Create a project.' : user?.fullName ? `Welcome, ${user.fullName.split(' ')[0]}.` : 'Create your first project.'}</h1>
        <p className="auth-description">A project keeps its events, ticket types, and public links together.</p>
        <NoticeBar notice={notice} onDismiss={dismissNotice}/>
        <form className="form-stack" onSubmit={submit}>
          <label className="field"><span>Project name</span><input value={name} onChange={(event) => changeName(event.target.value)} minLength={2} maxLength={100} placeholder="e.g. Northside Events" required/></label>
          <label className="field"><span>Public link name</span><input value={slug} onChange={(event) => { setSlugEdited(true); setSlug(event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-')); }} minLength={3} maxLength={50} pattern="[a-z0-9]+(?:-[a-z0-9]+)*" required/><small>Use lowercase letters, numbers, and hyphens.</small></label>
          <p className="slug-preview"><span>Your public page</span><strong>gatepass.usevoii.com/{slug || 'your-name'}/events</strong></p>
          <button className="button button-dark button-wide" type="submit" disabled={busy || !slug}>{busy ? 'Creating project…' : 'Create project'}<Icon name="arrow" size={16}/></button>
        </form>
      </section>
    </main>
  );
}

function EventSales({ token, tenant, event, onBack }: { token: string; tenant: Tenant; event: Event; onBack: () => void }) {
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    apiRequest<PaymentRecord[]>(`/tenants/${encodeURIComponent(tenant.slug)}/events/${encodeURIComponent(event.id)}/payments`, { token })
      .then((rows) => { if (active) setPayments(rows); })
      .catch((requestError: Error) => { if (active) setError(requestError.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [event.id, tenant.slug, token]);

  return (
    <section className="payment-page">
      <button className="back-link" type="button" onClick={onBack}>Back to events</button>
      <div className="payment-heading"><div><h1>{event.title}</h1><p>{formatEventDate(event.starts_at)}{event.venue ? ` · ${event.venue}` : ''}</p></div><a className="button button-outline button-small" href={eventHref(tenant.slug, event.slug)} target="_blank" rel="noreferrer">Open event page <Icon name="external" size={15}/></a></div>
      <dl className="payment-summary">
        <div><dt>Paid orders</dt><dd>{Number(event.paid_orders ?? 0).toLocaleString()}</dd></div>
        {(event.sales_by_currency ?? []).map((sale) => <div key={sale.currency}><dt>Gross · {sale.currency}</dt><dd>{money(sale.gross_minor, sale.currency)}</dd><small>{money(sale.platform_fees_minor, sale.currency)} platform fees</small></div>)}
      </dl>
      <section className="payment-history" aria-labelledby="payment-history-title">
        <div className="admin-section-heading"><h2 id="payment-history-title">Orders and attendees</h2><span>Latest {payments.length} records, up to 100</span></div>
        {loading ? <p className="admin-message">Loading payment records…</p> : error ? <p className="admin-message admin-error" role="alert">{error}</p> : payments.length ? (
          <div className="admin-table-wrap"><table className="admin-table payment-table"><thead><tr><th scope="col">Buyer</th><th scope="col">Ticket</th><th scope="col">Qty</th><th scope="col">Paid</th><th scope="col">Fee</th><th scope="col">Status</th><th scope="col">Payment date</th></tr></thead><tbody>
            {payments.map((payment) => <tr key={payment.id}>
              <td><strong>{payment.buyer_name}</strong><a href={`mailto:${payment.buyer_email}`}>{payment.buyer_email}</a></td>
              <td>{payment.ticket_type ?? 'Ticket'}</td><td>{payment.quantity}</td>
              <td>{money(payment.amount_minor, payment.currency)}<small>{payment.provider}</small></td>
              <td>{money(payment.platform_fee_minor, payment.currency)}</td>
              <td><span className={`payment-status payment-status-${payment.status.toLowerCase()}`}>{payment.status}</span></td>
              <td>{new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(payment.paid_at ?? payment.created_at))}</td>
            </tr>)}
          </tbody></table></div>
        ) : <div className="payment-empty"><h2>No payment records yet.</h2><p>Buyer details and order status will appear here after the payment provider confirms checkout.</p></div>}
      </section>
    </section>
  );
}

function OrganizerOverview({ tenant, events, onEvents, onCreate, onPayments }: { tenant: Tenant; events: Event[]; onEvents: () => void; onCreate: () => void; onPayments: (event: Event) => void }) {
  const published = events.filter((event) => event.status === 'PUBLISHED').length;
  const paidOrders = events.reduce((sum, event) => sum + Number(event.paid_orders ?? 0), 0);
  const sales = aggregateSales(events);
  return (
    <section className="overview-page">
      <div className="dashboard-heading"><div><h1>{tenant.name}</h1><p>Your events, links, and payment activity in one place.</p></div><button className="button button-primary" type="button" onClick={onCreate}><Icon name="plus" size={17}/>Create event</button></div>
      <dl className="overview-metrics"><div><dt>Total events</dt><dd>{events.length}</dd></div><div><dt>Published</dt><dd>{published}</dd></div><div><dt>Paid orders</dt><dd>{paidOrders}</dd></div><div><dt>Gross sales</dt><dd>{sales.length ? sales.map((sale) => <span key={sale.currency}>{money(sale.gross_minor, sale.currency)}</span>) : '—'}</dd></div></dl>
      <section className="overview-events" aria-labelledby="overview-events-title"><div className="section-heading"><h2 id="overview-events-title">Your events</h2><button className="text-action" type="button" onClick={onEvents}>All events <Icon name="arrow" size={15}/></button></div>
        {events.length ? <div className="overview-event-list">{events.slice(0, 5).map((event) => <article key={event.id}><span className={`overview-event-indicator status-${event.status.toLowerCase()}`}/><div><strong>{event.title}</strong><small>{formatEventDate(event.starts_at)}{event.venue ? ` · ${event.venue}` : ''}</small></div><span className="overview-event-sales">{Number(event.paid_orders ?? 0)} paid</span><button className="text-action" type="button" onClick={() => onPayments(event)}>Payments</button></article>)}</div> : <div className="overview-empty"><p>No events yet. Create the first one to start building your project.</p><button className="button button-dark button-small" type="button" onClick={onEvents}>Open events</button></div>}
      </section>
    </section>
  );
}

function PaymentsOverview({ tenant, events, onView }: { tenant: Tenant; events: Event[]; onView: (event: Event) => void }) {
  const sales = aggregateSales(events);
  const paidOrders = events.reduce((sum, event) => sum + Number(event.paid_orders ?? 0), 0);
  return (
    <section className="payments-overview">
      <div className="dashboard-heading"><div><h1>Payments</h1><p>Confirmed orders and attendee details, organized by event in {tenant.name}.</p></div></div>
      <dl className="overview-metrics"><div><dt>Paid orders</dt><dd>{paidOrders}</dd></div>{sales.length ? sales.map((sale) => <div key={sale.currency}><dt>Gross · {sale.currency}</dt><dd>{money(sale.gross_minor, sale.currency)}</dd><small>{money(sale.platform_fees_minor, sale.currency)} Gatepass fees</small></div>) : <div><dt>Gross sales</dt><dd>—</dd></div>}</dl>
      <section className="event-section" aria-labelledby="payments-events-title"><div className="section-heading"><h2 id="payments-events-title">Payments by event</h2><span className="event-total">{events.length} events</span></div>
        {events.length ? <div className="payment-event-list">{events.map((event) => <article key={event.id}><div><strong>{event.title}</strong><small>{event.status === 'PUBLISHED' ? 'Published' : 'Draft'} · {formatEventDate(event.starts_at)}</small></div><span className="payment-event-count">{Number(event.paid_orders ?? 0)} paid orders</span><div className="payment-event-totals">{event.sales_by_currency?.length ? event.sales_by_currency.map((sale) => <span key={sale.currency}>{money(sale.gross_minor, sale.currency)} gross <small>· {money(sale.platform_fees_minor, sale.currency)} fee</small></span>) : <span>No confirmed payments</span>}</div><button className="button button-outline button-small" type="button" onClick={() => onView(event)}>View attendees</button></article>)}</div> : <p className="admin-message">Create an event to see its orders here.</p>}
      </section>
      {!paidOrders && <p className="dashboard-footnote">No example sales are shown. Confirmed payment and buyer details appear after the provider connection is configured.</p>}
    </section>
  );
}

function aggregateSales(events: Event[]) {
  const totals = new Map<string, { currency: string; gross_minor: number; platform_fees_minor: number }>();
  for (const event of events) for (const sale of event.sales_by_currency ?? []) {
    const current = totals.get(sale.currency) ?? { currency: sale.currency, gross_minor: 0, platform_fees_minor: 0 };
    current.gross_minor += Number(sale.gross_minor);
    current.platform_fees_minor += Number(sale.platform_fees_minor);
    totals.set(sale.currency, current);
  }
  return [...totals.values()];
}

function EventEditor({ busy, onCancel, onSave }: { busy: boolean; onCancel: () => void; onSave: (input: EventInput) => Promise<void> }) {
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [slugEdited, setSlugEdited] = useState(false);
  const [startsAt, setStartsAt] = useState('');
  const [venue, setVenue] = useState('');
  const [description, setDescription] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [galleryText, setGalleryText] = useState('');
  const [eventProgram, setEventProgram] = useState('');
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [tickets, setTickets] = useState<TicketDraft[]>([newTicket()]);
  const [localError, setLocalError] = useState('');

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLocalError('');
    for (const ticket of tickets) {
      if (!/^\d+(\.\d{1,2})?$/.test(ticket.price)) {
        setLocalError('Enter each ticket price with up to two decimal places.');
        return;
      }
      if (!Number.isInteger(Number(ticket.quantity)) || Number(ticket.quantity) < 1) {
        setLocalError('Each ticket type needs at least one available ticket.');
        return;
      }
    }
    const galleryUrls = galleryText.split(/\r?\n/).map((url) => url.trim()).filter(Boolean);
    const imageUrls = [coverImageUrl.trim(), ...galleryUrls].filter(Boolean);
    if (galleryUrls.length > 8 || imageUrls.some((url) => {
      try { return new URL(url).protocol !== 'https:'; } catch { return true; }
    })) {
      setLocalError('Add up to eight gallery images using publicly accessible HTTPS image links.');
      return;
    }
    void onSave({
      title: title.trim(),
      slug: slugify(slug),
      startsAt: new Date(startsAt).toISOString(),
      venue: venue.trim() || null,
      description: description.trim() || null,
      coverImageUrl: coverImageUrl.trim() || null,
      galleryUrls,
      eventProgram: eventProgram.trim() || null,
      additionalInfo: additionalInfo.trim() || null,
      contactEmail: contactEmail.trim() || null,
      ticketTypes: tickets.map((ticket) => ({
        name: ticket.name.trim(),
        priceMinor: Math.round(Number(ticket.price) * 100),
        currency: ticket.currency,
        quantity: Number(ticket.quantity),
      })),
    });
  }

  function updateTicket(id: string, key: keyof Omit<TicketDraft, 'id'>, value: string) {
    setTickets((current) => current.map((ticket) => ticket.id === id ? { ...ticket, [key]: value } : ticket));
  }

  return (
    <section className="editor-page">
      <div className="editor-heading">
        <div><button className="back-link" type="button" onClick={onCancel}>Back to events</button><h1>Create an event.</h1><p>Start with the details guests need. You can publish the link when it’s ready.</p></div>
      </div>
      <form className="event-form" onSubmit={submit}>
        <section className="form-section">
          <h2>Event details</h2>
          <div className="fields-grid">
            <label className="field field-full"><span>Event name</span><input value={title} onChange={(event) => { setTitle(event.target.value); if (!slugEdited) setSlug(slugify(event.target.value)); }} minLength={3} maxLength={140} placeholder="What are you hosting?" required/></label>
            <label className="field"><span>Public link name</span><div className="slug-field"><span>…/events/</span><input value={slug} onChange={(event) => { setSlugEdited(true); setSlug(event.target.value); }} minLength={3} maxLength={100} pattern="[a-z0-9]+(?:-[a-z0-9]+)*" required/></div></label>
            <label className="field"><span>Starts on</span><input type="datetime-local" value={startsAt} onChange={(event) => setStartsAt(event.target.value)} required/></label>
            <label className="field field-full"><span>Location <small>(optional)</small></span><input value={venue} onChange={(event) => setVenue(event.target.value)} maxLength={180} placeholder="Venue or online event"/></label>
            <label className="field field-full"><span>About this event <small>(optional)</small></span><textarea value={description} onChange={(event) => setDescription(event.target.value)} maxLength={5000} rows={4} placeholder="Share a few details with your guests."/></label>
            <label className="field field-full"><span>Cover image URL <small>(optional)</small></span><input type="url" inputMode="url" value={coverImageUrl} onChange={(event) => setCoverImageUrl(event.target.value)} maxLength={2048} placeholder="https://…"/><small>Use a publicly accessible HTTPS image link.</small></label>
            {coverImageUrl.trim() && <div className="event-image-preview field-full"><Image src={coverImageUrl.trim()} alt="Event cover preview" width={1000} height={360} unoptimized/><span>Cover preview</span></div>}
            <label className="field field-full"><span>Gallery image URLs <small>(optional, one per line)</small></span><textarea value={galleryText} onChange={(event) => setGalleryText(event.target.value)} maxLength={16000} rows={3} placeholder={'https://…\nhttps://…'}/><small>Up to eight more images. Image hosting and uploads can be connected later.</small></label>
            <label className="field field-full"><span>Schedule or program <small>(optional)</small></span><textarea value={eventProgram} onChange={(event) => setEventProgram(event.target.value)} maxLength={5000} rows={4} placeholder="Doors open at 5:30 PM…"/></label>
            <label className="field field-full"><span>Additional information <small>(optional)</small></span><textarea value={additionalInfo} onChange={(event) => setAdditionalInfo(event.target.value)} maxLength={5000} rows={4} placeholder="Accessibility, age limits, what to bring, or other guest information."/></label>
            <label className="field"><span>Contact email <small>(optional)</small></span><input type="email" autoComplete="email" value={contactEmail} onChange={(event) => setContactEmail(event.target.value)} maxLength={254} placeholder="events@example.com"/></label>
          </div>
        </section>

        <section className="form-section ticket-section">
          <div className="form-section-heading"><div><h2>Ticket types</h2><p>Set the price and number available for each type.</p></div><button className="button button-outline button-small" type="button" onClick={() => setTickets((current) => [...current, { ...newTicket(), name: '' }])}><Icon name="plus" size={15}/>Add ticket type</button></div>
          <div className="ticket-editor-list">
            {tickets.map((ticket, index) => (
              <div className="ticket-editor-row" key={ticket.id}>
                <label className="field ticket-name"><span>Ticket name</span><input value={ticket.name} onChange={(event) => updateTicket(ticket.id, 'name', event.target.value)} minLength={2} maxLength={80} placeholder="General admission" required/></label>
                <label className="field ticket-price"><span>Price</span><div className="price-field"><select aria-label="Currency" value={ticket.currency} onChange={(event) => updateTicket(ticket.id, 'currency', event.target.value)}><option>NGN</option><option>GHS</option><option>KES</option><option>USD</option><option>GBP</option></select><input type="number" value={ticket.price} onChange={(event) => updateTicket(ticket.id, 'price', event.target.value)} min="0" step="0.01" placeholder="0.00" required/></div></label>
                <label className="field ticket-quantity"><span>Available</span><input type="number" value={ticket.quantity} onChange={(event) => updateTicket(ticket.id, 'quantity', event.target.value)} min="1" max="1000000" step="1" required/></label>
                {tickets.length > 1 && <button className="icon-button remove-ticket" type="button" onClick={() => setTickets((current) => current.filter((item) => item.id !== ticket.id))} aria-label={`Remove ticket type ${index + 1}`}><Icon name="close" size={17}/></button>}
              </div>
            ))}
          </div>
        </section>
        {localError && <p className="form-error" role="alert">{localError}</p>}
        <div className="editor-actions"><button className="quiet-button" type="button" onClick={onCancel}>Cancel</button><button className="button button-dark" type="submit" disabled={busy}>{busy ? 'Saving draft…' : 'Save draft'}<Icon name="arrow" size={16}/></button></div>
      </form>
    </section>
  );
}

function EventSkeleton() {
  return <div className="event-skeleton" aria-label="Loading events"><span/><span/><span/></div>;
}

function slugify(value: string) {
  return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80);
}

function formatEventDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Date to be confirmed' : new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}
