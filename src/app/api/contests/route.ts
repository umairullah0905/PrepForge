import { NextResponse } from "next/server";
import { getUpcomingContests } from "@/lib/contests";

export const revalidate = 300; // Cache for 5 minutes

export async function GET() {
  try {
    const contests = await getUpcomingContests();
    return NextResponse.json({ contests });
  } catch (error) {
    console.error("API /api/contests error:", error);
    return NextResponse.json({ error: "Failed to fetch contests", contests: [] }, { status: 500 });
  }
}
