-- Inserta las categorias utilizadas por el formulario de productos.
-- Puede ejecutarse varias veces sin duplicar registros.

INSERT INTO categoria (nombre, descripcion)
SELECT datos.nombre, datos.descripcion
FROM (
    VALUES
        ('Vasos', 'Vasos desechables y recipientes similares.'),
        ('Banderas', 'Banderas decorativas.'),
        ('Bolsas Color Y Transparente', 'Bolsas de color y transparentes.'),
        ('Carpeta Y Vinil Para Mesa', 'Carpetas y vinil para mesa.'),
        ('Globos', 'Globos para celebraciones.'),
        ('Platos Bandejas Y Contenedores', 'Platos, bandejas y contenedores.'),
        ('Platos', 'Platos desechables.'),
        ('Tazones y Contenedores', 'Tazones, recipientes y contenedores.'),
        ('Cubiertos', 'Cubiertos desechables.'),
        ('Bolsas', 'Bolsas plasticas y de empaque.'),
        ('Bolsas y Empaques', 'Bolsas y materiales de empaque.'),
        ('Otros', 'Productos que no pertenecen a otra categoria.'),
        ('Pita', 'Pita presentada en rollos.'),
        ('Nailo', 'Nailo delgado y grueso.'),
        ('Nailo vinil', 'Nailo vinil transparente y decorado para mesa.')
) AS datos(nombre, descripcion)
WHERE NOT EXISTS (
    SELECT 1
    FROM categoria c
    WHERE LOWER(c.nombre) = LOWER(datos.nombre)
);

-- Verificacion:
-- SELECT categoria_id, nombre, descripcion
-- FROM categoria
-- ORDER BY nombre;
