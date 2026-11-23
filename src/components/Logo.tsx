import Image from 'next/image';

export default function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <span className={`wordmark${compact ? ' wordmark-compact' : ''}`} aria-label="Gatepass">
      <span className="brand-mark" aria-hidden="true"><Image className="brand-mark-art" src="/gatepass-mark.png" alt="" width={1254} height={1254}/></span>
      {!compact && <span>gatepass</span>}
    </span>
  );
}
