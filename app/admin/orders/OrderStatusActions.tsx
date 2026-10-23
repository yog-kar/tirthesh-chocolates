
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED";

type OrderStatusActionsProps = {
  orderId: string;
  currentStatus: OrderStatus;
};

const statuses: { value: OrderStatus; label: string }[] = [
  { value: "PENDING", label: "Pending" },
  { value: "CONFIRMED", label: "Confirmed" },
  { value: "PROCESSING", label: "Processing" },
  { value: "SHIPPED", label: "Shipped" },
  { value: "DELIVERED", label: "Delivered" },
  { value: "CANCELLED", label: "Cancelled" },
];

export default function OrderStatusActions({
  orderId,
  currentStatus,
}: OrderStatusActionsProps) {
  const router = useRouter();

  const [selectedStatus, setSelectedStatus] =
    useState<OrderStatus>(currentStatus);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  async function updateStatus() {
    if (selectedStatus === currentStatus) {
      setMessage("This order already has that status.");
      setIsError(false);
      return;
    }

    const selectedLabel = statuses.find(
      (status) => status.value === selectedStatus
    )?.label;

    if (
      selectedStatus === "CANCELLED" &&
      !window.confirm(
        "Are you sure you want to cancel this order?"
      )
    ) {
      setSelectedStatus(currentStatus);
      return;
    }

    if (
      selectedStatus === "DELIVERED" &&
      !window.confirm(
        "Confirm that this order has been delivered to the customer?"
      )
    ) {
      setSelectedStatus(currentStatus);
      return;
    }

    setLoading(true);
    setMessage("");
    setIsError(false);

    try {
      const response = await fetch(
        `/api/admin/orders/${encodeURIComponent(orderId)}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: selectedStatus,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || "Unable to update order status."
        );
      }

      setMessage(`Order status updated to ${selectedLabel}.`);

      router.refresh();
    } catch (error) {
      setIsError(true);
      setMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again."
      );

      setSelectedStatus(currentStatus);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="order-status-actions">
      <label
        htmlFor={`order-status-${orderId}`}
        className="order-status-label"
      >
        Update order status
      </label>

      <div className="order-status-controls">
        <select
          id={`order-status-${orderId}`}
          value={selectedStatus}
          onChange={(event) => {
            setSelectedStatus(event.target.value as OrderStatus);
            setMessage("");
          }}
          disabled={loading}
          className={`order-status-select status-${selectedStatus.toLowerCase()}`}
        >
          {statuses.map((status) => (
            <option key={status.value} value={status.value}>
              {status.label}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={updateStatus}
          disabled={loading || selectedStatus === currentStatus}
          className="order-status-save"
        >
          {loading ? "Updating..." : "Update Status"}
        </button>
      </div>

      {message && (
        <p
          role="status"
          className={`order-status-message ${
            isError ? "message-error" : "message-success"
          }`}
        >
          {message}
        </p>
      )}

      <style jsx>{`
        .order-status-actions {
          margin: 16px 0;
          padding: 14px;
          border: 1px solid #e5e7eb;
          border-radius: 10px;
          background: #fafafa;
        }

        .order-status-label {
          display: block;
          margin-bottom: 9px;
          color: #374151;
          font-size: 13px;
          font-weight: 700;
        }

        .order-status-controls {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }

        .order-status-select {
          flex: 1;
          min-width: 150px;
          padding: 10px;
          border: 1px solid #d1d5db;
          border-radius: 7px;
          background: #ffffff;
          color: #111827;
          font-size: 14px;
        }

        .order-status-save {
          padding: 10px 15px;
          border: none;
          border-radius: 7px;
          background: #111827;
          color: #ffffff;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
        }

        .order-status-save:disabled {
          opacity: 0.45;
          cursor: not-allowed;
        }

        .order-status-message {
          margin: 10px 0 0;
          font-size: 12px;
          overflow-wrap: anywhere;
        }

        .message-success {
          color: #15803d;
        }

        .message-error {
          color: #b91c1c;
        }

        @media (max-width: 480px) {
          .order-status-controls {
            flex-direction: column;
          }

          .order-status-select,
          .order-status-save {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
