import Link from 'next/link';
import Image from 'next/image';
import Logo from '@/components/Logo';
import { MarketingFooter, MarketingHeader } from '@/components/MarketingChrome';

function ArrowMark() {
  return <svg className="landing-arrow" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M5 15 15 5M6 5h9v9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>;
}

export default function Home() {
  return (
    <main className="landing-page">
      <MarketingHeader/>

      <section className="landing-hero">
        <div className="landing-copy">
          <h1>Give your next event <em>one place to live.</em></h1>
          <p>Build an event page with the details guests need, set up ticket types, and share one clear link.</p>
          <div className="landing-actions"><Link className="button button-dark" href="/dashboard">Start organizing <ArrowMark/></Link><Link className="landing-secondary" href="#how-it-works">See how it works</Link></div>
          <p className="landing-promise">One project for your events · One page for each occasion</p>
        </div>
        <div className="landing-preview" aria-label="Illustration of a Gatepass event page">
          <div className="landing-preview-top"><Logo compact/><span>EVENT PAGE PREVIEW</span></div>
          <div className="preview-cover"><Image src="/gatepass-event-hero.jpg" alt="Guests arriving at an outdoor event in Lagos" fill priority sizes="(max-width: 760px) 100vw, 46vw"/><span className="preview-cover-shade"/><span className="preview-cover-label">Your gathering, beautifully told.</span></div>
          <div className="preview-body"><span className="preview-date">SATURDAY · 6:30 PM</span><h2>Your next gathering</h2><p>All the details, in one easy-to-share place.</p><div className="preview-ticket"><span><strong>General admission</strong><small>Ticket details at a glance</small></span><b>View tickets</b></div></div>
          <div className="preview-share"><span>gatepass.usevoii.com/your-event</span><ArrowMark/></div>
        </div>
      </section>

      <section className="landing-details" id="organizer-tools">
        <div><h2>Everything guests need to decide.</h2><p>Give every event room for a description, images, schedule, venue, contact details, and ticket options.</p></div>
        <ul><li>Event details and image gallery</li><li>Multiple ticket types and prices</li><li>A page you can share anywhere</li><li>Payment and attendee records in your dashboard when checkout is connected</li></ul>
      </section>

      <section className="landing-workspace">
        <div className="landing-workspace-copy"><h2>Your events, in view.</h2><p>Keep every event under its project and check orders, attendee details, and event status from one organizer dashboard.</p><Link className="text-link" href="/how-it-works">See how Gatepass works <ArrowMark/></Link></div>
        <div className="workspace-preview">
          <div className="workspace-preview-top"><span>GATEPASS DEMO · EVENTS</span><span>Example view</span></div>
          <h3>Events in your project</h3>
          <div className="workspace-preview-row"><span className="workspace-preview-date">PAGE</span><span><strong>Creative Futures Summit</strong><small>Eko Atlantic · Published</small></span><b>View</b></div>
          <div className="workspace-preview-row"><span className="workspace-preview-date">PAGE</span><span><strong>Founders and Builders</strong><small>Lekki · Published</small></span><b>View</b></div>
          <div className="workspace-preview-row"><span className="workspace-preview-date">PAGE</span><span><strong>Community Design Evening</strong><small>Lagos Island · Draft</small></span><b>Edit</b></div>
          <p>Order and payment figures appear when a payment provider is connected.</p>
        </div>
      </section>

      <section className="landing-steps" id="how-it-works">
        <div className="landing-section-heading"><h2>From idea to shared link.</h2><p>Keep your setup simple and your event information together.</p></div>
        <div className="landing-step-list">
          <article><span>01</span><div><h3>Create a project</h3><p>Give your organizing team a home for multiple events.</p></div></article>
          <article><span>02</span><div><h3>Build an event page</h3><p>Add the story, schedule, images, location, and tickets.</p></div></article>
          <article><span>03</span><div><h3>Share it with guests</h3><p>Publish one page and monitor event activity from your dashboard.</p></div></article>
        </div>
      </section>

      <section className="landing-close">
        <div><h2>Make room for the good part.</h2><p>Start with the event. Add the details as you go.</p></div>
        <Link className="button button-dark" href="/dashboard">Create your first event <ArrowMark/></Link>
      </section>
      <MarketingFooter/>
    </main>
  );
}
