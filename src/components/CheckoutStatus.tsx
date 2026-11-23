'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import Logo from '@/components/Logo';
import { apiRequest, money } from '@/lib/api';

type PublicPaymentStatus = {
  id: string;
  status: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
  confirmationPending: boolean;
  amountMinor: string | number;
  currency: string;
  quantity: number;
  ticketType: string | null;
  eventTitle: string;
  eventPath: string;
};

export default function CheckoutStatus({ paymentId }: { paymentId: string }) {
  const [payment, setPayment] = useState<PublicPaymentStatus | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    let attempts = 0;

    async function poll() {
      if (cancelled || !paymentId) return;
      try {
        const result = await apiRequest<PublicPaymentStatus>(`/public/payments/${encodeURIComponent(paymentId)}`);
        if (cancelled) return;
        setPayment(result);
        setError('');
        if (result.status === 'PENDING' && result.confirmationPending && attempts < 40) {
          attempts += 1;
          timer = setTimeout(poll, 2500);
        }
      } catch (cause) {
        if (cancelled) return;
        setError(cause instanceof Error ? cause.message : 'We could not load this order.');
      }
    }

    void poll();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [paymentId]);

  return (
    <main className="checkout-result-page">
      <header className="public-header"><Link href="/" aria-label="Gatepass home"><Logo/></Link><span>Ticket order</span></header>
      <section className="checkout-result-card">
        <span className={`checkout-result-icon${payment?.status === 'PAID' ? ' checkout-result-icon-paid' : ''}`} aria-hidden="true">{payment?.status === 'PAID' ? '✓' : '•'}</span>
        {payment?.status === 'PAID' ? (
          <>
            <p className="eyebrow">Payment confirmed</p>
            <h1>Your ticket is secured.</h1>
            <p className="checkout-result-copy">{payment.quantity} {payment.ticketType ?? 'ticket'}{payment.quantity === 1 ? '' : 's'} for {payment.eventTitle}. A receipt will be sent to your checkout email.</p>
            <div className="checkout-result-total"><span>Total paid</span><strong>{money(payment.amountMinor, payment.currency)}</strong></div>
            <Link className="button button-dark button-wide" href={payment.eventPath}>Back to event</Link>
          </>
        ) : payment ? (
          <>
            <p className="eyebrow">Payment received</p>
            <h1>Confirming your ticket.</h1>
            <p className="checkout-result-copy">
              {payment.confirmationPending
                ? 'Bachs is confirming your payment. Keep this page open; your ticket will appear here once the verified payment notice arrives.'
                : 'We’re checking this order with the event organizer. Please do not pay again while it is being reconciled.'}
            </p>
            <div className="checkout-result-total"><span>Order amount</span><strong>{money(payment.amountMinor, payment.currency)}</strong></div>
            <Link className="text-link" href={payment.eventPath}>Return to event</Link>
          </>
        ) : (
          <>
            <p className="eyebrow">Ticket order</p>
            <h1>{error || 'Checking your payment…'}</h1>
            <p className="checkout-result-copy">This page updates after Gatepass receives and verifies the payment confirmation.</p>
          </>
        )}
      </section>
      <footer className="public-footer"><Logo compact/><span>Event pages by Gatepass</span></footer>
    </main>
  );
}
