
import { NextResponse } from "next/server";
import { PaymentStatus } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { isStoreOwner } from "@/lib/admin-auth";

type RouteContext = {
  params: Promise<{ orderId: string }>;
};

export async function POST(
  request: Request,
  { params }: RouteContext,
) {
  try {
    // Only the authenticated store owner may update payment status.
    const authorized = await isStoreOwner();

    if (!authorized) {
      return NextResponse.json(
        { error: "Unauthorized. Store owner access is required." },
        { status: 403 },
      );
    }

    const { orderId } = await params;

    if (!orderId?.trim()) {
      return NextResponse.json(
        { error: "A valid order ID is required." },
        { status: 400 },
      );
    }

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "The request body must contain valid JSON." },
        { status: 400 },
      );
    }

    if (
      typeof body !== "object" ||
      body === null ||
      !("action" in body) ||
      typeof body.action !== "string"
    ) {
      return NextResponse.json(
        { error: "Invalid request body." },
        { status: 400 },
      );
    }

    const action = body.action;

    if (action !== "mark_paid" && action !== "reject") {
      return NextResponse.json(
        { error: "Action must be mark_paid or reject." },
        { status: 400 },
      );
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        paymentMethod: true,
        paymentStatus: true,
        paymentReference: true,
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: "Order not found." },
        { status: 404 },
      );
    }

    if (order.paymentMethod !== "UPI") {
      return NextResponse.json(
        { error: "Only UPI payments can be verified or rejected here." },
        { status: 400 },
      );
    }

    if (
      order.paymentStatus !== PaymentStatus.AWAITING_VERIFICATION
    ) {
      return NextResponse.json(
        {
          error: `This payment cannot be updated because its status is ${order.paymentStatus}.`,
        },
        { status: 409 },
      );
    }

    if (!order.paymentReference?.trim()) {
      return NextResponse.json(
        { error: "The order has no UPI transaction reference." },
        { status: 400 },
      );
    }

    const updatedOrder = await prisma.$transaction(async (tx) => {
      // Only one request can successfully process this payment.
      const result = await tx.order.updateMany({
        where: {
          id: order.id,
          paymentMethod: "UPI",
          paymentStatus: PaymentStatus.AWAITING_VERIFICATION,
          paymentReference: { not: null },
        },
        data:
          action === "mark_paid"
            ? {
                paymentStatus: PaymentStatus.PAID,
                paymentVerifiedAt: new Date(),
                paymentVerifiedBy: "store-owner",
              }
            : {
                paymentStatus: PaymentStatus.REJECTED,
                paymentVerifiedAt: null,
                paymentVerifiedBy: null,
              },
      });

      if (result.count !== 1) {
        throw new Error("PAYMENT_STATE_CHANGED");
      }

      return tx.order.findUnique({
        where: { id: order.id },
        select: {
          id: true,
          paymentStatus: true,
          paymentVerifiedAt: true,
        },
      });
    });

    return NextResponse.json({
      success: true,
      message:
        action === "mark_paid"
          ? "Payment marked as paid."
          : "Payment rejected.",
      order: updatedOrder,
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "PAYMENT_STATE_CHANGED"
    ) {
      return NextResponse.json(
        {
          error:
            "The payment was updated by another request. Refresh the order and try again.",
        },
        { status: 409 },
      );
    }

    console.error("Admin payment update failed:", error);

    return NextResponse.json(
      { error: "Unable to update payment status." },
      { status: 500 },
    );
  }
}
