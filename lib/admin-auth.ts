
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

  const ownerEmail = process.env.ADMIN_EMAIL;

  return Boolean(
    primaryEmail &&
      ownerEmail &&
      primaryEmail.toLowerCase() === ownerEmail.trim().toLowerCase(),
  );
}
