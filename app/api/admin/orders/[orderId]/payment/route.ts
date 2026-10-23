
import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import {
  PaymentMethod,
  PaymentStatus,
} from "@/app/generated/prisma/client";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{ orderId: string }>;
};

export async function POST(
  request: Request,
  { params }: RouteContext
) {
  try {
    // 1. Verify that the requester is signed in.
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "You must sign in first." },
        { status: 401 }
      );
    }

    // 2. Verify that the requester is the authorized admin.
    const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();

    if (!adminEmail) {
      console.error("ADMIN_EMAIL is not configured.");

      return NextResponse.json(
        { error: "Admin authorization is not configured." },
        { status: 500 }
      );
    }

    const user = await currentUser();

    const userEmail = user?.primaryEmailAddress?.emailAddress
      ?.trim()
      .toLowerCase();

    if (!userEmail || userEmail !== adminEmail) {
      return NextResponse.json(
        { error: "You are not authorized to verify payments." },
        { status: 403 }
      );
    }

    // 3. Read and validate the requested action.
    const { orderId } = await params;

    let body: { action?: unknown };

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid request body." },
        { status: 400 }
      );
    }

    const action = body.action;

    if (action !== "mark_paid" && action !== "reject") {
      return NextResponse.json(
        { error: "Invalid payment action." },
        { status: 400 }
      );
    }

    // 4. Find the order.
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return NextResponse.json(
        { error: "Order not found." },
        { status: 404 }
      );
    }

    // 5. Only allow verification of UPI orders awaiting verification.
    if (
      order.paymentMethod !== PaymentMethod.UPI ||
      order.paymentStatus !== PaymentStatus.AWAITING_VERIFICATION
    ) {
      return NextResponse.json(
        {
          error:
            "This order is not a UPI payment awaiting verification.",
        },
        { status: 409 }
      );
    }

    // 6. Update only if the order still awaits verification.
    const newStatus =
      action === "mark_paid"
        ? PaymentStatus.PAID
        : PaymentStatus.REJECTED;

    const result = await prisma.order.updateMany({
      where: {
        id: orderId,
        paymentMethod: PaymentMethod.UPI,
        paymentStatus: PaymentStatus.AWAITING_VERIFICATION,
      },
      data: {
        paymentStatus: newStatus,
        paymentVerifiedAt: new Date(),
        paymentVerifiedBy: userEmail,
      },
    });

    if (result.count !== 1) {
      return NextResponse.json(
        {
          error:
            "The payment status has changed. Refresh the order and try again.",
        },
        { status: 409 }
      );
    }

    // 7. Return the updated order.
    const updatedOrder = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        paymentMethod: true,
        paymentStatus: true,
        paymentReference: true,
        paymentVerifiedAt: true,
        paymentVerifiedBy: true,
      },
    });

    return NextResponse.json({
      message:
        action === "mark_paid"
          ? "Payment marked as paid."
          : "Payment rejected.",
      order: updatedOrder,
    });
  } catch (error) {
    console.error("Payment verification error:", error);

    return NextResponse.json(
      { error: "Unable to update payment status." },
      { status: 500 }
    );
  }
}
