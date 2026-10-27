import "server-only";
import { unstable_cache } from "next/cache";
import { getDb } from "@/lib/firebase/firestore";
import { CRM } from "@/lib/firebase/collections";

/**
 * The outcome of the last daily store-report refresh, so the console can say
 * when Apple and Google data was last pulled and whether it worked — instead
 * of leaving the operator to guess how old a figure is.
 */

export interface SourceSyncResult {
  ok: boolean;
  /** Latest day (ISO date) the store had published, when it had any. */
  latestDate: string | null;
  error: string | null;
}

export interface SyncStatus {
  /** When the daily job last ran (epoch ms). */
  ranAt: number;
  apple: SourceSyncResult;
  play: SourceSyncResult;
}

const docRef = () => getDb().collection(CRM.syncStatus).doc("daily");

export async function writeSyncStatus(status: SyncStatus): Promise<void> {
  await docRef().set(status);
}

async function readSyncStatus(): Promise<SyncStatus | null> {
  const snap = await docRef().get();
  const data = snap.data() as SyncStatus | undefined;
  return data?.ranAt ? data : null;
}

/** One read a minute at most, however many admins have the console open. */
export const getSyncStatus = unstable_cache(
  () => readSyncStatus().catch(() => null),
  ["trapman-sync-status"],
  { revalidate: 60, tags: ["trapman-console", "trapman-sync-status"] },
);
