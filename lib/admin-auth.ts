import { auth, currentUser } from "@clerk/nextjs/server";

export async function isStoreOwner(): Promise<boolean> {
  const { userId } = await auth();

  if (!userId) {
    return false;
  }

  const user = await currentUser();

  const primaryEmail = user?.emailAddresses.find(
    (item) => item.id === user.primaryEmailAddressId,
  )?.emailAddress;

  if (!primaryEmail) {
    return false;
  }

  // Prefer ADMIN_EMAILS when configured; preserve compatibility
  // with the existing single ADMIN_EMAIL setting otherwise.
  const configuredEmails = process.env.ADMIN_EMAILS?.trim()
    ? process.env.ADMIN_EMAILS.split(",")
    : [process.env.ADMIN_EMAIL ?? ""];

  const allowedEmails = configuredEmails
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

  return allowedEmails.includes(primaryEmail.trim().toLowerCase());
}