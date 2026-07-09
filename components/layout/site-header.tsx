import Link from "next/link";
import { Dice5 } from "lucide-react";

export function SiteHeader() {
  return (
    <header className="flex items-center gap-3 border-b px-4 py-3">
      <Link href="/" className="flex items-center gap-1.5 text-sm font-bold">
        <Dice5 className="size-4" />
        보드게임위키
      </Link>
    </header>
  );
}
