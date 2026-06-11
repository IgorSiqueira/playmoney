"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { CreditCard, TrendingUp, TrendingDown, History, Zap, ArrowDownToLine, Receipt } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { Breadcrumb } from "@/components/shared/breadcrumb";
import { AlertBox } from "@/components/ui/alert-box";

interface Transaction {
  id: string; type: string; amount: number;
  status: string; description: string | null; createdAt: string;
}
interface Wallet {
  balance: number;
  bonusBalance: number;
  depositBonusClaimed: boolean;
  transactions: Transaction[];
}

const QUICK = [25, 50, 100, 200];

const typeConfig: Record<string, { label: string; icon: typeof TrendingUp; color: string; prefix: string }> = {
  DEPOSIT:    { label: "Depósito PIX",        icon: TrendingUp,   color: "var(--neon)",    prefix: "+" },
  WITHDRAWAL: { label: "Saque PIX",           icon: TrendingDown, color: "var(--danger)",  prefix: "-" },
  BET_PLACED: { label: "Aposta realizada",    icon: TrendingDown, color: "var(--gold)",    prefix: "-" },
  BET_WON:    { label: "Prêmio recebido",     icon: TrendingUp,   color: "var(--neon)",    prefix: "+" },
  BET_LOST:   { label: "Aposta perdida",      icon: TrendingDown, color: "var(--danger)",  prefix: "-" },
  BONUS:      { label: "Bônus de Boas-Vindas", icon: TrendingUp,  color: "var(--gold)",    prefix: "+" },
};

export default function WalletPage() {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  // Withdrawal state
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [pixKey, setPixKey] = useState("");
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [withdrawSuccess, setWithdrawSuccess] = useState("");
  const [withdrawError, setWithdrawError] = useState("");

  async function load() {
    const r = await fetch("/api/wallet");
    if (r.ok) setWallet(await r.json());
  }

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (!success) return;
    const t = setTimeout(() => setSuccess(""), 5000);
    return () => clearTimeout(t);
  }, [success]);

  useEffect(() => {
    if (!withdrawSuccess) return;
    const t = setTimeout(() => setWithdrawSuccess(""), 5000);
    return () => clearTimeout(t);
  }, [withdrawSuccess]);

  async function handleWithdraw(e: React.FormEvent) {
    e.preventDefault();
    const v = parseFloat(withdrawAmount);
    if (!v || v < 20) { setWithdrawError("Valor mínimo: R$ 20,00"); return; }
    if (!pixKey.trim()) { setWithdrawError("Informe a chave PIX"); return; }
    setWithdrawLoading(true); setWithdrawError(""); setWithdrawSuccess("");
    const r = await fetch("/api/wallet/withdraw", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: v, pixKey: pixKey.trim() }),
    });
    const data = await r.json();
    if (r.ok) {
      setWithdrawSuccess(formatCurrency(v));
      setWithdrawAmount("");
      setPixKey("");
      load();
    } else {
      setWithdrawError(data.error || "Erro ao processar saque");
    }
    setWithdrawLoading(false);
  }

  async function handleDeposit(e: React.FormEvent) {
    e.preventDefault();
    const v = parseFloat(amount);
    if (!v || v < 10) { setError("Valor mínimo: R$ 10,00"); return; }
    setLoading(true); setError(""); setSuccess("");
    const r = await fetch("/api/wallet", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: v }),
    });
    const data = await r.json();
    if (r.ok) {
      const bonus = data.bonusAmount ?? 0;
      setSuccess(bonus > 0
        ? `${formatCurrency(v)} + ${formatCurrency(bonus)} de bônus!`
        : formatCurrency(v)
      );
      setAmount("");
      load();
    } else {
      setError(data.error || "Erro ao processar depósito");
    }
    setLoading(false);
  }

  return (
    <div className="space-y-8 pb-8">
      <Breadcrumb
        pageTitle="Carteira"
        crumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Carteira" }]}
      />
      <div>
        <div className="font-ui text-[11px] font-semibold tracking-[0.2em] text-[var(--neon)] uppercase mb-1">▸ Financeiro</div>
        <h1 className="font-display text-3xl font-black uppercase tracking-tight text-[var(--text-bright)]">Carteira</h1>
        <p className="font-ui text-sm text-[var(--text-muted)] mt-1">Gerencie seu saldo e transações</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Balance */}
        <div className="bracket relative border border-[var(--border)] bg-[var(--surface-2)] p-6 overflow-hidden">
          <div className="h-0.5 bg-gradient-to-r from-transparent via-[var(--neon)] to-transparent absolute top-0 left-0 right-0" />
          <div className="flex items-center gap-2 mb-2">
            <CreditCard size={13} className="text-[var(--neon)]" />
            <span className="font-ui text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wide">Saldo Disponível</span>
          </div>
          <div
            className="font-mono text-4xl font-bold text-[var(--neon)] mt-3"
            style={{ textShadow: "0 0 20px rgba(0,128,255,0.5)" }}
          >
            {wallet ? formatCurrency(Number(wallet.balance)) : "···"}
          </div>
          {wallet && Number(wallet.bonusBalance) > 0 && (
            <div className="flex items-center gap-1.5 mt-1.5">
              <span className="font-ui text-[12px] text-[var(--gold)]">
                Inclui {formatCurrency(Number(wallet.bonusBalance))} de bônus
              </span>
            </div>
          )}
          <p className="font-ui text-[12px] text-[var(--text-muted)] tracking-wide mt-2">
            Pronto para apostar
          </p>
          {wallet && !wallet.depositBonusClaimed && (
            <div className="mt-3 border border-[var(--gold)] bg-[var(--gold-dim)] px-3 py-2">
              <span className="font-ui text-[12px] text-[var(--gold)] font-semibold">
                🎁 Deposite R$ 20+ e ganhe 50% de bônus (até R$ 50)
              </span>
            </div>
          )}
          {/* Decorative bg */}
          <div className="absolute -right-6 -bottom-6 w-28 h-28 border border-[var(--neon)] opacity-5 rotate-12" />
        </div>

        {/* Deposit */}
        <div className="bracket relative border border-[var(--border)] bg-[var(--surface-2)] p-6">
          <div className="flex items-center gap-2 mb-4">
            <Zap size={13} className="text-[var(--gold)]" />
            <span className="font-ui text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wide">Depositar via PIX</span>
          </div>

          <form onSubmit={handleDeposit} className="space-y-4">
            {/* Quick amounts */}
            <div className="grid grid-cols-4 gap-1.5">
              {QUICK.map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setAmount(String(v))}
                  disabled={loading}
                  className={`py-3 font-ui text-[12px] font-semibold uppercase border transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                    amount === String(v)
                      ? "border-[var(--neon)] bg-[var(--neon-dim)] text-[var(--neon)]"
                      : "border-[var(--border)] bg-[var(--surface-1)] text-[var(--text-muted)] hover:border-[var(--border-mid)] hover:text-[var(--text)]"
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>

            <div className="space-y-2">
              <Label>Valor personalizado (R$)</Label>
              <Input type="number" placeholder="0.00" min={10} max={10000} step={0.01}
                value={amount} onChange={(e) => { setAmount(e.target.value); setError(""); }}
                aria-invalid={!!error || undefined} />
            </div>

            {error && <AlertBox variant="error">{error}</AlertBox>}
            {success && <AlertBox variant="success">+{success} creditado com sucesso</AlertBox>}

            <Button type="submit" className="w-full" variant="gold" disabled={loading || !amount}>
              {loading ? "Processando..." : "Depositar"}
            </Button>
          </form>
        </div>
      </div>

      {/* Withdrawal */}
      <div className="bracket relative border border-[var(--border)] bg-[var(--surface-2)] overflow-hidden">
        <div className="h-0.5 bg-gradient-to-r from-transparent via-[var(--danger)] to-transparent absolute top-0 left-0 right-0" />
        <div className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <ArrowDownToLine size={13} className="text-[var(--danger)]" />
            <span className="font-display text-sm font-bold uppercase tracking-widest text-[var(--text-bright)]">Sacar via PIX</span>
          </div>

          <form onSubmit={handleWithdraw} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Chave PIX</Label>
                <Input
                  type="text"
                  placeholder="CPF, e-mail ou telefone"
                  value={pixKey}
                  onChange={(e) => { setPixKey(e.target.value); setWithdrawError(""); }}
                  aria-invalid={withdrawError && !pixKey.trim() ? true : undefined}
                />
              </div>
              <div className="space-y-2">
                <Label>Valor (R$)</Label>
                <Input
                  type="number"
                  placeholder="Mín. R$ 20,00"
                  min={20}
                  max={wallet ? wallet.balance : undefined}
                  step={0.01}
                  value={withdrawAmount}
                  onChange={(e) => { setWithdrawAmount(e.target.value); setWithdrawError(""); }}
                  aria-invalid={withdrawError && !withdrawAmount ? true : undefined}
                />
              </div>
            </div>

            {withdrawError && <AlertBox variant="error">{withdrawError}</AlertBox>}
            {withdrawSuccess && <AlertBox variant="success">{withdrawSuccess} solicitado — PIX em até 1 dia útil</AlertBox>}

            <div className="flex items-center justify-between">
              <Button
                type="submit"
                variant="outline"
                disabled={withdrawLoading || !withdrawAmount || !pixKey.trim()}
                className="border-[var(--danger)] text-[var(--danger)] hover:bg-[var(--danger-dim)]"
              >
                {withdrawLoading
                  ? <><span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />Processando...</>
                  : "Solicitar Saque"}
              </Button>
              <span className="font-ui text-[12px] text-[var(--text-muted)] tracking-wide">
                ▸ Processado em até 1 dia útil
              </span>
            </div>
          </form>
        </div>
      </div>

      {/* History */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-0.5 h-4 bg-[var(--neon)]" />
          <History size={13} className="text-[var(--text-muted)]" />
          <span className="font-display text-xs font-bold uppercase tracking-widest text-[var(--text-bright)]">
            Histórico de Transações
          </span>
        </div>

        {!wallet?.transactions.length ? (
          <EmptyState
            icon={<Receipt size={36} />}
            title="Nenhuma transação"
            description="Suas movimentações de saldo aparecerão aqui."
          />
        ) : (
          <div className="space-y-2">
            {wallet.transactions.map((tx) => {
              const cfg = typeConfig[tx.type] ?? { label: tx.type, icon: TrendingUp, color: "var(--text)", prefix: "" };
              const Icon = cfg.icon;
              return (
                <div
                  key={tx.id}
                  className="flex items-center justify-between border border-[var(--border)] bg-[var(--surface-2)] px-4 py-3 hover:border-[var(--border-mid)] hover:bg-[var(--surface-hover)] transition-all duration-150"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 border border-[var(--border)] flex items-center justify-center shrink-0"
                      style={{ borderColor: `${cfg.color}40` }}>
                      <Icon size={12} style={{ color: cfg.color }} />
                    </div>
                    <div>
                      <div className="font-ui text-sm font-semibold text-[var(--text-bright)]">{cfg.label}</div>
                      <div className="font-mono text-[11px] text-[var(--text-muted)]">{formatDate(tx.createdAt)}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div
                      className="font-mono text-sm font-bold"
                      style={{ color: cfg.color }}
                    >
                      {cfg.prefix}{formatCurrency(Number(tx.amount))}
                    </div>
                    <Badge
                      variant={tx.status === "COMPLETED" ? "default" : tx.status === "PENDING" ? "warning" : "secondary"}
                    >
                      {tx.status === "COMPLETED" ? "OK" : tx.status === "PENDING" ? "PEND" : tx.status}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
