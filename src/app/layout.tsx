import type { Metadata } from 'next';
import { Poppins } from 'next/font/google';
import './globals.css';

const poppins = Poppins({ weight: ['400', '500', '600', '700'], variable: '--font-poppins', subsets: ['latin'], display: 'swap' });
const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3001').replace(/\/$/, '');

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: 'Gatepass — Events made easy to share', template: '%s · Gatepass' },
  description: 'Create an event, set up ticket types, and share one clear link with your audience.',
  applicationName: 'Gatepass',
  alternates: { canonical: '/' },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={poppins.variable}>
      <body>{children}</body>
    </html>
  );
}
