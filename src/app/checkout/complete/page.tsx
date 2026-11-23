import CheckoutStatus from '@/components/CheckoutStatus';

export default async function CheckoutCompletePage({ searchParams }: { searchParams: Promise<{ paymentId?: string | string[] }> }) {
  const params = await searchParams;
  const paymentId = Array.isArray(params.paymentId) ? params.paymentId[0] : params.paymentId;
  if (!paymentId) {
    return <main className="checkout-result-page"><section className="checkout-result-card"><p className="eyebrow">Ticket order</p><h1>Order not found.</h1><p className="checkout-result-copy">Return to the event and start checkout again.</p></section></main>;
  }
  return <CheckoutStatus paymentId={paymentId}/>;
}
