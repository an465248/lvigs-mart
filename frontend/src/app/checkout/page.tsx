"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useStore } from "@/state/store";
import { mockApi } from "@/lib/api";
import { formatINR } from "@/lib/utils";
import type { Order } from "@/lib/types";
import { MapPin, CreditCard, Banknote, CheckCircle, Package, Loader2, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface PincodeLookupResult {
  pincode: string;
  city: string;
  district: string;
  state: string;
  region: string;
  postOffices: { name: string; area: string; district: string }[];
}

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, cartTotals, coupon, clearCart } = useStore();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(false);
  const [address, setAddress] = useState({
    name: "", mobile: "", pincode: "", line1: "", line2: "",
    landmark: "", city: "", state: "", label: "HOME" as string
  });
  const [paymentMethod, setPaymentMethod] = useState<string>("UPI");
  const [error, setError] = useState("");

  // PIN code auto-fill state
  const [pincodeLookup, setPincodeLookup] = useState<{
    loading: boolean;
    error: string | null;
    success: boolean;
    postOffices: { name: string; area: string; district: string }[];
  }>({ loading: false, error: null, success: false, postOffices: [] });
  const [selectedPostOffice, setSelectedPostOffice] = useState("");
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const lastLookupRef = useRef<string>("");

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  // PIN code lookup function
  const lookupPincode = useCallback(async (pincode: string) => {
    // Prevent duplicate lookups
    if (pincode === lastLookupRef.current) return;
    lastLookupRef.current = pincode;

    setPincodeLookup({ loading: true, error: null, success: false, postOffices: [] });

    try {
      const response = await fetch(`/api/location/pincode/${pincode}`);
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || `PIN code ${pincode} not found`);
      }

      const data: PincodeLookupResult = await response.json();

      // Auto-fill fields
      setAddress(prev => ({
        ...prev,
        city: data.city,
        state: data.state,
      }));

      setPincodeLookup({
        loading: false,
        error: null,
        success: true,
        postOffices: data.postOffices || [],
      });

      // Auto-select first post office
      if (data.postOffices?.length > 0) {
        setSelectedPostOffice(data.postOffices[0].name);
      }
    } catch (err: any) {
      setPincodeLookup({
        loading: false,
        error: err.message || "Failed to lookup PIN code",
        success: false,
        postOffices: [],
      });
    }
  }, []);

  // Handle pincode input change with debounce
  const handlePincodeChange = (value: string) => {
    setAddress(prev => ({ ...prev, pincode: value }));
    setSelectedPostOffice("");
    lastLookupRef.current = "";

    // Clear previous debounce
    if (debounceRef.current) clearTimeout(debounceRef.current);

    // Only lookup when exactly 6 digits starting with 1-9
    if (value.length === 6 && /^[1-9]\d{5}$/.test(value)) {
      debounceRef.current = setTimeout(() => {
        lookupPincode(value);
      }, 400);
    } else {
      setPincodeLookup({ loading: false, error: null, success: false, postOffices: [] });
    }
  };

  const handlePlaceOrder = async () => {
    setLoading(true);
    setError("");
    try {
      const order = await mockApi.placeOrder({ items: cart, address: address as any, paymentMethod: paymentMethod as any, couponCode: coupon });
      router.push(`/orders/${order.id}`);
    } catch (e: any) {
      setError(e.message || "Failed to place order");
    } finally { setLoading(false); }
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-dvh bg-ink-50 dark:bg-ink-900">
        <Header />
        <main className="container-page pb-24 pt-4 text-center">
          <div className="py-20 text-ink-500">Your cart is empty. Add items to checkout.</div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-ink-50 dark:bg-ink-900">
      <Header />
      <main className="container-page pb-24 pt-4 lg:pb-12">
        <div className="mb-6 flex items-center gap-2 text-sm text-ink-500">
          {(["Address", "Payment", "Confirm"] as const).map((s, i) => (
            <span key={s} className={cn("flex items-center gap-1.5", step === i + 1 ? "font-bold text-brand-600" : "")}>
              <span className={cn("flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold", step > i + 1 ? "bg-emerald-500 text-white" : step === i + 1 ? "bg-brand-600 text-white" : "bg-ink-200")}>{i < step ? "✓" : i + 1}</span>
              {s}
              {i < 2 && <span className="mx-1">→</span>}
            </span>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
          <div className="space-y-4">
            {step === 1 && (
              <div className="card-base p-5">
                <h2 className="mb-4 flex items-center gap-2 font-bold"><MapPin className="h-5 w-5 text-brand-500" /> Delivery Address</h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input placeholder="Full name" value={address.name} onChange={(e) => setAddress({ ...address, name: e.target.value })} />
                  <Input placeholder="Mobile number" value={address.mobile} onChange={(e) => setAddress({ ...address, mobile: e.target.value })} type="tel" />

                  {/* PIN Code with auto-fill */}
                  <div className="relative">
                    <Input
                      placeholder="6-digit PIN code"
                      value={address.pincode}
                      onChange={(e) => handlePincodeChange(e.target.value)}
                      maxLength={6}
                      className={cn(
                        "pr-10",
                        pincodeLookup.error && "border-rose-500",
                        pincodeLookup.success && "border-emerald-500"
                      )}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2">
                      {pincodeLookup.loading && <Loader2 className="h-4 w-4 animate-spin text-brand-500" />}
                      {!pincodeLookup.loading && pincodeLookup.success && <Check className="h-4 w-4 text-emerald-500" />}
                    </span>
                  </div>

                  <Input placeholder="Flat / House no." value={address.line1} onChange={(e) => setAddress({ ...address, line1: e.target.value })} className="sm:col-span-2" />
                  <Input placeholder="Street / Area" value={address.line2} onChange={(e) => setAddress({ ...address, line2: e.target.value })} className="sm:col-span-2" />
                  <Input placeholder="Landmark (optional)" value={address.landmark} onChange={(e) => setAddress({ ...address, landmark: e.target.value })} />

                  {/* City (auto-filled, editable) */}
                  <Input
                    placeholder="City"
                    value={address.city}
                    onChange={(e) => setAddress({ ...address, city: e.target.value })}
                    className={cn(pincodeLookup.success && "bg-emerald-50/50 dark:bg-emerald-950/20")}
                  />

                  {/* State (auto-filled, editable) */}
                  <Input
                    placeholder="State"
                    value={address.state}
                    onChange={(e) => setAddress({ ...address, state: e.target.value })}
                    className={cn(pincodeLookup.success && "bg-emerald-50/50 dark:bg-emerald-950/20")}
                  />
                </div>

                {/* PIN lookup error */}
                {pincodeLookup.error && (
                  <div className="mt-3 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700 dark:border-rose-800 dark:bg-rose-950/30 dark:text-rose-300">
                    {pincodeLookup.error}
                  </div>
                )}

                {/* PIN lookup success */}
                {pincodeLookup.success && (
                  <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300">
                    Location auto-detected: {address.city}, {address.state}
                  </div>
                )}

                {/* Post office selection (if multiple) */}
                {pincodeLookup.postOffices.length > 1 && (
                  <div className="mt-3">
                    <label className="mb-1.5 block text-sm font-medium text-ink-700 dark:text-ink-200">
                      Select Area / Post Office
                    </label>
                    <select
                      value={selectedPostOffice}
                      onChange={(e) => setSelectedPostOffice(e.target.value)}
                      className="input-base w-full"
                    >
                      {pincodeLookup.postOffices.map((po) => (
                        <option key={po.name} value={po.name}>
                          {po.name} ({po.area})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <Button className="mt-4" onClick={() => { if (!address.name || !address.mobile || !address.pincode || !address.line1 || !address.city) { setError("Fill all required fields"); return; } setStep(2); }}>Continue to Payment</Button>
              </div>
            )}

            {step === 2 && (
              <div className="card-base p-5">
                <h2 className="mb-4 flex items-center gap-2 font-bold"><CreditCard className="h-5 w-5 text-brand-500" /> Payment Method</h2>
                <div className="space-y-2">
                  {(["UPI", "CARD", "NETBANKING", "WALLET", "COD"] as const).map((m) => (
                    <label key={m} className={cn("flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition", paymentMethod === m ? "border-brand-500 bg-brand-50 dark:bg-brand-950/30" : "border-ink-200 dark:border-ink-700")}>
                      <input type="radio" name="payment" value={m} checked={paymentMethod === m} onChange={() => setPaymentMethod(m)} className="accent-brand-600" />
                      <span className="font-medium text-sm">{m === "COD" ? "Cash on Delivery" : m}</span>
                    </label>
                  ))}
                </div>
                <div className="mt-4 flex gap-3">
                  <Button variant="secondary" onClick={() => setStep(1)}>Back</Button>
                  <Button onClick={() => setStep(3)} className="flex-1">Review Order</Button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="card-base p-5">
                <h2 className="mb-4 flex items-center gap-2 font-bold"><Package className="h-5 w-5 text-brand-500" /> Order Confirmation</h2>
                <div className="space-y-3">
                  <div className="rounded-lg bg-ink-50 p-3 text-sm dark:bg-ink-700">
                    <p className="font-semibold">Deliver to: {address.name}</p>
                    <p className="text-ink-500">{address.line1}, {address.city}, {address.state} - {address.pincode}</p>
                  </div>
                  <div className="rounded-lg bg-ink-50 p-3 text-sm dark:bg-ink-700">
                    <p className="font-semibold">Payment: {paymentMethod === "COD" ? "Cash on Delivery" : paymentMethod}</p>
                  </div>
                </div>
                {error && <p className="mt-3 text-sm text-rose-600">{error}</p>}
                <div className="mt-4 flex gap-3">
                  <Button variant="secondary" onClick={() => setStep(2)}>Back</Button>
                  <Button variant="accent" onClick={handlePlaceOrder} loading={loading} className="flex-1" size="lg">
                    <CheckCircle className="h-5 w-5" /> Place Order — {formatINR(cartTotals.payable)}
                  </Button>
                </div>
              </div>
            )}
          </div>

          <div className="card-base p-4 self-start sticky top-20">
            <h3 className="mb-3 font-bold text-sm">Order Summary</h3>
            <div className="space-y-2 text-sm">
              {cart.map((item) => (
                <div key={item.id} className="flex justify-between">
                  <span className="line-clamp-1 flex-1">{item.product.title} × {item.quantity}</span>
                  <span className="ml-2 font-medium">{formatINR(item.product.price * item.quantity)}</span>
                </div>
              ))}
            </div>
            <div className="my-3 h-px bg-ink-200 dark:bg-ink-700" />
            <div className="space-y-1 text-sm">
              <div className="flex justify-between"><span>Item total</span><span>{formatINR(cartTotals.priceTotal)}</span></div>
              {cartTotals.couponDiscount > 0 && <div className="flex justify-between text-emerald-600"><span>Coupon</span><span>-{formatINR(cartTotals.couponDiscount)}</span></div>}
              <div className="flex justify-between"><span>Delivery</span><span>{cartTotals.freeDelivery ? "FREE" : formatINR(cartTotals.deliveryFee)}</span></div>
              <div className="flex justify-between"><span>Tax</span><span>{formatINR(cartTotals.tax)}</span></div>
              <div className="flex justify-between font-bold text-base"><span>Total</span><span>{formatINR(cartTotals.payable)}</span></div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
