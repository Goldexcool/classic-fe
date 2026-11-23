import { TenantEventsPage } from '@/components/PublicPages';

export default async function TenantEventsRoute({ params }: { params: Promise<{ tenantSlug: string }> }) {
  const { tenantSlug } = await params;
  return <TenantEventsPage tenantSlug={tenantSlug}/>;
}
