
"use client";

import Link from "next/link";
import { useCart } from "@/components/cart/CartProvider";
import "./cart.css";

export default function CartPage() {
  const {
    items,
    itemCount,
    subtotal,
    hydrated,
    updateQuantity,
    removeFromCart,
  } = useCart();

  const money = (amount: number) =>
    `₹${amount.toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  if (!hydrated) {
    return (
      <main className="cart-page">
        <p className="cart-loading">Preparing your shopping bag...</p>
      </main>
    );
  }

  return (
    <main className="cart-page">
      <header className="cart-header">
        <Link href="/" className="cart-wordmark">
          TIRTHESH <span>CHOCOLATES</span>
        </Link>
        <Link href="/" className="cart-continue">
          ← Continue shopping
        </Link>
      </header>

      <section className="cart-content">
        <div className="cart-heading">
          <p className="cart-eyebrow">YOUR SELECTION</p>
          <h1>Your shopping bag<span>.</span></h1>
          <p>
            {itemCount} {itemCount === 1 ? "item" : "items"} selected
            from our collections.
          </p>
        </div>

        {items.length === 0 ? (
          <div className="cart-empty">
            <span className="cart-empty-icon">♡</span>
            <h2>Your bag is waiting for something lovely.</h2>
            <p>Explore our collections and find a new favourite.</p>
            <Link href="/#collections" className="cart-primary-button">
              EXPLORE CHOCOLATES ↗
            </Link>
            <Link href="/jayanand-foods" className="cart-food-link">
              Explore Jayanand Foods →
            </Link>
          </div>
        ) : (
          <div className="cart-grid">
            <div className="cart-items">
              {items.map((item) => (
                <article className="cart-item" key={item.id}>
                  <Link
                    href={`/products/${encodeURIComponent(item.slug)}`}
                    className="cart-item-image"
                    aria-label={`View ${item.name}`}
                  >
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.name} />
                    ) : (
                      <span>No image</span>
                    )}
                  </Link>

                  <div className="cart-item-details">
                    <p className="cart-item-brand">
                      {item.business === "JAYANAND_FOODS"
                        ? "Jayanand Foods"
                        : "Tirthesh Chocolates"}
                    </p>

                    <Link
                      href={`/products/${encodeURIComponent(item.slug)}`}
                      className="cart-item-name"
                    >
                      {item.name}
                    </Link>

                    <p className="cart-item-price">
                      {money(item.price)}
                    </p>

                    <div className="cart-item-bottom">
                      <div
                        className="cart-quantity"
                        aria-label={`Quantity for ${item.name}`}
                      >
                        <button
                          type="button"
                          aria-label="Decrease quantity"
                          onClick={() =>
                            updateQuantity(item.id, item.quantity - 1)
                          }
                          disabled={item.quantity <= 1}
                        >
                          −
                        </button>
                        <span>{item.quantity}</span>
                        <button
                          type="button"
                          aria-label="Increase quantity"
                          onClick={() =>
                            updateQuantity(item.id, item.quantity + 1)
                          }
                          disabled={item.quantity >= item.stock}
                        >
                          +
                        </button>
                      </div>

                      <button
                        type="button"
                        className="cart-remove"
                        onClick={() => removeFromCart(item.id)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>

                  <p className="cart-line-total">
                    {money(item.price * item.quantity)}
                  </p>
                </article>
              ))}
            </div>

            <aside className="cart-summary">
              <p className="cart-summary-eyebrow">ORDER SUMMARY</p>
              <div className="cart-summary-row">
                <span>Subtotal ({itemCount} items)</span>
                <strong>{money(subtotal)}</strong>
              </div>
              <div className="cart-summary-row">
                <span>Shipping</span>
                <span>Calculated at checkout</span>
              </div>
              <div className="cart-summary-total">
                <span>Subtotal</span>
                <strong>{money(subtotal)}</strong>
              </div>

              <Link href="/checkout" className="cart-primary-button">
                    PROCEED TO CHECKOUT ↗
              </Link>

              <p className="cart-summary-note">
                Your final total and delivery charges will be confirmed
                before you place an order.
              </p>

              <Link href="/#collections" className="cart-back-link">
                Continue exploring →
              </Link>
            </aside>
          </div>
        )}
      </section>

      <footer className="cart-footer">
        <span>© 2026 YogKar</span>
        <span>Thoughtful treats. Moments worth remembering.</span>
      </footer>
    </main>
  );
}
