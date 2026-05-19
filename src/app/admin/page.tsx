import { isAdmin } from "@/lib/actions/admin";
import { AdminLoginForm } from "@/components/AdminLoginForm";
import { AdminPanel } from "@/components/AdminPanel";
import { supabaseServer, isSupabaseConfigured } from "@/lib/supabase/server";

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
  if (isSupabaseConfigured()) {
    const sb = supabaseServer();
    const { data } = await sb
      .from("entries")
      .select(
        "id, day_id, slot_number, content, created_at, report_count, is_hidden, is_deleted, days!inner(day_number, date_kst)"
      )
      .or("report_count.gte.1,is_hidden.eq.true,is_deleted.eq.true")
      .order("report_count", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(100);

    reported = (data || []).map((r) => {
      const rec = r as unknown as RawAdminEntry;
      return {
        id: rec.id,
        slot_number: rec.slot_number,
        content: rec.content,
        created_at: rec.created_at,
        report_count: rec.report_count,
        is_hidden: rec.is_hidden,
        is_deleted: rec.is_deleted,
        day_number: rec.days.day_number,
        date_kst: rec.days.date_kst,
      };
    });
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

type RawAdminEntry = {
  id: number;
  day_id: number;
  slot_number: number;
  content: string;
  created_at: string;
  report_count: number;
  is_hidden: boolean;
  is_deleted: boolean;
  days: { day_number: number; date_kst: string };
};
