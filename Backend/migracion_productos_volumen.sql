-- Ejecutar una sola vez sobre la base de datos existente.
ALTER TABLE producto
    DROP COLUMN IF EXISTS codigo_barras;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'producto'
          AND column_name = 'capacidad_ml'
    )
    AND NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'producto'
          AND column_name = 'volumen_oz'
    ) THEN
        ALTER TABLE producto
            RENAME COLUMN capacidad_ml TO volumen_oz;
    END IF;
END $$;

    