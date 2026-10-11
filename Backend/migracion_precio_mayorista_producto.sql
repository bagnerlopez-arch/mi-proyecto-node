ALTER TABLE producto
    ADD COLUMN IF NOT EXISTS precio_mayorista numeric(12, 2) NOT NULL DEFAULT 0;
