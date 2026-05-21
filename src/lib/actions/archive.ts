"use server";

import { getRecentDayBundles } from "@/lib/data/day-bundle";
import { DayBundle } from "@/lib/types";

export async function fetchMoreDays(input: {
  beforeDayNumber: number;
  limit?: number;
}): Promise<DayBundle[]> {
  if (!Number.isInteger(input.beforeDayNumber) || input.beforeDayNumber < 1) {
    return [];
  }
  const limit = Math.min(Math.max(Number(input.limit ?? 3) | 0, 1), 10);
  return getRecentDayBundles(limit, input.beforeDayNumber);
}
