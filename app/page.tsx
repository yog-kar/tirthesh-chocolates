export const instant = false;

import "./home.css";
import HeroScroll from "../components/home/HeroScroll";
import { SocialLinks } from "../components/SocialLinks";

type Product = {
  id: string;
  business: "TIRTHESH_CHOCOLATES" | "JAYANAND_FOODS";
  name: string;
  slug: string;
  description: string;
  price: string | number;
  imageUrl: string;
};

async function getProducts(): Promise<Product[]> {
  try {
    const { prisma } = await import("@/lib/prisma");

    const products = await prisma.product.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
    });

    return products.map((product) => ({
      ...product,
      price: Number(product.price),
    }));
  } catch (error) {
    console.error("Failed to load homepage products:", error);
    return [];
  }
}
const chocolateCollections = [
  {
    number: "01",
    name: "Signature Chocolates",
    description: "Discover chocolates made for life's sweetest moments.",
    image:
      "https://images.unsplash.com/photo-1548907040-4d42e3e4c0a4?auto=format&fit=crop&w=1000&q=85",
    className: "collection-card--large",
  },
  {
    number: "02",
    name: "Chocolate Gifts",
    description: "Thoughtful treats for celebrations and special occasions.",
    image:
      "https://images.unsplash.com/photo-1549007994-cb92caebd54b?auto=format&fit=crop&w=900&q=85",
    className: "",
  },
  {
    number: "03",
    name: "Sweet Indulgences",
    description: "A little something to make an ordinary day special.",
    image:
      "https://images.unsplash.com/photo-1481391319762-47dff72954d9?auto=format&fit=crop&w=900&q=85",
    className: "",
  },
];

function ArrowIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M5 12h14m-6-6 6 6-6 6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function BrandMark() {
  return (
    <a href="#home" className="brand-mark" aria-label="Tirthesh Chocolates home">
      <span className="brand-mark__name">TIRTHESH</span>
      <span className="brand-mark__subtitle">C H O C O L A T E S</span>
    </a>
  );
}

export default async function HomePage() {
  const products = await getProducts();

  const chocolateProducts = products.filter(
    (product) => product.business === "TIRTHESH_CHOCOLATES",
  );

  const jayanandProducts = products.filter(
    (product) => product.business === "JAYANAND_FOODS",
  );
  return (
    <main>
      <header className="site-header">
        <div className="site-header__inner">
          <BrandMark />

          <nav className="desktop-nav" aria-label="Main navigation">
            <a href="#story">Our Story</a>
            <a href="#collections">Collections</a>
            <a href="#jayanand">Jayanand Foods</a>
          </nav>

          <a href="#collections" className="header-cta">
            Discover More <ArrowIcon />
          </a>
        </div>
      </header>

    <HeroScroll>
    <section className="hero" id="home">
        <div className="hero__image" aria-hidden="true" />
        <div className="hero__shade" aria-hidden="true" />

        <div className="hero__content container">
          <span className="hero__eyebrow">
            THE ART OF CHOCOLATE
          </span>

          <h1 className="hero__title">
            A little indulgence.
            <br />
            <em>A lasting impression.</em>
          </h1>

          <p className="hero__description">
            Discover a world of chocolate, thoughtful gifting, and
            moments worth remembering.
          </p>

          <div className="hero__actions">
            <a href="#collections" className="button button-light">
              Explore Our Collections <ArrowIcon />
            </a>
            <a href="#story" className="hero__text-link">
              Discover our story <span>↗</span>
            </a>
          </div>
        </div>

        <div className="hero__bottom">
          <span>MADE FOR MOMENTS THAT MATTER</span>
          <a href="#story" aria-label="Scroll to discover">
            SCROLL TO DISCOVER <span>↓</span>
          </a>
          <span>01 / 04</span>
        </div>
      </section>
    </HeroScroll>

      <section className="intro section" id="story">
        <div className="container intro__grid">
          <div className="intro__label">
            <span className="section-label">A SWEETER PERSPECTIVE</span>
            <span className="intro__vertical-text">
              THE TIRTHESH EXPERIENCE
            </span>
          </div>

          <div className="intro__copy">
            <h2 className="display-title">
              Some things are
              <br />
              meant to be <em>savoured.</em>
            </h2>

            <p>
              A gift, a celebration, a quiet moment for yourself.
              Chocolate has a way of making ordinary moments feel
              extraordinary. At Tirthesh Chocolates, every discovery
              begins with that feeling.
            </p>

            <a href="#collections" className="text-link">
              Discover the experience <ArrowIcon />
            </a>
          </div>

          <div className="intro__visual">
            <div className="intro__image" role="img" aria-label="Artisan chocolate assortment" />
            <span className="intro__image-caption">
              LITTLE MOMENTS. BEAUTIFULLY MADE.
            </span>
          </div>
        </div>
      </section>

      <section className="collections section" id="collections">
        <div className="container">
          <div className="section-heading">
            <div>
              <span className="section-label">FIND YOUR FAVOURITE</span>
              <h2 className="display-title">
                A world of <em>indulgence.</em>
              </h2>
            </div>
            <p>
              Explore our collections and discover something
              worth sharing.
            </p>
          </div>

          <div className="product-grid">
  {chocolateProducts.map((product) => (
    <a
  href={`/products/${encodeURIComponent(product.slug)}`}
  className="product-card"
  key={product.id}
  style={{ color: "inherit", textDecoration: "none", display: "block" }}
>
      <div className="product-card__image-wrap">
        {product.imageUrl ? (
          <img
            className="product-card__image"
            src={product.imageUrl}
            alt={product.name}
            loading="lazy"
          />
        ) : (
          <div
            className="product-card__image"
            role="img"
            aria-label={`${product.name}, image coming soon`}
          />
        )}
      </div>

      <span className="product-card__brand">
        Tirthesh Chocolates
      </span>

      <h3 className="product-card__name">{product.name}</h3>

      {product.description && (
        <p className="product-card__description">
          {product.description}
        </p>
      )}

      <p className="product-card__price">
        ₹{product.price.toLocaleString("en-IN", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}
      </p>
    </a>
  ))}
</div>

{chocolateProducts.length === 0 && (
  <p className="product-catalogue__message">
    Our chocolate collection is being prepared. Please visit us again soon.
  </p>
)}
          
        </div>
      </section>


      <section className="jayanand section" id="jayanand">
        <div className="container jayanand__grid">
          <div className="jayanand__visual">
            <div className="jayanand__image" role="img" aria-label="Traditional Indian papad served with a meal" />
            <span className="jayanand__stamp">A TASTE OF TRADITION</span>
          </div>

          <div className="jayanand__content">
            <span className="section-label">FROM OUR FOOD FAMILY</span>
            <p className="jayanand__overline">INTRODUCING</p>
            <h2 className="display-title">
              Jayanand
              <br />
              <em>Foods.</em>
            </h2>
            <p>
              A different kind of delight, rooted in the familiar
              flavours of home. Discover our sister business and its
              range of traditional papads.
            </p>
            <a href="/jayanand-foods" className="button button-primary">
              Discover Jayanand Foods <ArrowIcon />
            </a>
          </div>
        </div>
      </section>

      <footer className="site-footer">
        <div className="container">
          <div className="site-footer__top">
            <BrandMark />
            <p>
              Thoughtful chocolates.
              <br />
              Moments worth remembering.
            </p>
            <nav aria-label="Footer navigation">
              <a href="#story">Our Story</a>
              <a href="#collections">Collections</a>
              <a href="/jayanand-foods">Jayanand Foods</a>
            </nav>
          </div>
          <div style={{ display: "flex", justifyContent: "center", margin: "20px 0" }}>
  <SocialLinks />
</div>
          <div className="site-footer__bottom">
            <span>© 2026 Tirthesh Chocolates </span>
            <span>Crafted with ❤️ by YogKar</span>
          </div>
        </div>
      </footer>
    </main>
  );
}
