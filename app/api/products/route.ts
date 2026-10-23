
import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

const OWNER_EMAIL = process.env.ADMIN_EMAIL?.trim().toLowerCase();

async function isOwner() {
  const { userId } = await auth();

  if (!userId || !OWNER_EMAIL) {
    return false;
  }

  const user = await currentUser();

  const email = user?.emailAddresses.find(
    (item) => item.id === user.primaryEmailAddressId,
  )?.emailAddress;

  return Boolean(email && email.trim().toLowerCase() === OWNER_EMAIL);
}

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ products });
  } catch (error) {
    console.error("Failed to fetch products:", error);

    return NextResponse.json(
      { error: "Unable to fetch products" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    if (!(await isOwner())) {
      return NextResponse.json(
        { error: "Unauthorized. Owner access is required." },
        { status: 403 },
      );
    }

    const body = await request.json();

    const business = body.business;
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const slug = typeof body.slug === "string" ? body.slug.trim() : "";
    const description =
      typeof body.description === "string" ? body.description.trim() : "";
    const imageUrl =
      typeof body.imageUrl === "string" ? body.imageUrl.trim() : "";
    const price = Number(body.price);
    const stock = Number(body.stock);

    if (
      !["TIRTHESH_CHOCOLATES", "JAYANAND_FOODS"].includes(business) ||
      !name ||
      name.length > 160 ||
      !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) ||
      description.length > 5000 ||
      !Number.isFinite(price) ||
      price < 0 ||
      !Number.isInteger(stock) ||
      stock < 0 ||
      (imageUrl &&
        (!/^https?:\/\//i.test(imageUrl) || imageUrl.length > 2048))
    ) {
      return NextResponse.json(
        { error: "Please check the product details and try again." },
        { status: 400 },
      );
    }

    const product = await prisma.product.create({
      data: {
        business,
        name,
        slug,
        description,
        price,
        stock,
        imageUrl,
        isActive: true,
      },
    });

    return NextResponse.json({ product }, { status: 201 });
  } catch (error) {
    console.error("Failed to create product:", error);

    // Prisma error P2002 means a unique value, such as the slug, already exists.
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "That product URL slug already exists. Please choose another." },
        { status: 409 },
      );
    }

    return NextResponse.json(
      { error: "Unable to create product. Check the server terminal for details." },
      { status: 500 },
    );
  }
}
