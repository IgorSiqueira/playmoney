-- [Trust] Rastreia quando o perfil do jogador foi detectado como público pela
-- última vez, para exigir MIN_MATCH_HISTORY partidas jogadas depois dessa data.
ALTER TABLE "GameProfile" ADD COLUMN "profilePublicSince" TIMESTAMP(3);
