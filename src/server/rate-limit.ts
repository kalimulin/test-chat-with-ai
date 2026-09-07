import { and, count, eq, gte } from "drizzle-orm";
import { db } from "~/server/db";
import { requests, users } from "~/server/db/schema";

export const DAILY_REQUEST_LIMIT = 50;

export type RequestCheckResult = {
  allowed: boolean;
  requestsToday: number;
};

export async function getRequestsToday(userId: string): Promise<number> {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [row] = await db
    .select({ value: count() })
    .from(requests)
    .where(
      and(eq(requests.userId, userId), gte(requests.createdAt, startOfDay)),
    );

  return row?.value ?? 0;
}

export async function checkAndRecordRequest(
  userId: string,
): Promise<RequestCheckResult> {
  const [user] = await db
    .select({ isAdmin: users.isAdmin })
    .from(users)
    .where(eq(users.id, userId));

  let requestsToday = 0;

  if (!user?.isAdmin) {
    requestsToday = await getRequestsToday(userId);

    if (requestsToday >= DAILY_REQUEST_LIMIT) {
      return { allowed: false, requestsToday };
    }
  }

  await db.insert(requests).values({ userId });

  return { allowed: true, requestsToday };
}
