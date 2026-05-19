"use server";

import { getRecentDayBundles } from "@/lib/data/day-bundle";
import { DayBundle } from "@/lib/types";

export async function fetchMoreDays(input: {
  beforeDayNumber: number;
  limit?: number;
}): Promise<DayBundle[]> {
  const limit = Math.min(Math.max(input.limit ?? 3, 1), 10);
  return getRecentDayBundles(limit, input.beforeDayNumber);
}
