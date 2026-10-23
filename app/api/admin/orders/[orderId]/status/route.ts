
import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { OrderStatus } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{ orderId: string }>;
};

const allowedStatuses = Object.values(OrderStatus);

export async function PATCH(
  request: Request,
  { params }: RouteContext
) {
  try {
    // 1. Require authentication.
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "You must sign in first." },
        { status: 401 }
      );
    }

    // 2. Authorize the configured admin.
    const adminEmail = process.env.ADMIN_EMAIL
      ?.trim()
      .toLowerCase();

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
        { error: "You are not authorized to update orders." },
        { status: 403 }
      );
    }

    // 3. Validate the requested status.
    const { orderId } = await params;

    let body: { status?: unknown };

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid request body." },
        { status: 400 }
      );
    }

    if (
      typeof body.status !== "string" ||
      !allowedStatuses.includes(body.status as OrderStatus)
    ) {
      return NextResponse.json(
        { error: "Invalid order status." },
        { status: 400 }
      );
    }

    const newStatus = body.status as OrderStatus;

    // 4. Confirm that the order exists.
    const existingOrder = await prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true, status: true },
    });

    if (!existingOrder) {
      return NextResponse.json(
        { error: "Order not found." },
        { status: 404 }
      );
    }

    // 5. Update the order status only.
    // Payment status remains unchanged.
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { status: newStatus },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        paymentMethod: true,
        paymentStatus: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      message: "Order status updated successfully.",
      order: updatedOrder,
    });
  } catch (error) {
    console.error("Order status update error:", error);

    return NextResponse.json(
      { error: "Unable to update the order status." },
      { status: 500 }
    );
  }
}
