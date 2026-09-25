import Link from "next/link";

/** Logo: a roof line under a lens, on the document-blue tile. */
export function BrandMark({ className = "size-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <rect width="32" height="32" rx="8" fill="var(--accent)" />
      <path d="M7 17.5 16 10l9 7.5" fill="none" stroke="var(--on-accent)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="16" cy="19.5" r="4.2" fill="none" stroke="var(--on-accent)" strokeWidth="2.2" />
      <path d="m19 22.5 3 3" stroke="var(--on-accent)" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

export function Brand({ href }: { href: string }) {
  return (
    <Link href={href} className="flex items-center gap-2.5 rounded-lg" aria-label="GermanyRealEstateLens">
      <BrandMark />
      <span className="font-display text-[15px] leading-none font-bold tracking-tight">
        GermanyRealEstate<span className="text-accent">Lens</span>
      </span>
    </Link>
  );
}
