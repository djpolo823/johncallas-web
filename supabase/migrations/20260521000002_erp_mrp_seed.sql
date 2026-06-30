-- =========================================================================
-- SEED DE DATOS INICIALES: ERP / MRP "QUIET LUXURY"
-- =========================================================================

-- 1. POBLAR ROLES SI NO EXISTEN
INSERT INTO public.roles (codigo, nombre, descripcion)
VALUES 
('admin', 'Administrador', 'Control total de la plataforma, finanzas, costos y configuraciones.'),
('artesano', 'Maestro Artesano', 'Gestión de órdenes de producción, tiempos y reporte de desperdicios.'),
('inventario', 'Operador de Inventario', 'Control de entradas/salidas de materia prima y stock de bodegas.'),
('vendedor', 'Asesor Comercial', 'Gestión de ventas, atención a clientes y catálogo.'),
('cliente', 'Cliente VIP', 'Acceso al e-commerce premium, seguimiento de pedidos e historial.')
ON CONFLICT (codigo) DO UPDATE SET 
nombre = EXCLUDED.nombre, 
descripcion = EXCLUDED.descripcion;

-- 2. POBLAR BODEGAS
INSERT INTO public.bodegas (nombre, ubicacion, tipo)
VALUES 
('Bodega Central de Materiales', 'Zona Industrial Taller Central, Módulo A', 'central'),
('Taller de Corte y Armado', 'Zona Industrial Taller Central, Módulo B', 'taller'),
('Showroom JohnCallas Zona G', 'Calle 70 # 4-82, Bogotá', 'showroom')
ON CONFLICT DO NOTHING;

-- 3. POBLAR PROVEEDORES
INSERT INTO public.proveedores (nombre, nit_rut, contacto_nombre, telefono, email, direccion)
VALUES 
('Curtimbres Curtigran S.A.', '860.034.912-1', 'Don Alvaro Restrepo', '+57 312 456 7890', 'ventas@curtigran.com.co', 'Km 4 Vía Villapinzón, Cundinamarca'),
('Importadora de Herrajes Italianos Ltda', '900.543.123-5', 'Giuseppe Rossi', '+57 300 987 6543', 'contacto@herrajesitalianos.com', 'Calle 15 # 22-44, Bogotá')
ON CONFLICT (nit_rut) DO UPDATE SET 
nombre = EXCLUDED.nombre,
contacto_nombre = EXCLUDED.contacto_nombre;

-- 4. POBLAR MATERIAS PRIMAS
-- Guardar IDs de materias primas en variables locales de bloque plpgsql para usarlos en el BOM
DO $$
DECLARE
    v_prov_piel UUID;
    v_prov_herrajes UUID;
    v_bod_central_id UUID;
    v_bod_taller_id UUID;
    v_mp_cuero_blk UUID;
    v_mp_cuero_cog UUID;
    v_mp_hebilla UUID;
    v_mp_hilo UUID;
    v_prod_tote UUID;
    v_prod_cross UUID;
BEGIN
    -- Obtener IDs de proveedores
    SELECT id INTO v_prov_piel FROM public.proveedores WHERE nit_rut = '860.034.912-1' LIMIT 1;
    SELECT id INTO v_prov_herrajes FROM public.proveedores WHERE nit_rut = '900.543.123-5' LIMIT 1;

    -- Obtener IDs de bodegas
    SELECT id INTO v_bod_central_id FROM public.bodegas WHERE tipo = 'central' LIMIT 1;
    SELECT id INTO v_bod_taller_id FROM public.bodegas WHERE tipo = 'taller' LIMIT 1;

    -- A. Insertar Materia Prima: Cuero Negro Onyx
    INSERT INTO public.materia_prima (sku, nombre, descripcion, unidad_medida, stock_minimo, costo_promedio_ponderado, proveedor_preferido_id)
    VALUES ('MP-CUERO-BLK', 'Cuero Negro Onyx Plena Flor', 'Cuero vacuno curtido al cromo con acabado liso satinado de alta resistencia.', 'dm2', 500.0000, 1.20, v_prov_piel)
    ON CONFLICT (sku) DO UPDATE SET costo_promedio_ponderado = EXCLUDED.costo_promedio_ponderado
    RETURNING id INTO v_mp_cuero_blk;

    -- B. Insertar Materia Prima: Cuero Cognac
    INSERT INTO public.materia_prima (sku, nombre, descripcion, unidad_medida, stock_minimo, costo_promedio_ponderado, proveedor_preferido_id)
    VALUES ('MP-CUERO-COG', 'Cuero Cognac Curtido Vegetal', 'Cuero vacuno de origen italiano, curtido vegetal que envejece con pátina natural.', 'dm2', 500.0000, 1.30, v_prov_piel)
    ON CONFLICT (sku) DO UPDATE SET costo_promedio_ponderado = EXCLUDED.costo_promedio_ponderado
    RETURNING id INTO v_mp_cuero_cog;

    -- C. Insertar Materia Prima: Hebilla Satinada
    INSERT INTO public.materia_prima (sku, nombre, descripcion, unidad_medida, stock_minimo, costo_promedio_ponderado, proveedor_preferido_id)
    VALUES ('MP-HER-HEB-01', 'Hebilla de Bronce Sólido 20mm', 'Hebilla de latón macizo fundida a la arena con acabado cepillado satinado.', 'unidad', 50.0000, 4.50, v_prov_herrajes)
    ON CONFLICT (sku) DO UPDATE SET costo_promedio_ponderado = EXCLUDED.costo_promedio_ponderado
    RETURNING id INTO v_mp_hebilla;

    -- D. Insertar Materia Prima: Hilo Gütermann
    INSERT INTO public.materia_prima (sku, nombre, descripcion, unidad_medida, stock_minimo, costo_promedio_ponderado, proveedor_preferido_id)
    VALUES ('MP-HILO-GUT', 'Hilo de Poliéster Encerado Tera 40', 'Hilo encerado alemán de alta tenacidad para costuras decorativas finas a mano.', 'metros', 1000.0000, 0.05, v_prov_herrajes)
    ON CONFLICT (sku) DO UPDATE SET costo_promedio_ponderado = EXCLUDED.costo_promedio_ponderado
    RETURNING id INTO v_mp_hilo;

    -- 5. ESTABLECER SALDOS DE INVENTARIO FÍSICO INICIAL
    -- Bodega Central
    INSERT INTO public.inventario_materia_prima (materia_prima_id, bodega_id, cantidad) VALUES
    (v_mp_cuero_blk, v_bod_central_id, 3000.0000),
    (v_mp_cuero_cog, v_bod_central_id, 2500.0000),
    (v_mp_hebilla, v_bod_central_id, 150.0000),
    (v_mp_hilo, v_bod_central_id, 5000.0000)
    ON CONFLICT (materia_prima_id, bodega_id) DO UPDATE SET cantidad = EXCLUDED.cantidad;

    -- Bodega Taller (Material ya distribuido para trabajo inmediato)
    INSERT INTO public.inventario_materia_prima (materia_prima_id, bodega_id, cantidad) VALUES
    (v_mp_cuero_blk, v_bod_taller_id, 200.0000),
    (v_mp_cuero_cog, v_bod_taller_id, 150.0000),
    (v_mp_hebilla, v_bod_taller_id, 20.0000),
    (v_mp_hilo, v_bod_taller_id, 500.0000)
    ON CONFLICT (materia_prima_id, bodega_id) DO UPDATE SET cantidad = EXCLUDED.cantidad;


    -- 6. INSERTAR PRODUCTOS DEL CATÁLOGO PARA COSTEO AUTOMÁTICO
    -- A. The Classic Tote
    INSERT INTO public.productos (ref_sku, nombre, descripcion, categoria, categoria_id, costo_mano_obra, margen_deseado, imagenes, filtros, bajo_pedido)
    VALUES (
        'JC-TOTE-01', 
        'The Classic Tote', 
        'Un icono reimaginado. Diseñado para la mujer contemporánea que necesita llevar su mundo consigo sin sacrificar la elegancia. Elaborado en cuero de plena flor que desarrollará una pátina única con el tiempo.',
        'Tote Bags', 
        'bolsos', 
        35.00, 
        0.7000, -- 70% margen objetivo
        ARRAY['https://images.unsplash.com/photo-1548036328-c9fa89d128fa?q=80&w=2069&auto=format&fit=crop'],
        '{"uso": "Diario", "color": "Negro Onyx", "tamano": "Grande", "precio": 280, "categoria": "bolsos"}'::jsonb,
        false
    )
    ON CONFLICT (ref_sku) DO UPDATE SET costo_mano_obra = EXCLUDED.costo_mano_obra, margen_deseado = EXCLUDED.margen_deseado
    RETURNING id INTO v_prod_tote;

    -- B. Minimalist Crossbody
    INSERT INTO public.productos (ref_sku, nombre, descripcion, categoria, categoria_id, costo_mano_obra, margen_deseado, imagenes, filtros, bajo_pedido)
    VALUES (
        'JC-CROSS-02', 
        'Minimalist Crossbody', 
        'La esencia de la simplicidad. Diseñada para mantener tus manos libres mientras llevas lo esencial con la máxima discreción y estilo.',
        'Bandoleras', 
        'bolsos', 
        25.00, 
        0.7000, -- 70% margen objetivo
        ARRAY['https://images.unsplash.com/photo-1594223274512-ad4803739b7c?q=80&w=1957&auto=format&fit=crop'],
        '{"uso": "Diario", "color": "Cognac", "tamano": "Mediano", "precio": 195, "categoria": "bolsos"}'::jsonb,
        false
    )
    ON CONFLICT (ref_sku) DO UPDATE SET costo_mano_obra = EXCLUDED.costo_mano_obra, margen_deseado = EXCLUDED.margen_deseado
    RETURNING id INTO v_prod_cross;


    -- 7. CREAR FICHAS TÉCNICAS (BOM)
    -- Receta para 'The Classic Tote' (Usa Cuero Negro, Hilo y Hebillas)
    INSERT INTO public.ficha_tecnica_bom (producto_id, materia_prima_id, cantidad_requerida, porcentaje_desperdicio_estandar) VALUES
    (v_prod_tote, v_mp_cuero_blk, 40.0000, 0.1500), -- 40 dm2 de cuero negro con 15% desperdicio estándar
    (v_prod_tote, v_mp_hebilla, 2.0000, 0.0000),   -- 2 hebillas (no hay desperdicio en herrajes)
    (v_prod_tote, v_mp_hilo, 50.0000, 0.1000)      -- 50 metros de hilo con 10% desperdicio estándar
    ON CONFLICT (producto_id, materia_prima_id) DO UPDATE SET 
    cantidad_requerida = EXCLUDED.cantidad_requerida,
    porcentaje_desperdicio_estandar = EXCLUDED.porcentaje_desperdicio_estandar;

    -- Receta para 'Minimalist Crossbody' (Usa Cuero Cognac, Hilo y Hebilla)
    INSERT INTO public.ficha_tecnica_bom (producto_id, materia_prima_id, cantidad_requerida, porcentaje_desperdicio_estandar) VALUES
    (v_prod_cross, v_mp_cuero_cog, 25.0000, 0.1800), -- 25 dm2 de cuero Cognac con 18% desperdicio (cuero vegetal requiere más descarte)
    (v_prod_cross, v_mp_hebilla, 1.0000, 0.0000),   -- 1 hebilla
    (v_prod_cross, v_mp_hilo, 30.0000, 0.1000)      -- 30 metros de hilo
    ON CONFLICT (producto_id, materia_prima_id) DO UPDATE SET 
    cantidad_requerida = EXCLUDED.cantidad_requerida,
    porcentaje_desperdicio_estandar = EXCLUDED.porcentaje_desperdicio_estandar;

    -- 8. EJECUTAR EL RECÁLCULO MANUAL INICIAL
    -- El trigger trg_recalcular_costo_bom_cambio se ejecuta automáticamente al insertar en ficha_tecnica_bom,
    -- lo que causa que 'productos.costo_calculado_bom' y 'productos.precio_venta' se autocalculen en cascada!
    PERFORM public.fn_recalcular_costo_y_precio_producto_por_id(v_prod_tote);
    PERFORM public.fn_recalcular_costo_y_precio_producto_por_id(v_prod_cross);

END $$;
