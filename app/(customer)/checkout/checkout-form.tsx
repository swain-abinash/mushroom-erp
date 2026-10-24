"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/cart-context";
import { formatCurrency } from "@/lib/utils";
import { UNIT_LABELS } from "@/lib/catalog/format";
import { placeOrderAction } from "@/app/actions/checkout";
import { PaymentMethod, AddressType } from "@prisma/client";

type SavedAddress = {
  id: string;
  recipientName: string;
  recipientPhone: string;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  state: string;
  pincode: string;
  addressType: AddressType;
  isDefault: boolean;
};

export function CheckoutForm({
  user,
  savedAddresses,
}: {
  user: { name: string; email: string; phone: string | null };
  savedAddresses: SavedAddress[];
}) {
  const router = useRouter();
  const { items, subtotal, deliveryFee, total, clearCart, removeItem } = useCart();

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [selectedAddressId, setSelectedAddressId] = useState<string>(
    savedAddresses.find((a) => a.isDefault)?.id ?? savedAddresses[0]?.id ?? "new",
  );

  const [newAddress, setNewAddress] = useState({
    recipientName: user.name ?? "",
    recipientPhone: user.phone ?? "",
    addressLine1: "",
    addressLine2: "",
    city: "Bhubaneswar",
    state: "Odisha",
    pincode: "751001",
    addressType: AddressType.HOME,
    isDefault: savedAddresses.length === 0,
  });

  const [email, setEmail] = useState(user.email ?? "");
  const [deliverySlot, setDeliverySlot] = useState<"MORNING_HARVEST_DISPATCH" | "EVENING_DISPATCH">(
    "MORNING_HARVEST_DISPATCH",
  );
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.CASH_ON_DELIVERY);
  const [notes, setNotes] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-forest-primary/10 dark:border-white/15 bg-surface-white dark:bg-surface-charcoal p-12 text-center">
        <span className="text-6xl mb-4">🧺</span>
        <h2 className="font-display text-2xl font-bold text-forest-primary dark:text-spore-ivory">
          Your basket is empty
        </h2>
        <p className="mt-2 text-sm text-forest-primary/70 dark:text-spore-ivory/70 max-w-md">
          You don&apos;t have any fresh mushrooms in your cart. Choose from our fresh harvest to proceed with checkout.
        </p>
        <Link
          href="/products"
          className="mt-6 rounded-full bg-forest-primary px-8 py-3 font-display text-sm font-semibold text-spore-ivory hover:bg-forest-hover"
        >
          Explore Harvest Catalog
        </Link>
      </div>
    );
  }

  const handleSubmitOrder = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);

    const payload = {
      customer: {
        name: newAddress.recipientName?.trim() || user.name || "Customer",
        email: email?.trim() || user.email || "guest@sporeerp.local",
        phone: newAddress.recipientPhone?.trim() || user.phone || "9999999999",
      },
      items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
      addressId: selectedAddressId !== "new" ? selectedAddressId : undefined,
      newAddress: selectedAddressId === "new" ? newAddress : undefined,
      deliverySlot,
      paymentMethod,
      notes: notes.trim() || undefined,
    };

    try {
      const res = await placeOrderAction(payload);
      if (!res.success) {
        setErrorMessage(res.error ?? "Failed to place order. Please review your details.");
        setIsSubmitting(false);
        return;
      }

      clearCart();
      router.push(`/checkout/success/${res.orderNumber}`);
    } catch {
      setErrorMessage("An unexpected error occurred. Please try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid gap-10 lg:grid-cols-12">
      {/* Checkout Steps (Left 7 Cols) */}
      <div className="lg:col-span-7 space-y-6">
        {errorMessage && (() => {
          const missingItem = items.find((item) => errorMessage.includes(item.productId));
          return (
            <div
              role="alert"
              className="rounded-xl bg-alert-coral/10 border border-alert-coral/20 p-4 text-sm text-red-600 dark:text-alert-coral flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-semibold">{errorMessage}</p>
                {missingItem && (
                  <p className="text-xs text-alert-coral/80 mt-1">
                    Item: <strong>{missingItem.name}</strong> was created in a previous test session and is not in the active database.
                  </p>
                )}
              </div>
              {missingItem ? (
                <button
                  type="button"
                  onClick={() => {
                    removeItem(missingItem.productId);
                    setErrorMessage(null);
                  }}
                  className="shrink-0 rounded-lg bg-alert-coral px-3 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90 cursor-pointer shadow-sm"
                >
                  Remove &quot;{missingItem.name}&quot;
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setErrorMessage(null)}
                  className="shrink-0 text-xs underline opacity-80 hover:opacity-100"
                >
                  Dismiss
                </button>
              )}
            </div>
          );
        })()}

        {/* Step Navigation Pill Indicator */}
        <div className="flex items-center justify-between border-b border-forest-primary/10 dark:border-white/15 pb-4 text-xs font-semibold uppercase tracking-wider text-forest-primary/60 dark:text-spore-ivory/60">
          <button
            type="button"
            onClick={() => setStep(1)}
            className={`flex items-center gap-1.5 ${step === 1 ? "text-forest-primary font-bold" : ""}`}
          >
            <span className="flex size-5 items-center justify-center rounded-full bg-forest-primary text-spore-ivory text-[10px]">
              1
            </span>
            Address
          </button>
          <span>→</span>
          <button
            type="button"
            onClick={() => setStep(2)}
            className={`flex items-center gap-1.5 ${step === 2 ? "text-forest-primary font-bold" : ""}`}
          >
            <span className="flex size-5 items-center justify-center rounded-full bg-forest-primary text-spore-ivory text-[10px]">
              2
            </span>
            Dispatch Slot
          </button>
          <span>→</span>
          <button
            type="button"
            onClick={() => setStep(3)}
            className={`flex items-center gap-1.5 ${step === 3 ? "text-forest-primary font-bold" : ""}`}
          >
            <span className="flex size-5 items-center justify-center rounded-full bg-forest-primary text-spore-ivory text-[10px]">
              3
            </span>
            Payment
          </button>
          <span>→</span>
          <button
            type="button"
            onClick={() => setStep(4)}
            className={`flex items-center gap-1.5 ${step === 4 ? "text-forest-primary font-bold" : ""}`}
          >
            <span className="flex size-5 items-center justify-center rounded-full bg-forest-primary text-spore-ivory text-[10px]">
              4
            </span>
            Review
          </button>
        </div>

        {/* Step 1: Delivery Address */}
        {step === 1 && (
          <section className="rounded-2xl border border-forest-primary/10 dark:border-white/15 bg-surface-white dark:bg-surface-charcoal p-6 shadow-xs space-y-5">
            <div className="flex justify-between items-center">
              <h2 className="font-display text-xl font-bold text-forest-primary dark:text-spore-ivory">
                1. Delivery Address
              </h2>
              {savedAddresses.length > 0 && (
                <button
                  type="button"
                  onClick={() =>
                    setSelectedAddressId(selectedAddressId === "new" ? savedAddresses[0].id : "new")
                  }
                  className="text-xs font-semibold text-forest-primary dark:text-spore-ivory underline"
                >
                  {selectedAddressId === "new" ? "Choose Saved Address" : "+ Enter New Address"}
                </button>
              )}
            </div>

            {/* Saved Addresses List */}
            {savedAddresses.length > 0 && selectedAddressId !== "new" && (
              <div className="space-y-3">
                {savedAddresses.map((addr) => (
                  <label
                    key={addr.id}
                    className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-all ${
                      selectedAddressId === addr.id
                        ? "border-forest-primary bg-forest-primary/5"
                        : "border-forest-primary/10 hover:border-forest-primary/30"
                    }`}
                  >
                    <input
                      type="radio"
                      name="addressChoice"
                      value={addr.id}
                      checked={selectedAddressId === addr.id}
                      onChange={() => setSelectedAddressId(addr.id)}
                      className="mt-1 accent-forest-primary"
                    />
                    <div className="text-sm">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-forest-primary dark:text-spore-ivory">{addr.recipientName}</span>
                        <span className="rounded-full bg-forest-primary/10 px-2 py-0.5 text-[10px] font-bold text-forest-primary dark:text-spore-ivory">
                          {addr.addressType}
                        </span>
                        {addr.isDefault && (
                          <span className="rounded-full bg-success-mint/15 px-2 py-0.5 text-[10px] font-bold text-green-700 dark:text-success-mint">
                            DEFAULT
                          </span>
                        )}
                      </div>
                      <p className="text-forest-primary/70 dark:text-spore-ivory/70 mt-1">
                        {addr.addressLine1}
                        {addr.addressLine2 ? `, ${addr.addressLine2}` : ""}, {addr.city},{" "}
                        {addr.state} — {addr.pincode}
                      </p>
                      <p className="text-xs text-forest-primary/60 dark:text-spore-ivory/60 mt-0.5">📞 {addr.recipientPhone}</p>
                    </div>
                  </label>
                ))}
              </div>
            )}

            {/* New Address Form */}
            {selectedAddressId === "new" && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-forest-primary dark:text-spore-ivory mb-1">
                    Recipient Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={newAddress.recipientName}
                    onChange={(e) =>
                      setNewAddress({ ...newAddress, recipientName: e.target.value })
                    }
                    className="w-full rounded-lg border border-forest-primary/20 dark:border-white/15 px-3 py-2 text-sm focus:border-forest-primary dark:focus:border-white/15 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-forest-primary dark:text-spore-ivory mb-1">
                    Phone Number (10 digits) *
                  </label>
                  <input
                    type="tel"
                    required
                    value={newAddress.recipientPhone}
                    onChange={(e) =>
                      setNewAddress({ ...newAddress, recipientPhone: e.target.value })
                    }
                    className="w-full rounded-lg border border-forest-primary/20 dark:border-white/15 px-3 py-2 text-sm focus:border-forest-primary dark:focus:border-white/15 focus:outline-hidden"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-forest-primary dark:text-spore-ivory mb-1">
                    Email Address (for order tracking) *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full rounded-lg border border-forest-primary/20 dark:border-white/15 px-3 py-2 text-sm focus:border-forest-primary dark:focus:border-white/15 focus:outline-hidden"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-forest-primary dark:text-spore-ivory mb-1">
                    Address Line 1 (House/Flat No, Building, Street) *
                  </label>
                  <input
                    type="text"
                    required
                    value={newAddress.addressLine1}
                    onChange={(e) =>
                      setNewAddress({ ...newAddress, addressLine1: e.target.value })
                    }
                    className="w-full rounded-lg border border-forest-primary/20 dark:border-white/15 px-3 py-2 text-sm focus:border-forest-primary dark:focus:border-white/15 focus:outline-hidden"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-forest-primary dark:text-spore-ivory mb-1">
                    Address Line 2 (Landmark, Area)
                  </label>
                  <input
                    type="text"
                    value={newAddress.addressLine2}
                    onChange={(e) =>
                      setNewAddress({ ...newAddress, addressLine2: e.target.value })
                    }
                    className="w-full rounded-lg border border-forest-primary/20 dark:border-white/15 px-3 py-2 text-sm focus:border-forest-primary dark:focus:border-white/15 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-forest-primary dark:text-spore-ivory mb-1">
                    City *
                  </label>
                  <input
                    type="text"
                    required
                    value={newAddress.city}
                    onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                    className="w-full rounded-lg border border-forest-primary/20 dark:border-white/15 px-3 py-2 text-sm focus:border-forest-primary dark:focus:border-white/15 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-forest-primary dark:text-spore-ivory mb-1">
                    Pincode *
                  </label>
                  <input
                    type="text"
                    required
                    value={newAddress.pincode}
                    onChange={(e) => setNewAddress({ ...newAddress, pincode: e.target.value })}
                    className="w-full rounded-lg border border-forest-primary/20 dark:border-white/15 px-3 py-2 text-sm focus:border-forest-primary dark:focus:border-white/15 focus:outline-hidden"
                  />
                </div>
                <div className="sm:col-span-2 flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="saveDefault"
                    checked={newAddress.isDefault}
                    onChange={(e) =>
                      setNewAddress({ ...newAddress, isDefault: e.target.checked })
                    }
                    className="accent-forest-primary"
                  />
                  <label htmlFor="saveDefault" className="text-xs text-forest-primary/80 dark:text-spore-ivory/80">
                    Set this as my default delivery address
                  </label>
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={() => {
                if (
                  selectedAddressId === "new" &&
                  (!newAddress.recipientName ||
                    !newAddress.recipientPhone ||
                    !newAddress.addressLine1)
                ) {
                  setErrorMessage("Please fill in all required address fields.");
                  return;
                }
                setErrorMessage(null);
                setStep(2);
              }}
              className="w-full rounded-full bg-forest-primary py-3 font-display text-sm font-semibold text-spore-ivory hover:bg-forest-hover"
            >
              Continue to Dispatch Slot →
            </button>
          </section>
        )}

        {/* Step 2: Delivery Slot */}
        {step === 2 && (
          <section className="rounded-2xl border border-forest-primary/10 dark:border-white/15 bg-surface-white dark:bg-surface-charcoal p-6 shadow-xs space-y-5">
            <h2 className="font-display text-xl font-bold text-forest-primary dark:text-spore-ivory">
              2. Choose Harvest Dispatch Schedule
            </h2>
            <p className="text-xs text-forest-primary/70 dark:text-spore-ivory/70">
              Mushrooms are living organisms. To preserve maximum taste and shelf life, select when our harvest truck should arrive:
            </p>

            <div className="space-y-3">
              <label
                className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-all ${
                  deliverySlot === "MORNING_HARVEST_DISPATCH"
                    ? "border-forest-primary bg-forest-primary/5"
                    : "border-forest-primary/10 hover:border-forest-primary/30"
                }`}
              >
                <input
                  type="radio"
                  name="slotChoice"
                  value="MORNING_HARVEST_DISPATCH"
                  checked={deliverySlot === "MORNING_HARVEST_DISPATCH"}
                  onChange={() => setDeliverySlot("MORNING_HARVEST_DISPATCH")}
                  className="mt-1 accent-forest-primary"
                />
                <div className="text-sm">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-forest-primary dark:text-spore-ivory">
                      🌅 Morning Harvest Dispatch (8:00 AM – 11:00 AM)
                    </span>
                    <span className="rounded-full bg-success-mint/15 px-2 py-0.5 text-[10px] font-bold text-green-700 dark:text-success-mint">
                      RECOMMENDED
                    </span>
                  </div>
                  <p className="text-xs text-forest-primary/70 dark:text-spore-ivory/70 mt-1">
                    Harvested fresh at 5:00 AM dawn today. Chilled and sent straight to your door.
                  </p>
                </div>
              </label>

              <label
                className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-all ${
                  deliverySlot === "EVENING_DISPATCH"
                    ? "border-forest-primary bg-forest-primary/5"
                    : "border-forest-primary/10 hover:border-forest-primary/30"
                }`}
              >
                <input
                  type="radio"
                  name="slotChoice"
                  value="EVENING_DISPATCH"
                  checked={deliverySlot === "EVENING_DISPATCH"}
                  onChange={() => setDeliverySlot("EVENING_DISPATCH")}
                  className="mt-1 accent-forest-primary"
                />
                <div className="text-sm">
                  <span className="font-bold text-forest-primary dark:text-spore-ivory">
                    🌆 Evening Dispatch (4:00 PM – 7:00 PM)
                  </span>
                  <p className="text-xs text-forest-primary/70 dark:text-spore-ivory/70 mt-1">
                    Midday harvest batch. Ideal for dinner preparation and evening restaurant kitchens.
                  </p>
                </div>
              </label>
            </div>

            <div>
              <label className="block text-xs font-semibold text-forest-primary dark:text-spore-ivory mb-1">
                Delivery Instructions (Optional)
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Gate code, landmark, or kitchen delivery entrance notes..."
                className="w-full rounded-lg border border-forest-primary/20 dark:border-white/15 px-3 py-2 text-sm focus:border-forest-primary dark:focus:border-white/15 focus:outline-hidden"
              />
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="rounded-full border border-forest-primary/20 dark:border-white/15 px-6 py-3 font-display text-sm font-semibold text-forest-primary dark:text-spore-ivory hover:bg-forest-primary/5"
              >
                ← Back
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                className="flex-1 rounded-full bg-forest-primary py-3 font-display text-sm font-semibold text-spore-ivory hover:bg-forest-hover"
              >
                Continue to Payment →
              </button>
            </div>
          </section>
        )}

        {/* Step 3: Payment Method */}
        {step === 3 && (
          <section className="rounded-2xl border border-forest-primary/10 dark:border-white/15 bg-surface-white dark:bg-surface-charcoal p-6 shadow-xs space-y-5">
            <h2 className="font-display text-xl font-bold text-forest-primary dark:text-spore-ivory">
              3. Payment Method
            </h2>

            <div className="space-y-3">
              <label
                className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-all ${
                  paymentMethod === PaymentMethod.CASH_ON_DELIVERY
                    ? "border-forest-primary bg-forest-primary/5"
                    : "border-forest-primary/10 hover:border-forest-primary/30"
                }`}
              >
                <input
                  type="radio"
                  name="payMethod"
                  value={PaymentMethod.CASH_ON_DELIVERY}
                  checked={paymentMethod === PaymentMethod.CASH_ON_DELIVERY}
                  onChange={() => setPaymentMethod(PaymentMethod.CASH_ON_DELIVERY)}
                  className="mt-1 accent-forest-primary"
                />
                <div className="text-sm">
                  <span className="font-bold text-forest-primary dark:text-spore-ivory">
                    💵 Cash on Fresh Delivery (COD) / UPI at Doorstep
                  </span>
                  <p className="text-xs text-forest-primary/70 dark:text-spore-ivory/70 mt-1">
                    Inspect your fresh mushrooms upon arrival, then pay cash or scan delivery agent&apos;s UPI QR.
                  </p>
                </div>
              </label>

              <label
                className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-all ${
                  paymentMethod === PaymentMethod.UPI_RAZORPAY
                    ? "border-forest-primary bg-forest-primary/5"
                    : "border-forest-primary/10 hover:border-forest-primary/30"
                }`}
              >
                <input
                  type="radio"
                  name="payMethod"
                  value={PaymentMethod.UPI_RAZORPAY}
                  checked={paymentMethod === PaymentMethod.UPI_RAZORPAY}
                  onChange={() => setPaymentMethod(PaymentMethod.UPI_RAZORPAY)}
                  className="mt-1 accent-forest-primary"
                />
                <div className="text-sm">
                  <span className="font-bold text-forest-primary dark:text-spore-ivory">
                    ⚡ Instant UPI / Razorpay / Net Banking
                  </span>
                  <p className="text-xs text-forest-primary/70 dark:text-spore-ivory/70 mt-1">
                    Pay securely using Google Pay, PhonePe, Paytm, Cards, or Net Banking.
                  </p>
                </div>
              </label>

              <label
                className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-all ${
                  paymentMethod === PaymentMethod.B2B_CREDIT_INVOICE
                    ? "border-forest-primary bg-forest-primary/5"
                    : "border-forest-primary/10 hover:border-forest-primary/30"
                }`}
              >
                <input
                  type="radio"
                  name="payMethod"
                  value={PaymentMethod.B2B_CREDIT_INVOICE}
                  checked={paymentMethod === PaymentMethod.B2B_CREDIT_INVOICE}
                  onChange={() => setPaymentMethod(PaymentMethod.B2B_CREDIT_INVOICE)}
                  className="mt-1 accent-forest-primary"
                />
                <div className="text-sm">
                  <span className="font-bold text-forest-primary dark:text-spore-ivory">
                    🏢 B2B Credit Invoice (7/15 Day Terms)
                  </span>
                  <p className="text-xs text-forest-primary/70 dark:text-spore-ivory/70 mt-1">
                    Available for registered restaurants, caterers, and wholesale partners with active credit accounts.
                  </p>
                </div>
              </label>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="rounded-full border border-forest-primary/20 dark:border-white/15 px-6 py-3 font-display text-sm font-semibold text-forest-primary dark:text-spore-ivory hover:bg-forest-primary/5"
              >
                ← Back
              </button>
              <button
                type="button"
                onClick={() => setStep(4)}
                className="flex-1 rounded-full bg-forest-primary py-3 font-display text-sm font-semibold text-spore-ivory hover:bg-forest-hover"
              >
                Review Order Summary →
              </button>
            </div>
          </section>
        )}

        {/* Step 4: Review & Place Order */}
        {step === 4 && (
          <section className="rounded-2xl border border-forest-primary/10 dark:border-white/15 bg-surface-white dark:bg-surface-charcoal p-6 shadow-xs space-y-5">
            <h2 className="font-display text-xl font-bold text-forest-primary dark:text-spore-ivory">
              4. Review & Confirm Order
            </h2>

            <div className="rounded-xl border border-forest-primary/10 dark:border-white/15 bg-stone-100 dark:bg-spore-ivory/30 p-4 space-y-3 text-sm">
              <div className="flex justify-between items-center border-b border-forest-primary/10 dark:border-white/15 pb-2">
                <span className="font-semibold text-forest-primary dark:text-spore-ivory">Delivery Slot</span>
                <span className="text-xs font-bold text-forest-primary dark:text-spore-ivory">
                  {deliverySlot === "MORNING_HARVEST_DISPATCH"
                    ? "🌅 Morning Dispatch (8:00–11:00 AM)"
                    : "🌆 Evening Dispatch (4:00–7:00 PM)"}
                </span>
              </div>
              <div className="flex justify-between items-center border-b border-forest-primary/10 dark:border-white/15 pb-2">
                <span className="font-semibold text-forest-primary dark:text-spore-ivory">Payment Mode</span>
                <span className="text-xs font-bold text-forest-primary dark:text-spore-ivory">
                  {paymentMethod.replace(/_/g, " ")}
                </span>
              </div>
              {notes && (
                <div className="text-xs text-forest-primary/70 dark:text-spore-ivory/70">
                  <span className="font-semibold text-forest-primary dark:text-spore-ivory">Note: </span>
                  {notes}
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep(3)}
                className="rounded-full border border-forest-primary/20 dark:border-white/15 px-6 py-3 font-display text-sm font-semibold text-forest-primary dark:text-spore-ivory hover:bg-forest-primary/5"
              >
                ← Back
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleSubmitOrder}
                className="flex-1 flex items-center justify-center gap-2 rounded-full bg-forest-primary py-3.5 font-display text-base font-bold text-spore-ivory hover:bg-forest-hover disabled:opacity-50 shadow-md cursor-pointer"
              >
                {isSubmitting ? (
                  <span>Reserving stock & placing order...</span>
                ) : (
                  <span>Confirm & Place Order ({formatCurrency(total)}) →</span>
                )}
              </button>
            </div>
          </section>
        )}
      </div>

      {/* Order Summary Sidebar (Right 5 Cols) */}
      <aside className="lg:col-span-5">
        <div className="rounded-2xl border border-forest-primary/10 dark:border-white/15 bg-surface-white dark:bg-surface-charcoal p-6 shadow-sm space-y-5 sticky top-24">
          <div className="flex justify-between items-center border-b border-forest-primary/10 dark:border-white/15 pb-3">
            <h3 className="font-display text-lg font-bold text-forest-primary dark:text-spore-ivory">Order Summary</h3>
            <span className="text-xs font-semibold text-forest-primary/60 dark:text-spore-ivory/60">
              {items.length} {items.length === 1 ? "variety" : "varieties"}
            </span>
          </div>

          <div className="max-h-72 overflow-y-auto space-y-3 pr-1">
            {items.map((item) => (
              <div key={item.productId} className="flex gap-3 items-center text-sm">
                <div className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-forest-primary/5">
                  {item.imageUrl ? (
                    <Image
                      src={item.imageUrl}
                      alt={item.name}
                      fill
                      sizes="48px"
                      className="object-cover"
                    />
                  ) : (
                    <span className="absolute inset-0 grid place-items-center text-xl">🍄</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-display font-semibold text-forest-primary dark:text-spore-ivory truncate text-xs">
                    {item.name}
                  </p>
                  <p className="text-[11px] text-forest-primary/60 dark:text-spore-ivory/60">
                    {item.quantity} {UNIT_LABELS[item.unitType]?.short ?? "unit"} ×{" "}
                    {formatCurrency(item.price)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-data font-bold text-xs text-forest-primary dark:text-spore-ivory">
                    {formatCurrency(item.price * item.quantity)}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeItem(item.productId)}
                    className="rounded-full p-1 text-forest-primary/40 dark:text-spore-ivory/40 hover:text-red-600 dark:hover:text-alert-coral hover:bg-forest-primary/5 transition-all text-xs leading-none"
                    title={`Remove ${item.name}`}
                    aria-label={`Remove ${item.name}`}
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-forest-primary/10 dark:border-white/15 pt-4 space-y-2 text-sm">
            <div className="flex justify-between text-forest-primary/70 dark:text-spore-ivory/70">
              <span>Subtotal</span>
              <span className="font-data font-semibold text-forest-primary dark:text-spore-ivory">
                {formatCurrency(subtotal)}
              </span>
            </div>
            <div className="flex justify-between text-forest-primary/70 dark:text-spore-ivory/70">
              <span>Delivery Fee</span>
              <span className="font-data font-semibold text-forest-primary dark:text-spore-ivory">
                {deliveryFee === 0 ? (
                  <span className="text-green-700 dark:text-success-mint font-bold uppercase text-xs">FREE</span>
                ) : (
                  formatCurrency(deliveryFee)
                )}
              </span>
            </div>
            <div className="flex justify-between text-lg font-bold text-forest-primary dark:text-spore-ivory pt-3 border-t border-forest-primary/10 dark:border-white/15">
              <span>Total Payable</span>
              <span className="font-data text-xl text-forest-primary dark:text-spore-ivory">
                {formatCurrency(total)}
              </span>
            </div>
          </div>

          <div className="rounded-xl bg-forest-primary/5 p-3 text-xs text-forest-primary/80 dark:text-spore-ivory/80 flex items-center gap-2">
            <span>🛡️</span>
            <span>
              <strong>100% Spore Quality Promise:</strong> Direct harvest without cold-storage delays.
            </span>
          </div>
        </div>
      </aside>
    </div>
  );
}
