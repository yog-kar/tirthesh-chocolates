
import { NextResponse } from "next/server";
import { PaymentMethod, PaymentStatus } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/prisma";

type CheckoutItem = {
  productId: string;
  quantity: number;
};

type CheckoutBody = {
  customerName?: string;
  email?: string;
  phone?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  paymentMethod?: string;
  paymentReference?: string;
  items?: CheckoutItem[];
};

function clean(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(request: Request) {
  try {
    let body: CheckoutBody;

    try {
      body = (await request.json()) as CheckoutBody;
    } catch {
      return NextResponse.json(
        { error: "Invalid request. Please try again." },
        { status: 400 },
      );
    }

    const customerName = clean(body.customerName);
    const email = clean(body.email);
    const phone = clean(body.phone);
    const addressLine1 = clean(body.addressLine1);
    const addressLine2 = clean(body.addressLine2);
    const city = clean(body.city);
    const state = clean(body.state);
    const postalCode = clean(body.postalCode);
    const paymentMethod = clean(body.paymentMethod).toUpperCase();
    const paymentReference = clean(body.paymentReference);

    if (
      !customerName ||
      !phone ||
      !addressLine1 ||
      !city ||
      !state ||
      !/^\d{6}$/.test(postalCode)
    ) {
      return NextResponse.json(
        { error: "Please provide valid customer and delivery details." },
        { status: 400 },
      );
    }

    if (
      customerName.length > 120 ||
      phone.length > 20 ||
      addressLine1.length > 200 ||
      addressLine2.length > 200 ||
      city.length > 100 ||
      state.length > 100 ||
      (email &&
        (email.length > 254 ||
          !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)))
    ) {
      return NextResponse.json(
        { error: "One or more checkout fields are invalid." },
        { status: 400 },
      );
    }

    if (
      paymentMethod !== PaymentMethod.UPI &&
      paymentMethod !== PaymentMethod.COD
    ) {
      return NextResponse.json(
        { error: "Please select a valid payment method." },
        { status: 400 },
      );
    }

    if (
      paymentMethod === PaymentMethod.COD &&
      state.trim().toLowerCase() !== "maharashtra"
    ) {
      return NextResponse.json(
        {
          error:
            "Cash on Delivery is currently available only in Maharashtra. Please choose UPI for this delivery address.",
        },
        { status: 400 },
      );
    }

    if (paymentMethod === PaymentMethod.UPI) {
      if (
        paymentReference.length < 6 ||
        paymentReference.length > 100 ||
        !/^[a-zA-Z0-9]+$/.test(paymentReference)
      ) {
        return NextResponse.json(
          {
            error:
              "Please enter a valid UPI transaction ID or UTR number.",
          },
          { status: 400 },
        );
      }
    }

    if (
      !Array.isArray(body.items) ||
      body.items.length === 0 ||
      body.items.length > 50
    ) {
      return NextResponse.json(
        { error: "Your cart is empty or contains too many products." },
        { status: 400 },
      );
    }

    const quantities = new Map<string, number>();

    for (const item of body.items) {
      if (
        !item ||
        typeof item.productId !== "string" ||
        !item.productId.trim() ||
        !Number.isSafeInteger(item.quantity) ||
        item.quantity < 1 ||
        item.quantity > 100
      ) {
        return NextResponse.json(
          { error: "A product or quantity in your cart is invalid." },
          { status: 400 },
        );
      }

      const id = item.productId.trim();
      quantities.set(id, (quantities.get(id) ?? 0) + item.quantity);
    }

    const productIds = [...quantities.keys()];

    if (productIds.some((id) => quantities.get(id)! > 100)) {
      return NextResponse.json(
        { error: "The quantity for a product cannot exceed 100." },
        { status: 400 },
      );
    }

    const order = await prisma.$transaction(
      async (tx) => {
        const products = await tx.product.findMany({
          where: {
            id: { in: productIds },
            isActive: true,
          },
        });

        if (products.length !== productIds.length) {
          throw new Error("PRODUCT_UNAVAILABLE");
        }

        for (const product of products) {
          const quantity = quantities.get(product.id)!;

          if (product.stock < quantity) {
            throw new Error(`INSUFFICIENT_STOCK:${product.name}`);
          }
        }

        // Calculate prices from the database, never from browser-submitted prices.
        const subtotalCents = products.reduce((sum, product) => {
          const unitPriceCents = Math.round(Number(product.price) * 100);
          return sum + unitPriceCents * quantities.get(product.id)!;
        }, 0);

        // Shipping is temporarily free.
        const shippingFeeCents = 0;
        const totalCents = subtotalCents + shippingFeeCents;

        const initialPaymentStatus =
          paymentMethod === PaymentMethod.UPI
            ? PaymentStatus.AWAITING_VERIFICATION
            : PaymentStatus.PENDING;

        return tx.order.create({
          data: {
            customerName,
            email: email || null,
            phone,
            addressLine1,
            addressLine2: addressLine2 || null,
            city,
            state,
            postalCode,
            country: "India",
            subtotal: (subtotalCents / 100).toFixed(2),
            shippingFee: (shippingFeeCents / 100).toFixed(2),
            total: (totalCents / 100).toFixed(2),
            paymentMethod,
            paymentStatus: initialPaymentStatus,
            paymentReference:
              paymentMethod === PaymentMethod.UPI
                ? paymentReference
                : null,
            items: {
              create: products.map((product) => {
                const quantity = quantities.get(product.id)!;
                const unitPriceCents = Math.round(
                  Number(product.price) * 100,
                );

                return {
                  productId: product.id,
                  productName: product.name,
                  productSlug: product.slug,
                  business: product.business,
                  unitPrice: (unitPriceCents / 100).toFixed(2),
                  quantity,
                  lineTotal: (
                    (unitPriceCents * quantity) /
                    100
                  ).toFixed(2),
                  imageUrl: product.imageUrl || null,
                };
              }),
            },
          },
          select: {
            id: true,
            orderNumber: true,
            total: true,
            status: true,
            paymentMethod: true,
            paymentStatus: true,
          },
        });
      },
      {
        maxWait: 10000,
        timeout: 20000,
      },
    );

    return NextResponse.json(
      {
        message: "Order created successfully.",
        order: {
          ...order,
          total: Number(order.total),
        },
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "PRODUCT_UNAVAILABLE") {
        return NextResponse.json(
          { error: "One or more products are no longer available." },
          { status: 409 },
        );
      }

      if (error.message.startsWith("INSUFFICIENT_STOCK:")) {
        const productName = error.message
          .split(":")
          .slice(1)
          .join(":");

        return NextResponse.json(
          { error: `Not enough stock available for ${productName}.` },
          { status: 409 },
        );
      }
    }

    console.error("Order creation failed:", error);

    return NextResponse.json(
      { error: "We couldn't create your order. Please try again." },
      { status: 500 },
    );
  }
}