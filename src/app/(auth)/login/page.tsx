"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertBox } from "@/components/ui/alert-box";
import { LogIn, Shield } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(e.currentTarget);
    const res = await signIn("credentials", {
      email: form.get("email"),
      password: form.get("password"),
      redirect: false,
    });
    if (res?.error) {
      setError("Credenciais inválidas. Verifique seu email e senha.");
      setLoading(false);
    } else {
      router.push("/dashboard");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-[var(--neon)] opacity-[0.04] blur-[120px]" />
      </div>

      <div className="relative z-10 w-full max-w-sm animate-glow-in">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-8 h-8 border border-[var(--neon)] bg-[var(--neon-dim)] flex items-center justify-center">
              <span className="font-display text-sm font-black text-[var(--neon)]">P</span>
            </div>
            <span className="font-display text-sm font-black tracking-[0.2em] text-[var(--text-bright)] uppercase">
              Play<span className="neon-text">Money</span>
            </span>
          </Link>
        </div>

        {/* Panel */}
        <div className="bracket relative border border-[var(--border)] bg-[var(--surface-2)]">
          <div className="h-0.5 bg-gradient-to-r from-transparent via-[var(--neon)] to-transparent" />

          <div className="p-6">
            <div className="flex items-center gap-2 mb-1">
              <LogIn size={14} className="text-[var(--neon)]" />
              <h1 className="font-display text-sm font-bold uppercase tracking-widest text-[var(--text-bright)]">
                Entrar
              </h1>
            </div>
            <p className="font-ui text-sm text-[var(--text-muted)] mb-6">
              Acesse sua conta para apostar
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" placeholder="seu@email.com" required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">Senha</Label>
                <Input id="password" name="password" type="password" placeholder="••••••••" required />
              </div>

              {error && <AlertBox variant="error">{error}</AlertBox>}

              <Button type="submit" className="w-full mt-2" disabled={loading}>
                {loading ? "Autenticando..." : "Entrar"}
              </Button>
            </form>

            <div className="mt-5 pt-5 border-t border-[var(--border)] flex items-center justify-between">
              <span className="font-ui text-sm text-[var(--text-muted)]">Sem conta?</span>
              <Link href="/register" className="font-ui text-sm text-[var(--neon)] hover:underline">
                Criar conta →
              </Link>
            </div>
          </div>

          <div className="border-t border-[var(--border)] px-4 py-2 flex items-center gap-2">
            <Shield size={10} className="text-[var(--text-muted)]" />
            <span className="font-ui text-[12px] text-[var(--text-muted)] tracking-wide">
              Conexão segura · SSL/TLS
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
