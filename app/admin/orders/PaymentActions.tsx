
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type PaymentActionsProps = {
  orderId: string;
  paymentStatus: string;
};

export default function PaymentActions({
  orderId,
  paymentStatus,
}: PaymentActionsProps) {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  // Show the buttons only for UPI payments awaiting verification.
  if (paymentStatus !== "AWAITING_VERIFICATION") {
    return null;
  }

  async function handleAction(action: "mark_paid" | "reject") {
    const confirmationMessage =
      action === "mark_paid"
        ? "Have you verified that the money was actually received in your bank account or UPI app? Mark this payment as paid?"
        : "Are you sure you want to reject this payment?";

    if (!window.confirm(confirmationMessage)) {
      return;
    }

    setLoading(true);
    setMessage("");
    setIsError(false);

    try {
      const response = await fetch(
        `/api/admin/orders/${encodeURIComponent(orderId)}/payment`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ action }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || "Unable to update the payment status."
        );
      }

      setMessage(result.message || "Payment updated successfully.");

      // Refresh the server-rendered dashboard to show the new status.
      router.refresh();
    } catch (error) {
      setIsError(true);
      setMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="payment-actions">
      <div className="payment-actions-buttons">
        <button
          type="button"
          onClick={() => handleAction("mark_paid")}
          disabled={loading}
          className="payment-action-button payment-action-paid"
        >
          {loading ? "Processing..." : "Mark as Paid"}
        </button>

        <button
          type="button"
          onClick={() => handleAction("reject")}
          disabled={loading}
          className="payment-action-button payment-action-reject"
        >
          Reject Payment
        </button>
      </div>

      {message && (
        <p
          role="status"
          className={`payment-action-message ${
            isError ? "payment-action-error" : "payment-action-success"
          }`}
        >
          {message}
        </p>
      )}

      <style jsx>{`
        .payment-actions {
          margin-top: 12px;
        }

        .payment-actions-buttons {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .payment-action-button {
          border: none;
          border-radius: 6px;
          padding: 9px 12px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: opacity 0.2s ease;
        }

        .payment-action-button:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }

        .payment-action-button:not(:disabled):hover {
          opacity: 0.8;
        }

        .payment-action-paid {
          background: #dcfce7;
          color: #166534;
        }

        .payment-action-reject {
          background: #fee2e2;
          color: #991b1b;
        }

        .payment-action-message {
          margin-top: 8px;
          font-size: 12px;
          overflow-wrap: anywhere;
        }

        .payment-action-success {
          color: #15803d;
        }

        .payment-action-error {
          color: #dc2626;
        }
      `}</style>
    </div>
  );
}
