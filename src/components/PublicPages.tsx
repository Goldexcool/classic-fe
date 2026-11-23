'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import Logo from '@/components/Logo';
import { apiRequest, Event, eventHref, money } from '@/lib/api';

type TenantPage = { id: string; name: string; slug: string; events: Event[] };
type LoadState<T> = { value: T | null; error: string; loading: boolean };

export function TenantEventsPage({ tenantSlug }: { tenantSlug: string }) {
  const [state, setState] = useState<LoadState<TenantPage>>({ value: null, error: '', loading: true });

  useEffect(() => {
    apiRequest<TenantPage>(`/public/${encodeURIComponent(tenantSlug)}/events`)
      .then((value) => setState({ value, error: '', loading: false }))
      .catch((error: Error) => setState({ value: null, error: error.message, loading: false }));
  }, [tenantSlug]);

  return (
    <main className="public-page">
      <header className="public-header"><Link href="/" aria-label="Gatepass home"><Logo/></Link><span>Events by {state.value?.name ?? 'your organizer'}</span></header>
      <section className="public-content">
        <h1>{state.value?.name ?? 'Events and gatherings.'}</h1>
        <p className="public-lede">Find the details and ticket information for upcoming events.</p>
        {state.loading ? <p className="public-message">Loading events…</p> : state.error ? <p className="public-message public-error" role="alert">{state.error}</p> : state.value?.events.length ? (
          <div className="public-event-list">
            {state.value.events.map((event) => (
              <Link className="public-event-row" href={eventHref(tenantSlug, event.slug)} key={event.id}>
                <span className="public-event-thumb-wrap">{event.cover_image_url && <Image className="public-event-thumb" src={event.cover_image_url} alt="" width={160} height={104} unoptimized/>}</span>
                <span className="public-event-date">{new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(new Date(event.starts_at))}</span>
                <span className="public-event-info"><strong>{event.title}</strong><small>{event.venue || 'Location details on event page'}</small></span>
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
              </Link>
            ))}
          </div>
        ) : <div className="public-empty"><h2>Nothing published yet.</h2><p>Check back here for this organizer’s next event.</p></div>}
      </section>
      <footer className="public-footer"><Logo compact/><span>Event pages by Gatepass</span></footer>
    </main>
  );
}

export default function PublicEventPage({ tenantSlug, eventSlug }: { tenantSlug: string; eventSlug: string }) {
  const [state, setState] = useState<LoadState<Event>>({ value: null, error: '', loading: true });

  useEffect(() => {
    apiRequest<Event>(`/public/${encodeURIComponent(tenantSlug)}/events/${encodeURIComponent(eventSlug)}`)
      .then((value) => setState({ value, error: '', loading: false }))
      .catch((error: Error) => setState({ value: null, error: error.message, loading: false }));
  }, [tenantSlug, eventSlug]);

  const event = state.value;
  return (
    <main className="public-page">
      <header className="public-header"><Link href={`/${encodeURIComponent(tenantSlug)}/events`} aria-label="Back to organizer events"><Logo/></Link><span>{event?.tenant_name ?? 'Event details'}</span></header>
      <section className="public-event-detail">
        {state.loading ? <p className="public-message">Loading event…</p> : state.error ? <div className="public-message public-error" role="alert"><h1>We couldn’t find this event.</h1><p>{state.error}</p><Link className="text-link" href={`/${encodeURIComponent(tenantSlug)}/events`}>View this organizer’s events</Link></div> : event ? (
          <>
            <Link className="back-link public-back" href={`/${encodeURIComponent(tenantSlug)}/events`}>All events</Link>
            {event.cover_image_url && <Image className="public-event-cover" src={event.cover_image_url} alt={`${event.title} cover`} width={1600} height={760} priority unoptimized/>}
            <h1>{event.title}</h1>
            <div className="public-event-meta"><span>{new Intl.DateTimeFormat(undefined, { dateStyle: 'full', timeStyle: 'short' }).format(new Date(event.starts_at))}</span>{event.venue && <span>{event.venue}</span>}</div>
            <div className="public-event-layout">
              <article className="public-event-story">
                {event.description && <section className="public-story-section"><h2>About this event</h2><p className="public-event-description">{event.description}</p></section>}
                {event.event_program && <section className="public-story-section"><h2>Schedule</h2><p className="public-event-description">{event.event_program}</p></section>}
                {event.additional_info && <section className="public-story-section"><h2>Before you go</h2><p className="public-event-description">{event.additional_info}</p></section>}
                {event.gallery_urls?.length ? <section className="public-story-section"><h2>Event gallery</h2><div className="public-gallery">{event.gallery_urls.map((url, index) => <Image key={url} src={url} alt={`${event.title} gallery image ${index + 1}`} width={800} height={560} unoptimized/>)}</div></section> : null}
                {event.contact_email && <p className="public-contact">Questions? <a href={`mailto:${encodeURIComponent(event.contact_email)}`}>{event.contact_email}</a></p>}
              </article>
              <section className="public-tickets" aria-labelledby="ticket-heading">
                <div className="public-ticket-title"><h2 id="ticket-heading">Tickets</h2><span>Choose what works for you</span></div>
                {event.ticketTypes?.map((ticket) => (
                  <div className="public-ticket-row" key={ticket.id}>
                    <span><strong>{ticket.name}</strong><small>{Math.max(ticket.quantity - (ticket.sold_count ?? 0), 0)} available</small></span>
                    <strong>{money(ticket.price_minor, ticket.currency)}</strong>
                  </div>
                ))}
                <button className="button button-dark button-wide checkout-button" type="button" disabled>Continue to checkout</button>
                <p className="checkout-note">Checkout opens after payment settings are added. Gatepass’s platform fee is 3% per paid order.</p>
              </section>
            </div>
          </>
        ) : null}
      </section>
      <footer className="public-footer"><Logo compact/><span>Event pages by Gatepass</span></footer>
    </main>
  );
}
