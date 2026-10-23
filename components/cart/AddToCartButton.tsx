"use client";

import { useState } from "react";
import Link from "next/link";
import { useCart, type CartProduct } from "./CartProvider";

export default function AddToCartButton({
  product,
}: {
  product: CartProduct;
}) {
  const { addToCart } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [message, setMessage] = useState("");

  const available = Math.max(0, product.stock);

  function handleAddToCart() {
    if (available < 1) return;

    addToCart(product, quantity);
    setMessage(`${quantity} item${quantity > 1 ? "s" : ""} added to your cart`);
  }

  return (
    <div className="detail-purchase">
      <div className="detail-quantity">
        <span>QUANTITY</span>

        <div className="detail-quantity__controls">
          <button
            type="button"
            aria-label="Decrease quantity"
            disabled={quantity <= 1}
            onClick={() => setQuantity((current) => Math.max(1, current - 1))}
          >
            −
          </button>

          <span>{quantity}</span>

          <button
            type="button"
            aria-label="Increase quantity"
            disabled={quantity >= available}
            onClick={() =>
              setQuantity((current) => Math.min(available, current + 1))
            }
          >
            +
          </button>
        </div>
      </div>

      <button
        type="button"
        disabled={available < 1}
        className="detail-cart-button"
        onClick={handleAddToCart}
      >
        <span>
          {available < 1 ? "OUT OF STOCK" : "ADD TO CART"}
        </span>
        <span aria-hidden="true">↗</span>
      </button>

      {message && (
        <p role="status" className="detail-cart-feedback">
          {message}. <Link href="/cart">View cart</Link>
        </p>
      )}
    </div>
  );
}