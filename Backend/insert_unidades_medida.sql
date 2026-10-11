-- Inserta las unidades utilizadas por el formulario de productos.
-- Puede ejecutarse varias veces sin duplicar registros.

INSERT INTO unidad_medida (nombre, simbolo)
SELECT datos.nombre, datos.simbolo
FROM (
    VALUES
        ('Unidad', 'und'),
        ('Paquete', 'paq'),
        ('Caja', 'cj'),
        ('Rollo', 'rollo'),
        ('Docena', 'doc'),
        ('Onzas', 'oz'),
        ('Libras', 'lb')
) AS datos(nombre, simbolo)
WHERE NOT EXISTS (
    SELECT 1
    FROM unidad_medida um
    WHERE LOWER(um.nombre) = LOWER(datos.nombre)
       OR LOWER(COALESCE(um.simbolo, '')) = LOWER(datos.simbolo)
);

-- Verificacion:
-- SELECT unidad_id, nombre, simbolo
-- FROM unidad_medida
-- ORDER BY nombre;