
import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { v2 as cloudinary } from "cloudinary";


export async function POST() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Please sign in first." },
        { status: 401 },
      );
    }

    const user = await currentUser();

    const email = user?.emailAddresses.find(
      (item) => item.id === user.primaryEmailAddressId,
    )?.emailAddress;

    const ownerEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();

    if (
      !email ||
      !ownerEmail ||
      email.trim().toLowerCase() !== ownerEmail
    ) {
      return NextResponse.json(
        { error: "Owner access required." },
        { status: 403 },
      );
    }

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      console.error("Cloudinary environment variables are missing.");

      return NextResponse.json(
        { error: "Cloudinary is not configured on the server." },
        { status: 500 },
      );
    }

    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
    });

    const timestamp = Math.floor(Date.now() / 1000);
    const folder = "tirthesh-products";

    const signature = cloudinary.utils.api_sign_request(
      { timestamp, folder },
      apiSecret,
    );

    return NextResponse.json({
      cloudName,
      apiKey,
      timestamp,
      folder,
      signature,
    });
  } catch (error) {
    console.error("Cloudinary signature error:", error);

    return NextResponse.json(
      { error: "Unable to prepare the image upload." },
      { status: 500 },
    );
  }
}
