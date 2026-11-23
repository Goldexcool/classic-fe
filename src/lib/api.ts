export const API_BASE = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api').replace(/\/$/, '');

export type User = { id: string; fullName: string; email: string; isAdmin?: boolean };
export type Session = { accessToken: string; user: User };
export type Tenant = { id: string; name: string; slug: string; role: string };
export type TicketType = {
  id: string;
  name: string;
  price_minor: string | number;
  currency: string;
  quantity: number;
  sold_count?: number;
};
export type Event = {
  id: string;
  tenant_id?: string;
  tenant_name?: string;
  tenant_slug?: string;
  title: string;
  slug: string;
  description?: string | null;
  venue?: string | null;
  starts_at: string;
  cover_image_url?: string | null;
  gallery_urls?: string[];
  event_program?: string | null;
  additional_info?: string | null;
  contact_email?: string | null;
  paid_orders?: number;
  sales_by_currency?: { currency: string; gross_minor: string | number; platform_fees_minor: string | number }[];
  status: 'DRAFT' | 'PUBLISHED';
  ticketTypes?: TicketType[];
};
export type PaymentRecord = {
  id: string;
  buyer_name: string;
  buyer_email: string;
  ticket_type: string | null;
  quantity: number;
  amount_minor: string | number;
  platform_fee_minor: string | number;
  currency: string;
  provider: string;
  status: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
  created_at: string;
  paid_at: string | null;
};

export type EventInput = {
  title: string;
  slug: string;
  startsAt: string;
  venue: string | null;
  description: string | null;
  coverImageUrl: string | null;
  galleryUrls: string[];
  eventProgram: string | null;
  additionalInfo: string | null;
  contactEmail: string | null;
  ticketTypes: { name: string; priceMinor: number; currency: string; quantity: number }[];
};

export async function apiRequest<T>(path: string, options: RequestInit & { token?: string } = {}): Promise<T> {
  const { token, headers: suppliedHeaders, ...init } = options;
  const headers = new Headers(suppliedHeaders);
  const isFormData = typeof FormData !== 'undefined' && init.body instanceof FormData;
  if (init.body && !isFormData && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);

  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, { ...init, headers, cache: 'no-store' });
  } catch {
    throw new Error('Can’t reach the Gatepass API. Check that the backend is running and its URL is configured.');
  }

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const message = payload?.message;
    throw new Error(Array.isArray(message) ? message.join(' ') : message ?? 'Request failed. Please try again.');
  }
  return payload as T;
}

export function money(minor: string | number, currency: string) {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency, maximumFractionDigits: 2 }).format(Number(minor) / 100);
}

export function eventHref(tenantSlug: string, eventSlug: string) {
  return `/${encodeURIComponent(tenantSlug)}/events/${encodeURIComponent(eventSlug)}`;
}
