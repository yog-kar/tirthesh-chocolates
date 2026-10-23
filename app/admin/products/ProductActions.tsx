"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type ProductActionsProps = {
  id: string;
  isActive: boolean;
};

export default function ProductActions({
  id,
  isActive,
}: ProductActionsProps) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function updateProduct(data: Record<string, unknown>) {
    setBusy(true);
    setMessage("");

    try {
      const response = await fetch(`/api/products/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Could not update product.");
      }

      router.refresh();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Something went wrong.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function removeProduct() {
    const confirmed = window.confirm(
      "Remove this product from the active catalogue? Existing order records will be preserved.",
    );

    if (!confirmed) return;

    setBusy(true);
    setMessage("");

    try {
      const response = await fetch(`/api/products/${id}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Could not remove product.");
      }

      router.refresh();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Something went wrong.",
      );
    } finally {
      setBusy(false);
    }
  }

  const buttonStyle = {
    border: "1px solid #dfe1e5",
    borderRadius: 7,
    padding: "7px 10px",
    background: "#fff",
    color: "#30333a",
    fontSize: 12,
    fontWeight: 600,
    cursor: busy ? "wait" : "pointer",
    opacity: busy ? 0.6 : 1,
    whiteSpace: "nowrap" as const,
  };

  return (
    <div style={{ display: "flex", gap: 7, alignItems: "center", flexWrap: "wrap" }}>
      <Link
        href={`/admin/products/${id}`}
        style={{
          ...buttonStyle,
          display: "inline-block",
          textDecoration: "none",
        }}
      >
        Edit
      </Link>

      <button
        type="button"
        disabled={busy}
        onClick={() => updateProduct({ isActive: !isActive })}
        style={buttonStyle}
      >
        {isActive ? "Disable" : "Activate"}
      </button>

      <button
        type="button"
        disabled={busy}
        onClick={removeProduct}
        style={{
          ...buttonStyle,
          color: "#b42318",
          borderColor: "#f0c9c6",
        }}
      >
        Remove
      </button>

      {message && (
        <span role="status" style={{ color: "#b42318", fontSize: 12 }}>
          {message}
        </span>
      )}
    </div>
  );
}