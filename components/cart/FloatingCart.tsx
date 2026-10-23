"use client";

import Link from "next/link";
import { useCart } from "@/components/cart/CartProvider";

export default function FloatingCart() {
  const { items } = useCart();

  const itemCount = items.reduce(
    (total, item) => total + item.quantity,
    0,
  );

  return (
    <Link
      href="/cart"
      aria-label={`Open shopping cart, ${itemCount} items`}
      title="View your cart"
      style={{
        position: "fixed",
        right: "24px",
        bottom: "24px",
        zIndex: 9999,
        width: "64px",
        height: "64px",
        borderRadius: "50%",
        background: "#292929",
        color: "#ffffff",
        border: "2px solid #111111",
        boxShadow: "0 5px 18px rgba(0,0,0,0.24)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        textDecoration: "none",
        transition: "transform 180ms ease, box-shadow 180ms ease",
      }}
    >
      <svg
        width="29"
        height="29"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <circle cx="9" cy="21" r="1" />
        <circle cx="20" cy="21" r="1" />
        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
      </svg>

      {itemCount > 0 && (
        <span
          style={{
            position: "absolute",
            top: "-5px",
            right: "-5px",
            minWidth: "23px",
            height: "23px",
            padding: "0 5px",
            borderRadius: "20px",
            background: "#ffffff",
            color: "#202124",
            border: "1px solid #202124",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "12px",
            fontWeight: 700,
          }}
        >
          {itemCount > 99 ? "99+" : itemCount}
        </span>
      )}
    </Link>
  );
}