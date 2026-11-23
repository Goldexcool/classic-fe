import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { MarketingFooter, MarketingHeader } from '@/components/MarketingChrome';

export const metadata: Metadata = {
  title: 'How it works',
  description: 'Create a project, publish event pages, and keep ticket information together with Gatepass.',
};

const steps = [
  { title: 'Create a project', body: 'Set up one organizer space for the events you run. Add another project whenever you need a separate workspace.' },
  { title: 'Build the event page', body: 'Add a cover image and gallery, write the event details, share the schedule and venue, and create ticket types.' },
  { title: 'Publish one clear link', body: 'Review the public page, publish it, and share the event link with your guests.' },
  { title: 'Follow the activity', body: 'See event status and paid-order records by event. Attendee details appear after the payment provider confirms orders.' },
];

export default function HowItWorksPage() {
  return (
    <main className="marketing-page">
      <MarketingHeader/>
      <section className="marketing-hero">
        <div><h1>From project to event link.</h1><p>Gatepass keeps the event story, tickets, and organizer view connected from the first draft to the shared page.</p><Link className="button button-dark" href="/dashboard">Start organizing</Link></div>
        <Image src="/gatepass-event-hero.jpg" alt="Guests at a warm outdoor gathering" width={1440} height={810} priority/>
      </section>
      <section className="marketing-steps">
        <h2>Four steps to a page guests can use.</h2>
        <div>{steps.map((step, index) => <article key={step.title}><span>{String(index + 1).padStart(2, '0')}</span><div><h3>{step.title}</h3><p>{step.body}</p></div></article>)}</div>
      </section>
      <section className="marketing-callout"><h2>Secure checkout, clear records.</h2><p>Guests pay through Bachs-hosted checkout. Gatepass confirms paid orders from verified payment notices and records each order and the 3% platform fee in the organizer dashboard.</p><Link className="text-link" href="/pricing">View the platform fee</Link></section>
      <MarketingFooter/>
    </main>
  );
}
