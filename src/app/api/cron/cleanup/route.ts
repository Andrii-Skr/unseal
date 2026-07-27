import { NextResponse } from "next/server";
import { cleanupStaleCardCreationQuotas } from "@/lib/card-rate-limit";
import { cleanupExpiredCards } from "@/lib/cards";

export async function GET(request: Request) {
  const expected = process.env.CRON_SECRET;
  const provided = request.headers.get("authorization");

  if (!expected || provided !== `Bearer ${expected}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [deleted, rateLimitsDeleted] = await Promise.all([
    cleanupExpiredCards(),
    cleanupStaleCardCreationQuotas(),
  ]);
  return NextResponse.json({ deleted, rateLimitsDeleted });
}
