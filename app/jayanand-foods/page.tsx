
import "../../app/home.css";

import Link from "next/link";
import AddToCartButton from "@/components/cart/AddToCartButton";

export const instant = false;

type Product = {
  id: string;
  slug: string;
  business: "JAYANAND_FOODS";
  name: string;
  description: string;
  price: number;
  imageUrl: string | null;
  stock: number;
};

async function getJayanandProducts(): Promise<Product[]> {
  try {
    const { prisma } = await import("@/lib/prisma");

    const products = await prisma.product.findMany({
      where: {
        business: "JAYANAND_FOODS",
        isActive: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return products.map((product) => ({
      id: product.id,
      slug: product.slug,
      business: "JAYANAND_FOODS",
      name: product.name,
      description: product.description,
      price: Number(product.price),
      imageUrl: product.imageUrl,
      stock: product.stock,
    }));
  } catch (error) {
    console.error("Failed to load Jayanand Foods products:", error);
    return [];
  }
}

export default async function JayanandFoodsPage() {
  const products = await getJayanandProducts();

  return (
    <main className="jf-page">
      <header className="jf-header">
        <Link href="/" className="jf-brand">
          JAYANAND <span>FOODS</span>
        </Link>

        <nav>
          <a href="#products">Our Papads</a>
          <a href="#about">Our Tradition</a>
          <Link href="/cart" className="jf-cart-link">
            Cart ↗
          </Link>
          <Link href="/">Tirthesh Chocolates ↗</Link>
        </nav>
      </header>

      <section className="jf-hero">
        <div className="jf-hero__copy">
          <span className="jf-eyebrow">
            TRADITIONAL TASTE · PREMIUM QUALITY
          </span>

          <h1>
            A taste of
            <br />
            <em>home.</em>
          </h1>

          <p>
            Discover traditional papads made to bring familiar flavours,
            satisfying crunch, and a little warmth to every meal.
          </p>

          <a href="#products" className="jf-button">
            Explore our papads <span>↘</span>
          </a>
        </div>

        <div className="jf-hero__image">
          <img
            src="/images/jayanandfoods/jayanand.png"
            alt="Jayanand Foods traditional papad varieties"
          />
        </div>
      </section>

      <section className="jf-products" id="products">
        <div className="jf-section-heading">
          <div>
            <span className="jf-eyebrow">FROM OUR KITCHEN TO YOURS</span>
            <h2>
              Our <em>papads.</em>
            </h2>
          </div>

          <p>Explore the varieties available from Jayanand Foods.</p>
        </div>

        {products.length > 0 ? (
          <div className="jf-grid">
            {products.map((product) => (
              <article className="jf-card" key={product.id}>
                <Link
                  href={`/products/${encodeURIComponent(product.slug)}`}
                  className="jf-card__image"
                  aria-label={`View ${product.name}`}
                >
                  {product.imageUrl ? (
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      loading="lazy"
                    />
                  ) : (
                    <div className="jf-card__placeholder">
                      Jayanand Foods
                    </div>
                  )}
                </Link>

                <h3>{product.name}</h3>

                {product.description && <p>{product.description}</p>}

                <span className="jf-card__price">
                  ₹
                  {product.price.toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>

                {product.stock > 0 ? (
                  <div className="jf-card__actions">
                    <AddToCartButton
                      product={{
                        id: product.id,
                        slug: product.slug,
                        business: product.business,
                        name: product.name,
                        price: product.price,
                        imageUrl: product.imageUrl,
                        stock: product.stock,
                      }}
                    />

                    <Link
                      href={`/checkout?product=${encodeURIComponent(product.id)}`}
                      className="jf-buy-now"
                    >
                      BUY NOW ↗
                    </Link>
                  </div>
                ) : (
                  <p className="jf-out-of-stock">Currently out of stock</p>
                )}
              </article>
            ))}
          </div>
        ) : (
          <div className="jf-empty">
            <span className="jf-empty__mark">J</span>
            <h3>Something delicious is coming.</h3>
            <p>
              Our papad catalogue is being prepared. Please check back soon.
            </p>
            <p>
              <Link href="/admin/products/new">
                Add your first product in the owner dashboard ↗
              </Link>
            </p>
          </div>
        )}
      </section>

      <section className="jf-about" id="about">
        <div>
          <span className="jf-eyebrow">ROOTED IN TRADITION</span>
          <h2>
            Simple pleasures.
            <br />
            <em>Familiar flavours.</em>
          </h2>
        </div>

        <p>
          Jayanand Foods celebrates the flavours we grow up with. Pair our
          papads with everyday meals, family gatherings, and moments shared
          around the table.
        </p>
      </section>

      <footer className="jf-footer">
        <Link href="/" className="jf-brand">
          JAYANAND <span>FOODS</span>
        </Link>

        <span>Traditional taste, for every home.</span>

        <Link href="/cart">View cart ↗</Link>
        <Link href="/">Visit Tirthesh Chocolates ↗</Link>
      </footer>

      <style>{`
  .jf-cart-link {
    white-space: nowrap;
  }

  /* Keep product cards contained within their grid */
  .jf-card {
    min-width: 0;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    align-items: stretch;
  }

  .jf-card__image {
    display: block;
    width: 100%;
    overflow: hidden;
  }

  .jf-card__image img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .jf-card h3,
  .jf-card > p,
  .jf-card__price {
    flex-shrink: 0;
  }

  /* Compact cart controls inside catalogue cards */
  .jf-card__actions {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
    width: 100%;
    margin-top: 16px;
  }

  .jf-card__actions > div {
    width: 100%;
    min-width: 0;
  }

  .jf-card__actions .detail-purchase {
    display: flex;
    flex-direction: column;
    width: 100%;
    margin: 0;
    padding: 0;
    border: 0;
  }

  .jf-card__actions .detail-quantity {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    width: 100%;
    margin: 0 0 10px;
    min-height: 40px;
  }

  .jf-card__actions .detail-quantity__controls {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    min-width: 110px;
    padding: 5px 10px;
    box-sizing: border-box;
  }

  .jf-card__actions .detail-cart-button {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    min-height: 46px;
    padding: 12px 15px;
    margin: 0;
    box-sizing: border-box;
    font-size: 10px;
    letter-spacing: 1.2px;
  }

  .jf-card__actions .detail-cart-feedback {
    margin: 8px 0 0;
    font-size: 12px;
    line-height: 1.6;
  }

  .jf-buy-now {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    min-height: 46px;
    padding: 12px 16px;
    box-sizing: border-box;
    background: #a77b38;
    color: #fff;
    text-decoration: none;
    font-size: 10px;
    letter-spacing: 1.5px;
    font-weight: 600;
    transition: background 180ms ease;
  }

  .jf-buy-now:hover {
    background: #8c642b;
  }

  .jf-out-of-stock {
    margin-top: 14px;
    color: #a33;
    font-size: 13px;
  }

  /* Keep the catalogue and its following section separated */
  .jf-products {
    position: relative;
    display: flow-root;
    clear: both;
  }

  .jf-grid {
    align-items: start;
  }

  .jf-about {
    position: relative;
    clear: both;
    margin-top: 0;
  }

  @media (max-width: 600px) {
    .jf-card__actions .detail-quantity__controls {
      min-width: 100px;
    }
  }
`}</style>
    </main>
  );
}
