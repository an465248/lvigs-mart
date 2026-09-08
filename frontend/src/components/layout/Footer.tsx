"use client";

import React from "react";
import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { BRAND } from "@/lib/brand";

const columns = [
  {
    title: "Shop",
    links: [
      { href: "/category/mobiles", label: "Mobiles" },
      { href: "/category/electronics", label: "Electronics" },
      { href: "/category/fashion", label: "Fashion" },
      { href: "/category/grocery", label: "Grocery" },
      { href: "/category/beauty", label: "Beauty" },
    ],
  },
  {
    title: "Help",
    links: [
      { href: "/orders", label: "Track Order" },
      { href: "/help", label: "Help Center" },
      { href: "/help#returns", label: "Returns" },
      { href: "/help#shipping", label: "Shipping Info" },
      { href: "/help#contact", label: "Contact Support" },
    ],
  },
  {
    title: "Business",
    links: [
      { href: "/seller", label: "Sell on LVIGS" },
      { href: "/admin", label: "Admin Portal" },
      { href: "/affiliate", label: "Affiliate" },
      { href: "/advertise", label: "Advertise" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/about", label: "About Us" },
      { href: "/careers", label: "Careers" },
      { href: "/press", label: "Press" },
      { href: "/privacy", label: "Privacy" },
      { href: "/terms", label: "Terms" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="mt-16 border-t border-ink-100 bg-ink-50 dark:border-ink-800 dark:bg-ink-900">
      <div className="container-page py-12">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-5">
          <div className="col-span-2 md:col-span-1">
            <Logo />
            <p className="mt-3 text-sm text-ink-500 dark:text-ink-400 max-w-xs">
              {BRAND.tagline}. Discover genuine products from verified sellers across India.
            </p>
            <div className="mt-4 flex items-center gap-3">
              <a href={BRAND.socials.twitter} aria-label="Twitter" className="rounded-full p-2 hover:bg-white dark:hover:bg-ink-800">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M22 5.8c-.7.3-1.5.5-2.4.6.9-.5 1.5-1.4 1.8-2.4-.8.5-1.7.8-2.7 1A4.3 4.3 0 0 0 11.6 9c0 .3 0 .6.1.9C7.9 9.7 4.5 8 2.3 5.4c-.4.7-.6 1.4-.6 2.3 0 1.5.8 2.8 2 3.6-.7 0-1.4-.2-2-.5v.1c0 2.1 1.5 3.9 3.5 4.3-.4.1-.8.2-1.2.2-.3 0-.6 0-.9-.1.6 1.8 2.3 3.1 4.3 3.2-1.6 1.2-3.5 2-5.6 2H1c2 1.3 4.4 2.1 6.9 2.1 8.3 0 12.8-6.9 12.8-12.8v-.6c.9-.6 1.6-1.4 2.3-2.3z"/></svg>
              </a>
              <a href={BRAND.socials.instagram} aria-label="Instagram" className="rounded-full p-2 hover:bg-white dark:hover:bg-ink-800">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor"/></svg>
              </a>
              <a href={BRAND.socials.youtube} aria-label="YouTube" className="rounded-full p-2 hover:bg-white dark:hover:bg-ink-800">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M23 7s-.2-1.6-.9-2.3c-.8-.9-1.8-.9-2.2-1C16.7 3.5 12 3.5 12 3.5s-4.7 0-7.9.2c-.4.1-1.4.1-2.2 1C1.2 5.4 1 7 1 7S.7 8.9.7 10.8v1.7c0 1.9.3 3.8.3 3.8s.2 1.6.9 2.3c.8.9 1.9.9 2.4 1 1.7.2 7.7.2 7.7.2s4.7 0 7.9-.2c.4-.1 1.4-.1 2.2-1 .7-.7.9-2.3.9-2.3s.3-1.9.3-3.8v-1.7C23.3 8.9 23 7 23 7zm-13.4 7.3V8.4l5.9 2.9-5.9 3z"/></svg>
              </a>
            </div>
          </div>
          {columns.map((col) => (
            <div key={col.title}>
              <h4 className="text-sm font-semibold text-ink-900 dark:text-white">{col.title}</h4>
              <ul className="mt-3 space-y-2">
                {col.links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="text-sm text-ink-600 hover:text-brand-600 dark:text-ink-400 dark:hover:text-brand-300">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-10 flex flex-col gap-3 border-t border-ink-200 pt-6 text-xs text-ink-500 dark:border-ink-700 dark:text-ink-400 md:flex-row md:items-center md:justify-between">
          <div>© {new Date().getFullYear()} {BRAND.legalName}. All rights reserved.</div>
          <div className="flex items-center gap-3">
            <span>🇮🇳 India</span>
            <span>·</span>
            <span>English</span>
            <span>·</span>
            <span>INR</span>
          </div>
        </div>
      </div>
    </footer>
  );
}