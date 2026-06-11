-- [E1] Unique constraint: o mesmo Steam ID não pode ser conectado em duas contas da plataforma
CREATE UNIQUE INDEX "GameProfile_externalId_game_key" ON "GameProfile"("externalId", "game");
