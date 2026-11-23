import PublicEventPage from '@/components/PublicPages';

export default async function PublicEventRoute({ params }: { params: Promise<{ tenantSlug: string; eventSlug: string }> }) {
  const { tenantSlug, eventSlug } = await params;
  return <PublicEventPage tenantSlug={tenantSlug} eventSlug={eventSlug}/>;
}
