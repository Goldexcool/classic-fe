import type { Metadata } from 'next';
import Link from 'next/link';
import { MarketingFooter, MarketingHeader } from '@/components/MarketingChrome';

export const metadata: Metadata = {
  title: 'Pricing',
  description: 'Gatepass platform pricing: a 3% fee per paid order.',
};

export default function PricingPage() {
  return (
    <main className="marketing-page">
      <MarketingHeader/>
      <section className="pricing-hero">
        <div><h1>One clear fee on paid orders.</h1><p>Gatepass’s platform fee is 3% per paid order. Organizers set ticket prices and choose the ticket types that fit their event.</p></div>
        <div className="pricing-rate"><strong>3%</strong><span>per paid order</span><small>Applied to the order amount</small></div>
      </section>
      <section className="pricing-example">
        <div><h2>A simple example.</h2><p>For a single NGN 5,000 ticket order, the Gatepass platform fee would be NGN 150.</p></div>
        <dl><div><dt>Ticket order</dt><dd>NGN 5,000</dd></div><div><dt>Gatepass fee · 3%</dt><dd>NGN 150</dd></div></dl>
      </section>
      <section className="pricing-note"><h2>Before you open sales.</h2><p>Live checkout is not connected yet. Payment provider processing fees and settlement terms depend on the provider account you configure. We’ll show payment records and attendee details in the dashboard after confirmed checkouts are flowing.</p><Link className="button button-dark" href="/dashboard">Create an event</Link></section>
      <MarketingFooter/>
    </main>
  );
}
