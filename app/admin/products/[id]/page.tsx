export const instant = false;
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import EditProductForm from "./EditProductForm";


export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const user = await currentUser();
  const ownerEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();

  const email = user?.emailAddresses
    .find((item) => item.id === user.primaryEmailAddressId)
    ?.emailAddress.trim().toLowerCase();

  if (!ownerEmail || email !== ownerEmail) {
    redirect("/admin");
  }

  const { id } = await params;

  const product = await prisma.product.findUnique({
    where: { id },
  });

  if (!product) {
    notFound();
  }

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
            Edit product
          </h1>

          <p style={{ color: "#686e78", lineHeight: 1.7 }}>
            Update the product details, price, inventory, availability,
            and primary photo.
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
          <EditProductForm
            product={{
              id: product.id,
              business: product.business,
              name: product.name,
              slug: product.slug,
              description: product.description,
              price: product.price.toString(),
              stock: product.stock,
              imageUrl: product.imageUrl,
              isActive: product.isActive,
            }}
          />
        </section>
      </div>
    </main>
  );
}