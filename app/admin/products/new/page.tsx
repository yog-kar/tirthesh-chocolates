
import Link from "next/link";
import ProductForm from "./ProductForm";

export default function NewProductPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f5f6f8",
        color: "#202124",
        padding: "48px 20px",
        fontFamily: "Arial, Helvetica, sans-serif",
      }}
    >
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        <Link
          href="/admin"
          style={{
            color: "#555b65",
            textDecoration: "none",
            fontSize: 14,
          }}
        >
          ← Back to Owner Studio
        </Link>

        <header style={{ margin: "28px 0" }}>
          <p
            style={{
              color: "#777d87",
              fontSize: 12,
              letterSpacing: 2,
              fontWeight: 600,
            }}
          >
            OWNER STUDIO / PRODUCTS
          </p>

          <h1
            style={{
              fontSize: "clamp(30px, 5vw, 42px)",
              letterSpacing: -1.5,
              margin: "12px 0",
            }}
          >
            Add a product
          </h1>

          <p style={{ color: "#686e78", lineHeight: 1.7 }}>
            Add products to either Tirthesh Chocolates or Jayanand Foods.
            Your product details will be saved to your database.
          </p>
        </header>

        <section
          style={{
            background: "#fff",
            border: "1px solid #e2e4e8",
            borderRadius: 16,
            padding: "clamp(20px, 4vw, 32px)",
          }}
        >
          <ProductForm />
        </section>
      </div>
    </main>
  );
}
