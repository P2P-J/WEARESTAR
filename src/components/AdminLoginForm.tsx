"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { adminLogin } from "@/lib/actions/admin";

export function AdminLoginForm() {
  const router = useRouter();
  const [pw, setPw] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    const r = await adminLogin(pw);
    if (!r.ok) {
      setErr(r.message || "로그인 실패");
      setBusy(false);
      return;
    }
    router.refresh();
  }

  return (
    <form
      onSubmit={onSubmit}
      className="w-full max-w-sm rounded-xl border border-white/10 bg-night-900/85 p-7"
    >
      <div className="mono text-[11px] tracking-wider3 text-star/70">ADMIN</div>
      <h2 className="font-serif text-2xl mt-3 text-ink">관리자 로그인</h2>
      <p className="font-serif text-[13px] text-ink-muted mt-2 leading-relaxed">
        환경변수 <code className="mono text-[12px] text-star/80">ADMIN_PASSWORD</code> 와 일치해야 해요.
      </p>
      <input
        type="password"
        autoFocus
        value={pw}
        onChange={(e) => setPw(e.target.value)}
        placeholder="비밀번호"
        className="mt-5 w-full bg-night-800/60 border border-white/10 rounded-md p-3 text-ink placeholder:text-ink-faint/60 font-serif focus:outline-none focus:border-star/50"
      />
      {err && (
        <div className="font-serif text-[13px] text-star mt-3">{err}</div>
      )}
      <button
        type="submit"
        disabled={busy || !pw}
        className="mt-5 w-full mono text-[12px] tracking-wider2 px-5 py-3 rounded border border-star/40 bg-star/10 text-star hover:bg-star/20 disabled:opacity-40 transition"
      >
        {busy ? "…" : "ENTER"}
      </button>
    </form>
  );
}
