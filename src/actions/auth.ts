"use server";

import { prisma } from "@/lib/prisma";

export async function checkAdminExists(): Promise<boolean> {
  const admin = await prisma.user.findFirst({
    where: { role: "admin" }
  });
  return !!admin;
}
