/** Constantes de negócio configuráveis via variáveis de ambiente. */
export const PLATFORM = {
  /** Taxa do bônus de boas-vindas (0.5 = 50%). Configurável via BONUS_RATE. */
  BONUS_RATE: parseFloat(process.env.BONUS_RATE ?? "0.5"),
  /** Teto do bônus em reais. Configurável via BONUS_CAP. */
  BONUS_CAP: parseFloat(process.env.BONUS_CAP ?? "50"),
  /** Depósito mínimo para ganhar bônus. Configurável via MIN_BONUS_DEP. */
  MIN_BONUS_DEP: parseFloat(process.env.MIN_BONUS_DEP ?? "20"),
} as const;
