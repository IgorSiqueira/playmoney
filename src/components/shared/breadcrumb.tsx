"use client";

import Link from "next/link";
import { useEffect } from "react";
import { ChevronRight } from "lucide-react";

interface Crumb {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  crumbs: Crumb[];
  pageTitle?: string;
}

export function Breadcrumb({ crumbs, pageTitle }: BreadcrumbProps) {
  useEffect(() => {
    if (pageTitle) {
      document.title = `${pageTitle} | PlayMoney`;
    }
  }, [pageTitle]);

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1 mb-6">
      {crumbs.map((crumb, i) => (
        <span key={i} className="flex items-center gap-1">
          {i > 0 && (
            <ChevronRight size={11} className="text-[var(--text-muted)] opacity-50" />
          )}
          {crumb.href ? (
            <Link
              href={crumb.href}
              className="font-ui text-[12px] text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
            >
              {crumb.label}
            </Link>
          ) : (
            <span className="font-ui text-[12px] text-[var(--text-secondary)] font-semibold">
              {crumb.label}
            </span>
          )}
        </span>
      ))}
    </nav>
  );
}
