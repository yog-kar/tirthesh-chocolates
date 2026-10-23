"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useCart } from "@/components/cart/CartProvider";
import "./checkout.css";

type DeliveryDetails = {
  customerName: string;
  email: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postalCode: string;
};

type PaymentMethod = "UPI" | "COD";

type OrderResult = {
  order: {
    orderNumber: string;
    total: number | string;
    paymentMethod: PaymentMethod;
    paymentStatus: string;
  };
};

const initialDetails: DeliveryDetails = {
  customerName: "",
  email: "",
  phone: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  postalCode: "",
};

const money = (amount: number) =>
  `₹${amount.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

function formatPaymentStatus(status: string) {
  switch (status) {
    case "AWAITING_VERIFICATION":
      return "Awaiting payment verification";
    case "PENDING":
      return "Pending";
    case "PAID":
      return "Payment verified";
    case "REJECTED":
      return "Payment rejected";
    case "FAILED":
      return "Payment failed";
    case "REFUNDED":
      return "Refunded";
    default:
      return status.replaceAll("_", " ").toLowerCase();
  }
}

export default function CheckoutPage() {
  const { items, subtotal, hydrated, clearCart } = useCart();

  const [details, setDetails] = useState(initialDetails);
  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethod>("UPI");
  const [paymentReference, setPaymentReference] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [orderNumber, setOrderNumber] = useState("");
  const [orderTotal, setOrderTotal] = useState<number | null>(null);
  const [confirmedPaymentMethod, setConfirmedPaymentMethod] =
    useState<PaymentMethod>("UPI");
  const [paymentStatus, setPaymentStatus] = useState("PENDING");

  const isMaharashtra =
    details.state.trim().toLowerCase() === "maharashtra";

  function update(field: keyof DeliveryDetails, value: string) {
    setDetails((current) => ({ ...current, [field]: value }));

    if (
      field === "state" &&
      value.trim().toLowerCase() !== "maharashtra"
    ) {
      setPaymentMethod("UPI");
    }

    setError("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!items.length) {
      setError("Your shopping bag is empty. Please add a product first.");
      return;
    }

    if (paymentMethod === "COD" && !isMaharashtra) {
      setError(
        "Cash on Delivery is currently available only for Maharashtra addresses.",
      );
      return;
    }

    const cleanedReference = paymentReference.trim();

    if (paymentMethod === "UPI") {
      if (!cleanedReference) {
        setError(
          "Please enter your UPI transaction ID after completing the payment.",
        );
        return;
      }

      if (
        cleanedReference.length < 6 ||
        cleanedReference.length > 100 ||
        !/^[a-zA-Z0-9]+$/.test(cleanedReference)
      ) {
        setError(
          "Enter a valid transaction ID using 6–100 letters or numbers.",
        );
        return;
      }
    }

    setSaving(true);

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...details,
          paymentMethod,
          paymentReference:
            paymentMethod === "UPI" ? cleanedReference : null,
          items: items.map((item) => ({
            productId: item.id,
            quantity: item.quantity,
          })),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || "Unable to place your order.",
        );
      }

      const orderResult = result as OrderResult;

      setOrderNumber(orderResult.order.orderNumber);
      setOrderTotal(Number(orderResult.order.total));
      setConfirmedPaymentMethod(
        orderResult.order.paymentMethod ?? paymentMethod,
      );
      setPaymentStatus(
        orderResult.order.paymentStatus ?? "PENDING",
      );

      clearCart();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  }

  if (!hydrated) {
    return (
      <main className="checkout-page">
        <p>Preparing your checkout...</p>
      </main>
    );
  }

  if (orderNumber) {
    const isUpiOrder = confirmedPaymentMethod === "UPI";

    return (
      <main className="checkout-page">
        <section className="checkout-success">
          <span className="checkout-success__symbol">✓</span>

          <p className="checkout-eyebrow">ORDER RECEIVED</p>

          <h1>
            Thank you<span>.</span>
          </h1>

          <p>Your order request has been saved successfully.</p>

          <div className="checkout-success__details">
            <span>Order number</span>
            <strong>{orderNumber}</strong>

            <span>Order total</span>
            <strong>{money(orderTotal ?? 0)}</strong>

            <span>Payment method</span>
            <strong>
              {isUpiOrder ? "UPI Payment" : "Cash on Delivery"}
            </strong>

            <span>Payment status</span>
            <strong>{formatPaymentStatus(paymentStatus)}</strong>
          </div>

          <p className="checkout-note">
            {isUpiOrder
              ? "Your payment is awaiting verification. Please keep your UPI transaction details safe. Your order will be confirmed after we verify the payment."
              : "Your order has been received with Cash on Delivery selected. Our team will contact you to confirm the order and delivery arrangements."}
          </p>

          <Link href="/" className="checkout-submit">
            RETURN TO STOREFRONT ↗
          </Link>
        </section>
      </main>
    );
  }

  if (!items.length) {
    return (
      <main className="checkout-page">
        <section className="checkout-empty">
          <p className="checkout-eyebrow">
            YOUR NEXT FAVOURITE AWAITS
          </p>

          <h1>
            Your bag is empty<span>.</span>
          </h1>

          <p>Add something lovely to your bag before checking out.</p>

          <Link href="/#collections" className="checkout-submit">
            EXPLORE CHOCOLATES ↗
          </Link>

          <Link
            href="/jayanand-foods"
            className="checkout-secondary"
          >
            Explore Jayanand Foods →
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="checkout-page">
      <header className="checkout-header">
        <Link href="/" className="checkout-brand">
          TIRTHESH <span>CHOCOLATES</span>
        </Link>

        <Link href="/cart" className="checkout-back">
          ← Back to bag
        </Link>
      </header>

      <div className="checkout-layout">
        <section className="checkout-form-section">
          <p className="checkout-eyebrow">THE FINAL DETAILS</p>

          <h1>
            Delivery details<span>.</span>
          </h1>

          <p className="checkout-intro">
            Tell us where to send your carefully selected treats.
          </p>

          <form onSubmit={handleSubmit} className="checkout-form">
            <h2>
              01 <span>Contact information</span>
            </h2>

            <label>
              Full name *
              <input
                required
                maxLength={120}
                autoComplete="name"
                value={details.customerName}
                onChange={(e) =>
                  update("customerName", e.target.value)
                }
                placeholder="Your full name"
              />
            </label>

            <div className="checkout-fields-two">
              <label>
                Mobile number *
                <input
                  required
                  type="tel"
                  maxLength={20}
                  autoComplete="tel"
                  value={details.phone}
                  onChange={(e) =>
                    update("phone", e.target.value)
                  }
                  placeholder="Your contact number"
                />
              </label>

              <label>
                Email address
                <input
                  type="email"
                  maxLength={254}
                  autoComplete="email"
                  value={details.email}
                  onChange={(e) =>
                    update("email", e.target.value)
                  }
                  placeholder="you@example.com"
                />
              </label>
            </div>

            <h2>
              02 <span>Delivery address</span>
            </h2>

            <label>
              Address line 1 *
              <input
                required
                maxLength={200}
                autoComplete="address-line1"
                value={details.addressLine1}
                onChange={(e) =>
                  update("addressLine1", e.target.value)
                }
                placeholder="House number, street, area"
              />
            </label>

            <label>
              Address line 2
              <input
                maxLength={200}
                autoComplete="address-line2"
                value={details.addressLine2}
                onChange={(e) =>
                  update("addressLine2", e.target.value)
                }
                placeholder="Landmark, apartment (optional)"
              />
            </label>

            <div className="checkout-fields-two">
              <label>
                City *
                <input
                  required
                  maxLength={100}
                  autoComplete="address-level2"
                  value={details.city}
                  onChange={(e) =>
                    update("city", e.target.value)
                  }
                  placeholder="City"
                />
              </label>

              <label>
                State *
                <input
                  required
                  maxLength={100}
                  autoComplete="address-level1"
                  value={details.state}
                  onChange={(e) =>
                    update("state", e.target.value)
                  }
                  placeholder="Enter Maharashtra for COD"
                />
              </label>
            </div>

            <label>
              PIN code *
              <input
                required
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                autoComplete="postal-code"
                value={details.postalCode}
                onChange={(e) =>
                  update(
                    "postalCode",
                    e.target.value.replace(/\D/g, "").slice(0, 6),
                  )
                }
                placeholder="6-digit PIN code"
              />
            </label>

            <h2>
              03 <span>Payment method</span>
            </h2>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
                gap: "12px",
                marginBottom: "20px",
              }}
            >
              <label
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "10px",
                  padding: "16px",
                  border: `1px solid ${
                    paymentMethod === "UPI" ? "#8c6a43" : "#dedede"
                  }`,
                  borderRadius: "8px",
                  cursor: "pointer",
                }}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="UPI"
                  checked={paymentMethod === "UPI"}
                  onChange={() => {
                    setPaymentMethod("UPI");
                    setError("");
                  }}
                  style={{ width: "auto", marginTop: "4px" }}
                />

                <span>
                  <strong>UPI Payment</strong>
                  <br />
                  <small>Pay by scanning our QR code</small>
                </span>
              </label>

              <label
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "10px",
                  padding: "16px",
                  border: `1px solid ${
                    paymentMethod === "COD" ? "#8c6a43" : "#dedede"
                  }`,
                  borderRadius: "8px",
                  cursor: isMaharashtra ? "pointer" : "not-allowed",
                  opacity: isMaharashtra ? 1 : 0.6,
                }}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="COD"
                  checked={paymentMethod === "COD"}
                  disabled={!isMaharashtra}
                  onChange={() => {
                    setPaymentMethod("COD");
                    setError("");
                  }}
                  style={{ width: "auto", marginTop: "4px" }}
                />

                <span>
                  <strong>Cash on Delivery</strong>
                  <br />
                  <small>
                    {isMaharashtra
                      ? "Pay when your order arrives"
                      : "Available only in Maharashtra"}
                  </small>
                </span>
              </label>
            </div>

            {paymentMethod === "COD" && isMaharashtra && (
              <div
                style={{
                  padding: "14px",
                  borderRadius: "8px",
                  background: "#f7f3ed",
                  marginBottom: "20px",
                  lineHeight: 1.6,
                }}
              >
                <strong>Cash on Delivery selected</strong>
                <p style={{ margin: "6px 0 0" }}>
                  You can pay when your order is delivered. Our team
                  will contact you to confirm delivery arrangements.
                </p>
              </div>
            )}

            {paymentMethod === "UPI" && (
              <section
                aria-label="UPI payment instructions"
                style={{
                  padding: "20px",
                  border: "1px solid #dedede",
                  borderRadius: "10px",
                  marginBottom: "24px",
                }}
              >
                <h3 style={{ marginTop: 0 }}>
                  Scan &amp; pay using UPI
                </h3>

                <p style={{ lineHeight: 1.6 }}>
                  Open any UPI payment app, scan the QR code below,
                  and pay the order amount shown on this page.
                </p>

                <div style={{ textAlign: "center", margin: "20px 0" }}>
                  <img
                    src="/images/upi-qr.png"
                    alt="Tirthesh Chocolates UPI payment QR code"
                    style={{
                      display: "block",
                      width: "100%",
                      maxWidth: "280px",
                      height: "auto",
                      margin: "0 auto",
                      objectFit: "contain",
                      borderRadius: "8px",
                    }}
                  />
                </div>

                <p
                  style={{
                    textAlign: "center",
                    fontWeight: 600,
                    fontSize: "18px",
                  }}
                >
                  Amount: {money(subtotal)}
                </p>

                <p
                  className="checkout-note"
                  style={{ lineHeight: 1.6 }}
                >
                  Check the recipient name and amount in your UPI app
                  before confirming payment. After paying, enter your
                  transaction ID or UTR below. Do not submit a
                  transaction ID for a payment you have not made.
                </p>

                <label>
                  UPI transaction ID / UTR *
                  <input
                    required
                    type="text"
                    minLength={6}
                    maxLength={100}
                    autoComplete="off"
                    value={paymentReference}
                    onChange={(e) => {
                      setPaymentReference(
                        e.target.value.replace(/[^a-zA-Z0-9]/g, ""),
                      );
                      setError("");
                    }}
                    placeholder="Enter your UPI transaction ID"
                  />
                </label>

                <p
                  className="checkout-note"
                  style={{ lineHeight: 1.6 }}
                >
                  Your order will remain awaiting verification until
                  the payment is checked. Entering a transaction ID
                  does not automatically confirm your payment.
                </p>
              </section>
            )}

            {error && (
              <p className="checkout-error" role="alert">
                {error}
              </p>
            )}

            <button
              type="submit"
              className="checkout-submit"
              disabled={saving}
            >
              {saving
                ? "SAVING YOUR ORDER..."
                : "PLACE ORDER REQUEST ↗"}
            </button>

            <p className="checkout-note">
              {paymentMethod === "UPI"
                ? "UPI payments are subject to manual verification. Your order is not considered paid until we confirm receipt of the payment."
                : "Your Cash on Delivery order will be reviewed before delivery is confirmed."}
            </p>
          </form>
        </section>

        <aside className="checkout-summary">
          <p className="checkout-eyebrow">YOUR SELECTION</p>

          <h2>Order summary</h2>

          <div className="checkout-summary-items">
            {items.map((item) => (
              <div className="checkout-summary-item" key={item.id}>
                <div className="checkout-summary-image">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.name} />
                  ) : (
                    <span>♡</span>
                  )}

                  <span className="checkout-item-quantity">
                    {item.quantity}
                  </span>
                </div>

                <div className="checkout-summary-info">
                  <p>{item.name}</p>

                  <span>
                    {item.business === "JAYANAND_FOODS"
                      ? "Jayanand Foods"
                      : "Tirthesh Chocolates"}
                  </span>

                  <strong>
                    {money(item.price * item.quantity)}
                  </strong>
                </div>
              </div>
            ))}
          </div>

          <div className="checkout-total-row">
            <span>Subtotal</span>
            <strong>{money(subtotal)}</strong>
          </div>

          <div className="checkout-total-row">
            <span>Shipping</span>
            <span>To be confirmed</span>
          </div>

          <div className="checkout-grand-total">
            <span>Estimated total</span>
            <strong>{money(subtotal)}</strong>
          </div>

          <p className="checkout-note">
            Shipping is currently set to ₹0 in the order API. Confirm
            delivery charges before accepting live orders.
          </p>
        </aside>
      </div>

      <footer className="checkout-footer">
        <span>© 2026 Tirthesh Chocolates &amp; Jayanand Foods</span>
        <span>Thoughtful treats. Moments worth remembering.</span>
      </footer>
    </main>
  );
}