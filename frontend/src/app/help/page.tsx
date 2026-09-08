"use client";

import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ChevronDown, ChevronUp, Headphones, MessageCircle, Phone, Mail, Search } from "lucide-react";
import { cn } from "@/lib/utils";

const faqs = [
  { q: "How do I track my order?", a: "Go to My Orders and tap on the order you want to track. You will see real-time tracking information including the delivery partner details." },
  { q: "What is the return policy?", a: "Most items can be returned within 7 days of delivery. Go to My Orders, select the order, and tap 'Return' to initiate a return request." },
  { q: "How do I apply a coupon?", a: "Add items to your cart, then go to the cart page. Enter your coupon code in the 'Coupon code' field and tap 'Apply coupon'." },
  { q: "How do I cancel an order?", a: "Go to My Orders, select the order you want to cancel, and tap 'Cancel Order'. You can cancel orders that are in PLACED or CONFIRMED status." },
  { q: "What payment methods are accepted?", a: "We accept UPI (GPay, PhonePe, Paytm), Credit/Debit cards, Net Banking, Wallets, and Cash on Delivery." },
  { q: "How do I change my address?", a: "Go to Settings or proceed to checkout where you can add or edit your delivery address." },
];

export default function HelpPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-dvh bg-ink-50 dark:bg-ink-900">
      <Header />
      <main className="container-page pb-24 pt-4 lg:pb-12">
        <h1 className="text-xl font-bold mb-4">Help Center</h1>

        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { icon: Headphones, label: "Chat support", desc: "24x7 available", color: "bg-brand-50 text-brand-600 dark:bg-brand-950/40 dark:text-brand-300" },
            { icon: Phone, label: "Call us", desc: "+91 80 4567 8900", color: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300" },
            { icon: Mail, label: "Email", desc: "support@lvigs.in", color: "bg-accent-50 text-accent-600 dark:bg-accent-950/40 dark:text-accent-300" },
            { icon: MessageCircle, label: "WhatsApp", desc: "Quick replies", color: "bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-300" },
          ].map((c) => {
            const Icon = c.icon;
            return (
              <button key={c.label} className="card-base flex flex-col items-center gap-2 p-4 transition hover:shadow-card">
                <div className={cn("flex h-12 w-12 items-center justify-center rounded-full", c.color)}><Icon className="h-6 w-6" /></div>
                <span className="font-semibold text-sm">{c.label}</span>
                <span className="text-xs text-ink-500">{c.desc}</span>
              </button>
            );
          })}
        </div>

        <h2 className="mb-3 text-lg font-bold">Frequently Asked Questions</h2>
        <div className="space-y-2">
          {faqs.map((faq, i) => (
            <div key={i} className="card-base overflow-hidden">
              <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="flex w-full items-center justify-between p-4 text-left">
                <span className="font-medium text-sm">{faq.q}</span>
                {openFaq === i ? <ChevronUp className="h-4 w-4 shrink-0 text-ink-500" /> : <ChevronDown className="h-4 w-4 shrink-0 text-ink-500" />}
              </button>
              {openFaq === i && <div className="border-t px-4 py-3 text-sm text-ink-600 dark:border-ink-700 dark:text-ink-300">{faq.a}</div>}
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}