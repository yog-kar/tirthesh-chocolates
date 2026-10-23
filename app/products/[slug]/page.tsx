import AddToCartButton from "@/components/cart/AddToCartButton";
import Link from "next/link";
import { notFound } from "next/navigation";
import "./product.css";
export const instant = false;

type Product = {
  id: string;
  business: "TIRTHESH_CHOCOLATES" | "JAYANAND_FOODS";
  name: string;
  slug: string;
  description: string | null;
  price: number | string;
  stock: number;
  imageUrl: string | null;
};

async function getProduct(slug: string): Promise<Product | null> {
  const { prisma } = await import("@/lib/prisma");

  const product = await prisma.product.findFirst({
    where: { slug, isActive: true },
  });

  if (!product) return null;

  return {
    ...product,
    price: Number(product.price),
  };
}

export default async function ProductDetailsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProduct(slug);

  if (!product) notFound();

  const isFood = product.business === "JAYANAND_FOODS";
  const brand = isFood ? "Jayanand Foods" : "Tirthesh Chocolates";

  return (
    <main className="detail-page">
      <header className="detail-header">
        <Link href={isFood ? "/jayanand-foods" : "/#collections"} className="detail-back">
          <span aria-hidden="true">←</span> Back to {brand}
        </Link>
        <Link href="/" className="detail-wordmark">
          {brand}
          <span>MADE FOR MOMENTS THAT MATTER</span>
        </Link>
      </header>

      <div className="detail-breadcrumb">
        <Link href="/">Home</Link>
        <span>/</span>
        <span>{brand}</span>
        <span>/</span>
        <span>{product.name}</span>
      </div>

      <section className="detail-layout">
        <div className="detail-gallery">
          <div className="detail-image">
            {product.imageUrl ? (
              <img src={product.imageUrl} alt={product.name} />
            ) : (
              <div className="detail-image-placeholder">
                <span>IMAGE COMING SOON</span>
              </div>
            )}
            <span className="detail-image-caption">A LITTLE SOMETHING SPECIAL</span>
          </div>
          <p className="detail-image-note">
            Thoughtfully selected. Beautifully presented.
          </p>
        </div>

        <div className="detail-info">
          <p className="detail-eyebrow">{brand.toUpperCase()} · THE COLLECTION</p>

          <h1>{product.name}</h1>

          <div className="detail-rule" />

          <div className="detail-price-row">
            <span className="detail-price">
              ₹{product.price.toLocaleString("en-IN", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
            <span className="detail-tax-note">Price per product</span>
          </div>

          <p className="detail-description">
            {product.description || "Discover a special addition to our collection, chosen to make everyday moments a little more memorable."}
          </p>

          <div className={`detail-stock ${product.stock > 0 ? "is-available" : "is-unavailable"}`}>
            <span className="detail-stock-dot" />
            {product.stock > 0 ? "Available to order" : "Currently unavailable"}
          </div>

          <AddToCartButton
  product={{
    id: product.id,
    slug: product.slug,
    business: product.business,
    name: product.name,
    price: Number(product.price),
    imageUrl: product.imageUrl,
    stock: product.stock,
  }}
/>

<p className="detail-purchase-note">
  A thoughtful treat for yourself or someone special.
</p>

          <div className="detail-benefits">
            <div>
              <span className="detail-benefit-icon">✳</span>
              <span>Selected with care</span>
            </div>
            <div>
              <span className="detail-benefit-icon">♡</span>
              <span>Made for sharing</span>
            </div>
          </div>

          <div className="detail-meta">
            <div>
              <span>PRODUCT</span>
              <span>{product.name}</span>
            </div>
            <div>
              <span>COLLECTION</span>
              <span>{brand}</span>
            </div>
          </div>
        </div>
      </section>

      <footer className="detail-footer">
        <span>© 2026 YogKar</span>
        <span>Crafted with care for {brand}</span>
        <Link href={isFood ? "/jayanand-foods" : "/#collections"}>
          Explore more products ↗
        </Link>
      </footer>
    </main>
  );
}
