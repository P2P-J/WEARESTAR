import { isAdmin } from "@/lib/actions/admin";
import { AdminLoginForm } from "@/components/AdminLoginForm";
import { AdminPanel } from "@/components/AdminPanel";
import { db, isDbConfigured } from "@/lib/db/client";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const ok = await isAdmin();
  if (!ok) {
    return (
      <div className="min-h-svh flex items-center justify-center px-6">
        <AdminLoginForm />
      </div>
    );
  }

  let reported: AdminEntry[] = [];
  if (isDbConfigured()) {
    const sql = db();
    const rows = (await sql`
      SELECT
        e.id, e.slot_number, e.content,
        e.created_at::text AS created_at,
        e.report_count, e.is_hidden, e.is_deleted,
        d.day_number, d.date_kst::text AS date_kst
      FROM entries e
      JOIN days d ON d.id = e.day_id
      WHERE e.report_count >= 1 OR e.is_hidden = true OR e.is_deleted = true
      ORDER BY e.report_count DESC, e.created_at DESC
      LIMIT 100
    `) as AdminEntry[];
    reported = rows;
  }

  return (
    <div className="min-h-svh px-6 md:px-10 py-10">
      <header className="flex items-end justify-between mb-8">
        <div>
          <h1 className="font-serif text-3xl text-ink">관리자</h1>
          <p className="mono text-[11px] tracking-wider3 text-ink-faint mt-1">
            REPORTED · HIDDEN · DELETED
          </p>
        </div>
        <a
          href="/admin/logout"
          className="mono text-[11px] tracking-wider2 text-ink-faint hover:text-star transition"
        >
          LOGOUT →
        </a>
      </header>
      <AdminPanel rows={reported} />
    </div>
  );
}

export type AdminEntry = {
  id: number;
  slot_number: number;
  content: string;
  created_at: string;
  report_count: number;
  is_hidden: boolean;
  is_deleted: boolean;
  day_number: number;
  date_kst: string;
};
