import { redirect } from "next/navigation";

/**
 * /archive 는 홈(`/`) 의 스크롤 아카이브로 통합됨.
 * 옛 북마크 호환을 위해 redirect 만 유지.
 */
export default function ArchivePage(): never {
  redirect("/");
}
