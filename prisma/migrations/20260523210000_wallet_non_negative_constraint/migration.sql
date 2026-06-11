-- [V4] Impede saldo negativo a nível de banco de dados.
-- A proteção na aplicação (updateMany WHERE balance >= amount) é a linha principal;
-- este CHECK é a linha de defesa final caso algum caminho de código seja adicionado
-- no futuro sem a verificação de saldo adequada.
ALTER TABLE "Wallet" ADD CONSTRAINT "wallet_balance_non_negative" CHECK (balance >= 0);
