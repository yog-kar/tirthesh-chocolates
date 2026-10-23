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

  const email = user?.emailAddresses
    .find((item) => item.id === user.primaryEmailAddressId)
    ?.emailAddress
    .trim()
    .toLowerCase();

  return email === OWNER_EMAIL;
}

type RouteContext = {
  params: Promise<{ id: string }>;
};

// Update a product
export async function PATCH(
  request: Request,
  { params }: RouteContext
) {
  try {
    if (!(await isOwner())) {
      return NextResponse.json(
        { error: "Unauthorized. Owner access required." },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();

    const existingProduct = await prisma.product.findUnique({
      where: { id },
    });

    if (!existingProduct) {
      return NextResponse.json(
        { error: "Product not found." },
        { status: 404 }
      );
    }

    const data: {
      name?: string;
      slug?: string;
      description?: string;
      price?: number;
      stock?: number;
      imageUrl?: string;
      isActive?: boolean;
    } = {};

    if (body.name !== undefined) {
      if (typeof body.name !== "string" || !body.name.trim()) {
        return NextResponse.json(
          { error: "Product name is required." },
          { status: 400 }
        );
      }

      data.name = body.name.trim();
    }

    if (body.slug !== undefined) {
      if (
        typeof body.slug !== "string" ||
        !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(body.slug)
      ) {
        return NextResponse.json(
          {
            error:
              "Slug must contain lowercase letters, numbers, and single hyphens.",
          },
          { status: 400 }
        );
      }

      data.slug = body.slug;
    }

    if (body.description !== undefined) {
      if (typeof body.description !== "string") {
        return NextResponse.json(
          { error: "Description must be text." },
          { status: 400 }
        );
      }

      data.description = body.description.trim();
    }

    if (body.price !== undefined) {
      const price = Number(body.price);

      if (!Number.isFinite(price) || price < 0) {
        return NextResponse.json(
          { error: "Enter a valid non-negative price." },
          { status: 400 }
        );
      }

      data.price = price;
    }

    if (body.stock !== undefined) {
      const stock = Number(body.stock);

      if (!Number.isInteger(stock) || stock < 0) {
        return NextResponse.json(
          { error: "Stock must be a non-negative whole number." },
          { status: 400 }
        );
      }

      data.stock = stock;
    }

    if (body.imageUrl !== undefined) {
      if (typeof body.imageUrl !== "string") {
        return NextResponse.json(
          { error: "Image URL must be text." },
          { status: 400 }
        );
      }

      const imageUrl = body.imageUrl.trim();

      if (
        imageUrl &&
        !/^https?:\/\//i.test(imageUrl)
      ) {
        return NextResponse.json(
          { error: "Image URL must begin with http:// or https://." },
          { status: 400 }
        );
      }

      data.imageUrl = imageUrl;
    }

    if (body.isActive !== undefined) {
      if (typeof body.isActive !== "boolean") {
        return NextResponse.json(
          { error: "Availability must be true or false." },
          { status: 400 }
        );
      }

      data.isActive = body.isActive;
    }

    const updatedProduct = await prisma.product.update({
      where: { id },
      data,
    });

    return NextResponse.json({
      success: true,
      product: updatedProduct,
    });
  } catch (error) {
    console.error("Product update failed:", error);

    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "That product slug is already being used." },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Unable to update the product." },
      { status: 500 }
    );
  }
}

// Remove a product from the active catalogue
export async function DELETE(
  _request: Request,
  { params }: RouteContext
) {
  try {
    if (!(await isOwner())) {
      return NextResponse.json(
        { error: "Unauthorized. Owner access required." },
        { status: 403 }
      );
    }

    const { id } = await params;

    const product = await prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      return NextResponse.json(
        { error: "Product not found." },
        { status: 404 }
      );
    }

    // Preserve historical orders by deactivating instead of hard-deleting.
    const updatedProduct = await prisma.product.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({
      success: true,
      message: "Product removed from the active catalogue.",
      product: updatedProduct,
    });
  } catch (error) {
    console.error("Product removal failed:", error);

    return NextResponse.json(
      { error: "Unable to remove the product." },
      { status: 500 }
    );
  }
}