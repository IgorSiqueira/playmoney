import { prisma } from "@/lib/prisma";

export type AdminAction =
  | "SUSPEND_USER"
  | "UNSUSPEND_USER"
  | "BLOCK_DEPOSITS"
  | "UNBLOCK_DEPOSITS"
  | "SET_DEPOSIT_LIMIT"
  | "ADJUST_BALANCE"
  | "CANCEL_BET"
  | "OVERRIDE_BET"
  | "REVIEW_RISK_FLAG"
  | "MANUAL_SUSPEND_USER"
  | "CHANGE_STEAM_ACCOUNT"
  | "PLATFORM_MAINTENANCE_ON"
  | "PLATFORM_MAINTENANCE_OFF"
  | "PLATFORM_DEPOSITS_BLOCKED"
  | "PLATFORM_DEPOSITS_UNBLOCKED"
  | "PLATFORM_DEPOSIT_LIMIT";

export async function logAdminAction(
  adminId: string,
  adminEmail: string,
  action: AdminAction,
  targetUserId?: string,
  detail?: Record<string, unknown>
) {
  await prisma.adminLog.create({
    data: { adminId, adminEmail, action, targetUserId: targetUserId ?? null, detail: detail ? JSON.parse(JSON.stringify(detail)) : undefined },
  });
}
