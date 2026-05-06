import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let user = await prisma.user.findUnique({
      where: { clerkId },
    });

    if (!user) {
      const clerkUser = await currentUser();
      if (!clerkUser) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      user = await prisma.user.create({
        data: {
          clerkId,
          username:
            clerkUser.username ||
            clerkUser.firstName ||
            clerkUser.emailAddresses[0]?.emailAddress?.split("@")[0] ||
            "user",
          email: clerkUser.emailAddresses[0]?.emailAddress || "",
          imageUrl: clerkUser.imageUrl,
        },
      });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("User sync error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
