import { auth } from "~/server/auth";
import { getRequestsToday } from "~/server/rate-limit";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return new Response(null, { status: 401 });
  }

  const count = await getRequestsToday(session.user.id);
  return Response.json({ count });
}
