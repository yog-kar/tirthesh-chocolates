import { Suspense } from "react";
import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import ProductActions from "./products/ProductActions";
import PaymentActions from "./orders/PaymentActions";
import OrderStatusActions from "./orders/OrderStatusActions";
import { isStoreOwner } from "@/lib/admin-auth";

const businesses = [
  { value: "ALL", label: "All businesses" },
  { value: "TIRTHESH_CHOCOLATES", label: "Tirthesh Chocolates" },
  { value: "JAYANAND_FOODS", label: "Jayanand Foods" },
] as const;

function LoadingAdmin() {
  return (
    <main className="admin-loading">
      Loading your dashboard...
    </main>
  );
}

async function AdminContent() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const authorized = await isStoreOwner();

  if (!authorized) {
    return (
      <main className="admin-access-denied">
        <h1>Access denied</h1>
        <p>This account cannot access the owner dashboard.</p>
      </main>
    );
  }

  const user = await currentUser();

  const email = user?.emailAddresses.find(
    (item) => item.id === user.primaryEmailAddressId,
  )?.emailAddress;

  // Keep the existing products/orders queries and dashboard below this point.

  const ownerEmail = process.env.ADMIN_EMAIL;

  if (
    !email ||
    !ownerEmail ||
    email.toLowerCase() !== ownerEmail.trim().toLowerCase()
  ) {
    return (
      <main className="admin-access-denied">
        <h1>Access denied</h1>
        <p>This account cannot access the owner dashboard.</p>
      </main>
    );
  }

  const [products, orders] = await Promise.all([
    prisma.product.findMany({
      orderBy: { updatedAt: "desc" },
      take: 100,
    }),
    prisma.order.findMany({
      include: { items: true },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
  ]);

  const activeProducts = products.filter((product) => product.isActive);

  const lowStock = activeProducts.filter(
    (product) => product.stock > 0 && product.stock <= 5,
  );

  const outOfStock = activeProducts.filter(
    (product) => product.stock === 0,
  );

  const money = (value: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(value);

  const businessName = (value: string) =>
    value === "TIRTHESH_CHOCOLATES"
      ? "Tirthesh Chocolates"
      : "Jayanand Foods";

  const cardStyle = {
    background: "#ffffff",
    border: "1px solid #e7e8eb",
    borderRadius: 14,
    padding: 22,
  } as const;

  const mutedStyle = {
    color: "#737780",
    fontSize: 13,
  } as const;

  const pendingOrders = orders.filter(
    (order) => String(order.status).toUpperCase() === "PENDING",
  );

  const totalOrderValue = orders.reduce(
    (sum, order) => sum + Number(order.total),
    0,
  );

  return (
    <div className="admin-page">
      <div className="admin-layout">
        {/* SIDEBAR */}
        <aside className="admin-sidebar">
          <Link href="/admin" className="admin-brand">
            <div className="admin-brand-label">TIRTHESH</div>
            <div className="admin-brand-title">Owner Studio</div>
          </Link>

          <div className="admin-workspace-label">WORKSPACE</div>

          <nav className="admin-nav-list">
            <a href="#overview" className="admin-nav active">
              <span>▦</span>
              Overview
            </a>

            <a href="#products" className="admin-nav">
              <span>▤</span>
              Products
            </a>

            <a href="#inventory" className="admin-nav">
              <span>◷</span>
              Inventory
            </a>

            <a href="#orders" className="admin-nav">
              <span>▣</span>
              Orders
            </a>
          </nav>

          <div className="admin-account-card">
            <div className="admin-account-label">SIGNED IN AS</div>

            <div className="admin-account-email">{email}</div>
          </div>

          <Link href="/" className="admin-storefront-link">
            ↗ View storefront
          </Link>
        </aside>

        {/* MAIN DASHBOARD */}
        <main className="admin-main">
          {/* HEADER */}
          <header id="overview" className="admin-header">
            <div className="admin-header-copy">
              <div className="admin-eyebrow">
                WORKSPACE / OVERVIEW
              </div>

              <h1 className="admin-page-title">Good to see you.</h1>

              <p className="admin-page-description">
                Manage your products, inventory, and customer orders in one
                place.
              </p>
            </div>

            <div className="admin-verified-badge">
              <span>●</span>
              Owner access verified
            </div>
          </header>

          {/* STATISTICS */}
          <section className="admin-stats-grid">
            {[
              {
                label: "Total products",
                value: products.length,
                note: "Across both businesses",
              },
              {
                label: "Active products",
                value: activeProducts.length,
                note: "Currently listed in inventory",
              },
              {
                label: "Low stock",
                value: lowStock.length,
                note: "Between 1 and 5 units",
              },
              {
                label: "Out of stock",
                value: outOfStock.length,
                note: "Active products with zero units",
              },
            ].map((stat) => (
              <article key={stat.label} className="admin-stat-card">
                <div className="admin-muted">{stat.label}</div>

                <div className="admin-stat-value">{stat.value}</div>

                <div className="admin-muted">{stat.note}</div>
              </article>
            ))}
          </section>

          {/* BUSINESS OVERVIEW */}
          <section className="admin-business-grid">
            {businesses.slice(1).map((business) => {
              const count = products.filter(
                (product) => product.business === business.value,
              ).length;

              return (
                <article
                  key={business.value}
                  className="admin-business-card"
                >
                  <div className="admin-muted admin-business-eyebrow">
                    BUSINESS
                  </div>

                  <h2>{business.label}</h2>

                  <div className="admin-business-count">{count}</div>

                  <div className="admin-muted">
                    Products in catalogue
                  </div>
                </article>
              );
            })}
          </section>

          {/* PRODUCT CATALOGUE */}
          <section id="products" className="admin-panel">
            <div className="admin-panel-header">
              <div>
                <h2>Product catalogue</h2>

                <p className="admin-muted">
                  Your latest {products.length} products
                  {products.length === 100
                    ? " (showing up to 100)"
                    : ""}
                </p>
              </div>

              <div className="admin-panel-actions">
                <Link
                  href="/admin/products/new"
                  className="admin-button primary"
                >
                  + Add product
                </Link>

                <a href="#inventory" className="admin-button">
                  View inventory ↓
                </a>
              </div>
            </div>

            {products.length === 0 ? (
              <div className="admin-empty-state">
                <div className="admin-empty-icon">▤</div>

                <h3>Your catalogue is ready</h3>

                <p>
                  Start by adding your first product using the button above.
                </p>
              </div>
            ) : (
              <div className="admin-table-wrapper">
                <table className="admin-table">
                  <thead>
                    <tr>
                      {[
                        "Product",
                        "Business",
                        "Price",
                        "Stock",
                        "Status",
                        "Actions",
                      ].map((heading) => (
                        <th key={heading}>{heading}</th>
                      ))}
                    </tr>
                  </thead>

                  <tbody>
                    {products.map((product) => (
                      <tr key={product.id}>
                        <td className="admin-product-cell">
                          <div>{product.name}</div>

                          <div className="admin-product-slug">
                            {product.slug}
                          </div>
                        </td>

                        <td>{businessName(product.business)}</td>

                        <td>{money(Number(product.price))}</td>

                        <td>{product.stock}</td>

                        <td>
                          <span
                            className={`admin-status ${
                              product.isActive
                                ? "admin-status-active"
                                : "admin-status-inactive"
                            }`}
                          >
                            {product.isActive ? "Active" : "Inactive"}
                          </span>
                        </td>

                        <td className="admin-actions-cell">
                          <ProductActions
                            id={product.id}
                            isActive={product.isActive}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* INVENTORY HEALTH */}
          <section id="inventory" className="admin-inventory-panel">
            <div>
              <h2>Inventory health</h2>

              <p className="admin-muted">
                {lowStock.length + outOfStock.length} active products need a
                stock check.
              </p>
            </div>

            <div className="admin-inventory-summary">
              <span className="admin-low-stock">
                {lowStock.length} low stock
              </span>

              <span className="admin-inventory-separator">·</span>

              <span className="admin-out-stock">
                {outOfStock.length} out of stock
              </span>
            </div>
          </section>

          {/* ORDERS AND REVENUE */}
          <section id="orders" className="admin-panel admin-orders-panel">
            <div className="admin-panel-header admin-orders-header">
              <div>
                <h2>Orders &amp; revenue</h2>

                <p className="admin-muted">
                  Customer orders and delivery information
                </p>
              </div>
            </div>

            {/* ORDER STATISTICS */}
            <div className="admin-order-stats">
              <div className="admin-order-stat">
                <div className="admin-muted">Total orders</div>

                <div className="admin-order-stat-value">
                  {orders.length}
                </div>
              </div>

              <div className="admin-order-stat">
                <div className="admin-muted">Pending orders</div>

                <div className="admin-order-stat-value">
                  {pendingOrders.length}
                </div>
              </div>

              <div className="admin-order-stat">
                <div className="admin-muted">Recorded order value</div>

                <div className="admin-order-stat-value">
                  {money(totalOrderValue)}
                </div>

                <div className="admin-muted admin-revenue-note">
                  Not necessarily paid revenue
                </div>
              </div>
            </div>

            {/* ORDER LIST */}
            {orders.length === 0 ? (
              <div className="admin-no-orders">
                No orders have been received yet. New checkout orders will
                appear here.
              </div>
            ) : (
              orders.map((order) => (
                <details key={order.id} className="admin-order">
                  <summary className="admin-order-summary">
                    <div className="admin-order-customer">
                      <div className="admin-order-number">
                        Order #{order.orderNumber}
                      </div>

                      <div className="admin-order-subtitle">
                        {order.customerName} · {order.phone}
                      </div>

                      <div className="admin-order-subtitle">
                        {new Date(order.createdAt).toLocaleString("en-IN")}
                      </div>
                    </div>

                    <div className="admin-order-total">
                      <div className="admin-order-price">
                        {money(Number(order.total))}
                      </div>

                      <span
                        className={`admin-status ${
                          String(order.status).toUpperCase() === "PENDING"
                            ? "admin-order-pending"
                            : "admin-order-complete"
                        }`}
                      >
                        {String(order.status)}
                      </span>
                    </div>
                  </summary>

                  <div className="admin-order-details">
                    <h3>Customer details</h3>

                    <div>
                      <strong>Name:</strong> {order.customerName}
                    </div>

                    <div>
                      <strong>Phone:</strong> {order.phone}
                    </div>

                    <div>
                      <strong>Email:</strong> {order.email || "Not provided"}
                    </div>

                    <div className="admin-delivery-address">
                      <strong>Delivery address:</strong>
                      <br />

                      {order.addressLine1}

                      {order.addressLine2
                        ? `, ${order.addressLine2}`
                        : ""}

                      <br />

                      {order.city}, {order.state} {order.postalCode}

                      <br />

                      {order.country}
                    </div>

                    <h3 className="admin-ordered-products-heading">
                      Payment details
                    </h3>

                    <div>
                      <strong>Payment method:</strong>{" "}
                      {order.paymentMethod === "COD"
                        ? "Cash on Delivery"
                        : order.paymentMethod === "UPI"
                          ? "UPI Payment"
                          : "Not recorded"}
                    </div>
                    <PaymentActions
                      orderId={order.id}
                      paymentStatus={String(order.paymentStatus ?? "PENDING")}/>

                    <div>
                      <strong>Payment status:</strong>{" "}
                      {String(order.paymentStatus ?? "PENDING").replaceAll("_", " ")}
                    </div>

                    {order.paymentMethod === "UPI" && (
                      <div className="admin-payment-reference">
                        <strong>Transaction ID / UTR:</strong>{" "}
                        {order.paymentReference || "Not provided"}
                      </div>
                    )}

                    {order.paymentMethod === "UPI" &&
                      order.paymentStatus === "AWAITING_VERIFICATION" && (
                        <p className="admin-order-status-note">
                          Payment is awaiting verification. Confirm the transaction
                          in your bank or UPI app before marking it as paid.
                        </p>
                      )}

                    {order.paymentMethod === "COD" && (
                      <p className="admin-order-status-note">
                        Collect payment when the order is delivered.
                      </p>
                    )}

                    <h3 className="admin-ordered-products-heading">
                      Products ordered
                    </h3>

                    {order.items.map((item) => (
                      <div key={item.id} className="admin-ordered-item">
                        <div className="admin-ordered-item-name">
                          {item.productName}
                        </div>

                        <div>
                          Quantity: {item.quantity} ×{" "}
                          {money(Number(item.unitPrice))}
                        </div>

                        <div>
                          Business: {businessName(item.business)}
                        </div>

                        <div>
                          Line total: {money(Number(item.lineTotal))}
                        </div>
                      </div>
                    ))}

                    <div className="admin-order-breakdown">
                      <div>
                        <strong>Subtotal:</strong>{" "}
                        {money(Number(order.subtotal))}
                      </div>

                      <div>
                        <strong>Shipping:</strong>{" "}
                        {money(Number(order.shippingFee))}
                      </div>

                      <div className="admin-order-grand-total">
                        <strong>Total:</strong>{" "}
                        {money(Number(order.total))}
                      </div>
                    </div>

                    <div className="admin-order-status-note">
              Current order status:{" "}
  <strong>
    {String(order.status).replaceAll("_", " ")}
  </strong>
</div>

<OrderStatusActions
  orderId={order.id}
  currentStatus={order.status}
/>
                  </div>
                </details>
              ))
            )}
          </section>

          {/* FOOTER */}
          <footer className="admin-footer">
            Tirthesh Chocolates · Owner Studio
          </footer>
        </main>
      </div>

      <style>{`
        * {
          box-sizing: border-box;
        }

        html {
          scroll-behavior: smooth;
          scroll-padding-top: 20px;
        }

        .admin-page {
          min-height: 100vh;
          width: 100%;
          background: #f6f7f9;
          color: #202124;
          font-family: Arial, Helvetica, sans-serif;
          overflow-wrap: break-word;
        }

        .admin-layout {
          display: grid;
          grid-template-columns: 240px minmax(0, 1fr);
          min-height: 100vh;
          width: 100%;
        }

        .admin-sidebar {
          min-width: 0;
          background: #ffffff;
          border-right: 1px solid #e7e8eb;
          padding: 28px 18px;
        }

        .admin-brand {
          display: block;
          color: #202124;
          text-decoration: none;
          padding: 0 10px 28px;
        }

        .admin-brand-label {
          font-size: 11px;
          letter-spacing: 3px;
          color: #737780;
        }

        .admin-brand-title {
          font-size: 20px;
          font-weight: 700;
          margin-top: 5px;
        }

        .admin-workspace-label {
          color: #737780;
          font-size: 13px;
          padding: 0 10px 10px;
        }

        .admin-nav-list {
          display: grid;
          gap: 6px;
        }

        .admin-nav {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          border-radius: 9px;
          color: #5e626b;
          text-decoration: none;
          font-size: 14px;
          transition:
            background 150ms ease,
            color 150ms ease;
        }

        .admin-nav span {
          width: 20px;
          flex-shrink: 0;
          text-align: center;
        }

        .admin-nav:hover {
          background: #f3f4f6;
          color: #202124;
        }

        .admin-nav.active {
          background: #202124;
          color: #ffffff;
        }

        .admin-account-card {
          background: #f8f9fb;
          border: 1px solid #e7e8eb;
          border-radius: 14px;
          padding: 14px;
          margin-top: 32px;
        }

        .admin-account-label {
          color: #737780;
          font-size: 12px;
        }

        .admin-account-email {
          font-size: 13px;
          font-weight: 600;
          margin-top: 8px;
          overflow-wrap: anywhere;
          line-height: 1.6;
        }

        .admin-storefront-link {
          display: block;
          margin-top: 22px;
          padding: 12px 10px;
          font-size: 13px;
          color: #424650;
          text-decoration: none;
        }

        .admin-storefront-link:hover {
          color: #000000;
        }

        .admin-main {
          min-width: 0;
          width: 100%;
          padding: 30px clamp(18px, 4vw, 44px);
        }

        .admin-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 16px;
          margin-bottom: 30px;
          scroll-margin-top: 20px;
        }

        .admin-header-copy {
          min-width: 0;
          flex: 1 1 280px;
        }

        .admin-eyebrow {
          color: #737780;
          font-size: 13px;
          margin-bottom: 8px;
        }

        .admin-page-title {
          font-size: clamp(26px, 3vw, 34px);
          letter-spacing: -1.2px;
          margin: 0;
          line-height: 1.2;
        }

        .admin-page-description {
          color: #737780;
          margin: 9px 0 0;
          font-size: 14px;
          line-height: 1.7;
        }

        .admin-verified-badge {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          background: #ffffff;
          border: 1px solid #e7e8eb;
          padding: 10px 14px;
          border-radius: 10px;
          font-size: 12px;
          color: #50545d;
          flex-shrink: 0;
        }

        .admin-verified-badge span {
          color: #16834a;
        }

        .admin-stats-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 16px;
          margin-bottom: 26px;
        }

        .admin-stat-card {
          min-width: 0;
          background: #ffffff;
          border: 1px solid #e7e8eb;
          border-radius: 14px;
          padding: 22px;
        }

        .admin-muted {
          color: #737780;
          font-size: 13px;
          line-height: 1.6;
        }

        .admin-stat-value {
          font-size: 32px;
          font-weight: 700;
          letter-spacing: -1px;
          margin: 16px 0 8px;
        }

        .admin-business-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 16px;
          margin-bottom: 26px;
        }

        .admin-business-card {
          min-width: 0;
          background: #ffffff;
          border: 1px solid #e7e8eb;
          border-radius: 14px;
          padding: 22px;
        }

        .admin-business-eyebrow {
          margin-bottom: 12px;
        }

        .admin-business-card h2 {
          font-size: 18px;
          line-height: 1.4;
          margin: 0 0 8px;
        }

        .admin-business-count {
          font-size: 28px;
          font-weight: 700;
          margin-bottom: 5px;
        }

        .admin-panel {
          min-width: 0;
          background: #ffffff;
          border: 1px solid #e7e8eb;
          border-radius: 14px;
          overflow: hidden;
          scroll-margin-top: 20px;
        }

        .admin-panel-header {
          padding: 22px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 12px;
          border-bottom: 1px solid #e7e8eb;
        }

        .admin-panel-header h2 {
          font-size: 18px;
          margin: 0;
          line-height: 1.4;
        }

        .admin-panel-header p {
          margin: 7px 0 0;
        }

        .admin-panel-actions {
          display: flex;
          gap: 10px;
          align-items: center;
          flex-wrap: wrap;
        }

        .admin-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 40px;
          padding: 10px 13px;
          border: 1px solid #dfe1e5;
          border-radius: 9px;
          text-decoration: none;
          color: #30333a;
          font-size: 12px;
          font-weight: 600;
          transition: background 150ms ease;
        }

        .admin-button:hover {
          background: #f3f4f6;
        }

        .admin-button.primary {
          background: #202124;
          color: #ffffff;
          border-color: #202124;
        }

        .admin-button.primary:hover {
          background: #393b40;
        }

        .admin-empty-state {
          padding: 36px 20px;
          text-align: center;
        }

        .admin-empty-icon {
          font-size: 30px;
          margin-bottom: 12px;
        }

        .admin-empty-state h3 {
          margin: 0 0 8px;
          font-size: 17px;
        }

        .admin-empty-state p {
          color: #737780;
          font-size: 13px;
          line-height: 1.7;
          margin: 0;
        }

        .admin-table-wrapper {
          width: 100%;
          max-width: 100%;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
        }

        .admin-table {
          width: 100%;
          min-width: 760px;
          border-collapse: collapse;
          text-align: left;
          font-size: 13px;
          white-space: nowrap;
        }

        .admin-table thead {
          background: #fafbfc;
          color: #737780;
        }

        .admin-table th {
          padding: 14px 18px;
          font-weight: 600;
          border-bottom: 1px solid #e7e8eb;
        }

        .admin-table td {
          padding: 16px 18px;
          border-bottom: 1px solid #f0f1f3;
          vertical-align: middle;
        }

        .admin-table tbody tr:last-child td {
          border-bottom: none;
        }

        .admin-product-cell {
          font-weight: 600;
        }

        .admin-product-slug {
          color: #737780;
          font-size: 12px;
          font-weight: 400;
          margin-top: 5px;
        }

        .admin-actions-cell {
          min-width: 170px;
        }

        .admin-status {
          display: inline-block;
          border-radius: 20px;
          padding: 5px 9px;
          font-size: 11px;
          font-weight: 600;
          white-space: nowrap;
        }

        .admin-status-active {
          background: #e8f6ed;
          color: #187544;
        }

        .admin-status-inactive {
          background: #f0f1f3;
          color: #626670;
        }

        .admin-inventory-panel {
          min-width: 0;
          background: #ffffff;
          border: 1px solid #e7e8eb;
          border-radius: 14px;
          padding: 22px;
          margin-top: 22px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 16px;
          scroll-margin-top: 20px;
        }

        .admin-inventory-panel h2 {
          font-size: 17px;
          margin: 0 0 7px;
        }

        .admin-inventory-panel p {
          margin: 0;
        }

        .admin-inventory-summary {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 7px;
          font-size: 13px;
        }

        .admin-low-stock {
          color: #b56b08;
        }

        .admin-out-stock {
          color: #c23b3b;
        }

        .admin-inventory-separator {
          color: #a0a3aa;
        }

        .admin-orders-panel {
          margin-top: 22px;
        }

        .admin-orders-header {
          border-bottom: 1px solid #e7e8eb;
        }

        .admin-order-stats {
          padding: 22px;
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 14px;
        }

        .admin-order-stat {
          min-width: 0;
        }

        .admin-order-stat-value {
          font-size: 26px;
          font-weight: 700;
          margin-top: 8px;
          overflow-wrap: anywhere;
        }

        .admin-revenue-note {
          margin-top: 5px;
        }

        .admin-no-orders {
          padding: 28px 22px;
          color: #737780;
          font-size: 13px;
          line-height: 1.7;
          border-top: 1px solid #e7e8eb;
        }

        .admin-order {
          min-width: 0;
          border-top: 1px solid #e7e8eb;
          padding: 20px;
          scroll-margin-top: 20px;
        }

        .admin-order-summary {
          cursor: pointer;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 12px;
          list-style-position: outside;
        }

        .admin-order-customer {
          min-width: 0;
          flex: 1 1 220px;
        }

        .admin-order-number {
          font-weight: 700;
          overflow-wrap: anywhere;
        }

        .admin-order-subtitle {
          color: #737780;
          font-size: 13px;
          line-height: 1.6;
          margin-top: 5px;
          overflow-wrap: anywhere;
        }

        .admin-order-total {
          text-align: right;
          flex-shrink: 0;
        }

        .admin-order-price {
          font-weight: 700;
          overflow-wrap: anywhere;
        }

        .admin-order-pending {
          margin-top: 7px;
          background: #fff3d8;
          color: #946200;
        }

        .admin-order-complete {
          margin-top: 7px;
          background: #e8f6ed;
          color: #187544;
        }

        .admin-payment-reference {
          overflow-wrap: anywhere;
          word-break: break-word;
        }

        .admin-order-details {
          min-width: 0;
          margin-top: 20px;
          padding: 16px;
          background: #f8f9fb;
          border-radius: 10px;
          font-size: 13px;
          line-height: 1.8;
          overflow-wrap: anywhere;
        }

        .admin-order-details h3 {
          margin: 0 0 10px;
          font-size: 14px;
        }

        .admin-delivery-address {
          margin-top: 10px;
        }

        .admin-ordered-products-heading {
          margin-top: 20px !important;
        }

        .admin-ordered-item {
          padding: 10px 0;
          border-top: 1px solid #e1e4e8;
        }

        .admin-ordered-item-name {
          font-weight: 600;
        }

        .admin-order-breakdown {
          margin-top: 12px;
        }

        .admin-order-grand-total {
          font-size: 15px;
          margin-top: 5px;
        }

        .admin-order-status-note {
          color: #737780;
          font-size: 13px;
          margin-bottom: 0;
        }

        .admin-footer {
          color: #8a8e96;
          font-size: 12px;
          padding: 26px 0 10px;
          text-align: center;
          line-height: 1.6;
        }

        .admin-loading,
        .admin-access-denied {
          min-height: 100vh;
          padding: 40px 20px;
          font-family: Arial, Helvetica, sans-serif;
          overflow-wrap: anywhere;
        }

        /* Tablets and smaller laptops */
        @media (max-width: 1100px) {
          .admin-layout {
            grid-template-columns: 205px minmax(0, 1fr);
          }

          .admin-sidebar {
            padding: 24px 14px;
          }

          .admin-main {
            padding: 26px 22px;
          }

          .admin-stats-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        /* Mobile phones */
        @media (max-width: 760px) {
          .admin-layout {
            grid-template-columns: minmax(0, 1fr);
          }

          .admin-sidebar {
            border-right: none;
            border-bottom: 1px solid #e7e8eb;
            padding: 16px;
          }

          .admin-brand {
            padding: 0 4px 16px;
          }

          .admin-brand-title {
            font-size: 22px;
          }

          .admin-workspace-label {
            padding: 0 4px 8px;
            font-size: 11px;
          }

          .admin-nav-list {
            grid-template-columns: repeat(4, minmax(0, 1fr));
            gap: 5px;
          }

          .admin-nav {
            flex-direction: column;
            justify-content: center;
            text-align: center;
            gap: 5px;
            padding: 10px 4px;
            min-height: 60px;
            font-size: 11px;
          }

          .admin-nav span {
            width: auto;
          }

          .admin-account-card {
            margin-top: 14px;
            padding: 12px;
          }

          .admin-account-email {
            font-size: 12px;
          }

          .admin-storefront-link {
            margin-top: 8px;
            padding: 10px 4px;
          }

          .admin-main {
            padding: 22px 14px;
          }

          .admin-header {
            align-items: flex-start;
            margin-bottom: 22px;
          }

          .admin-header-copy {
            flex-basis: 100%;
          }

          .admin-page-title {
            font-size: clamp(26px, 7vw, 32px);
          }

          .admin-page-description {
            font-size: 13px;
          }

          .admin-verified-badge {
            font-size: 11px;
            padding: 9px 11px;
          }

          .admin-stats-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 10px;
            margin-bottom: 18px;
          }

          .admin-stat-card {
            padding: 16px;
          }

          .admin-stat-value {
            font-size: 29px;
            margin: 12px 0 7px;
          }

          .admin-muted {
            font-size: 12px;
          }

          .admin-business-grid {
            grid-template-columns: minmax(0, 1fr);
            gap: 10px;
            margin-bottom: 18px;
          }

          .admin-business-card {
            padding: 18px;
          }

          .admin-panel-header {
            padding: 17px;
            align-items: flex-start;
          }

          .admin-panel-header h2 {
            font-size: 17px;
          }

          .admin-panel-actions {
            width: 100%;
          }

          .admin-button {
            flex: 1 1 auto;
            min-height: 42px;
            padding: 10px;
            text-align: center;
          }

          .admin-table {
            min-width: 760px;
          }

          .admin-inventory-panel {
            padding: 18px;
            align-items: flex-start;
          }

          .admin-inventory-summary {
            font-size: 12px;
          }

          .admin-order-stats {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            padding: 17px;
            gap: 20px 12px;
          }

          .admin-order-stat-value {
            font-size: 23px;
          }

          .admin-order {
            padding: 16px;
          }

          .admin-order-summary {
            align-items: flex-start;
          }

          .admin-order-customer {
            flex-basis: 100%;
          }

          .admin-order-total {
            text-align: left;
          }

          .admin-order-details {
            padding: 13px;
            font-size: 12px;
          }

          .admin-footer {
            padding-top: 22px;
          }
        }

        /* Small phones */
        @media (max-width: 420px) {
          .admin-sidebar {
            padding: 13px;
          }

          .admin-main {
            padding: 18px 11px;
          }

          .admin-nav {
            font-size: 10px;
            min-height: 56px;
          }

          .admin-stats-grid {
            gap: 8px;
          }

          .admin-stat-card {
            padding: 13px;
            border-radius: 12px;
          }

          .admin-stat-value {
            font-size: 27px;
          }

          .admin-business-card {
            padding: 15px;
          }

          .admin-panel-header {
            padding: 14px;
          }

          .admin-panel-actions {
            gap: 7px;
          }

          .admin-button {
            font-size: 11px;
            padding: 9px 7px;
          }

          .admin-order-stats {
            padding: 14px;
            gap: 18px 10px;
          }

          .admin-order-stat-value {
            font-size: 21px;
          }

          .admin-order {
            padding: 13px;
          }

          .admin-order-details {
            padding: 11px;
          }
        }

        /* Respect reduced-motion preferences */
        @media (prefers-reduced-motion: reduce) {
          *,
          *::before,
          *::after {
            scroll-behavior: auto !important;
            transition-duration: 0.01ms !important;
            animation-duration: 0.01ms !important;
          }
        }
      `}</style>
    </div>
  );
}

export default function AdminPage() {
  return (
    <Suspense fallback={<LoadingAdmin />}>
      <AdminContent />
    </Suspense>
  );
}