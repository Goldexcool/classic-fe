import Link from 'next/link';
import Logo from '@/components/Logo';

export function MarketingHeader() {
  return (
    <header className="landing-header">
      <Link href="/" aria-label="Gatepass home"><Logo/></Link>
      <nav aria-label="Main navigation"><Link href="/how-it-works">How it works</Link><Link href="/pricing">Pricing</Link></nav>
      <div><Link className="landing-signin" href="/dashboard">Sign in</Link><Link className="button button-dark button-small" href="/dashboard">Create an event</Link></div>
    </header>
  );
}

export function MarketingFooter() {
  return <footer className="landing-footer"><Link href="/"><Logo compact/></Link><span>Gatepass charges a 3% platform fee on paid orders. Payment checkout appears after provider settings are connected.</span></footer>;
}
