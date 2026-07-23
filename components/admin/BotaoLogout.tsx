"use client";

import { useRouter } from "next/navigation";

export default function BotaoLogout() {
  const router = useRouter();

  async function sair() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      onClick={sair}
      className="px-3 py-2 rounded-lg text-white/60 hover:bg-white/10 hover:text-white transition-colors text-sm mt-auto"
    >
      Sair
    </button>
  );
}
