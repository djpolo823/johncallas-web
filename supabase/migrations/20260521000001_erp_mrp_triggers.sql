-- =========================================================================
-- 1. MOTOR DE COSTEO: COSTO PROMEDIO PONDERADO (CPP) DE MATERIA PRIMA
-- =========================================================================

CREATE OR REPLACE FUNCTION public.fn_actualizar_materia_prima_cpp()
RETURNS TRIGGER AS $$
DECLARE
    v_stock_actual NUMERIC(12,4);
    v_cpp_actual NUMERIC(12,2);
    v_nuevo_cpp NUMERIC(12,2);
    v_cantidad_total_inventario NUMERIC(12,4);
BEGIN
    -- Solo actuar en entradas por compra (para recalcular el CPP del insumo)
    IF NEW.tipo_movimiento = 'entrada_compra' AND NEW.materia_prima_id IS NOT NULL THEN
        
        -- Obtener el stock físico actual consolidado de todas las bodegas
        SELECT COALESCE(SUM(cantidad), 0) INTO v_stock_actual 
        FROM public.inventario_materia_prima 
        WHERE materia_prima_id = NEW.materia_prima_id;
        
        -- Obtener el CPP anterior
        SELECT COALESCE(costo_promedio_ponderado, 0.00) INTO v_cpp_actual
        FROM public.materia_prima
        WHERE id = NEW.materia_prima_id;

        -- Calcular nuevo inventario total acumulando la nueva entrada
        v_cantidad_total_inventario := v_stock_actual + NEW.cantidad;

        IF v_cantidad_total_inventario > 0 THEN
            -- Ecuación de Costo Promedio Ponderado:
            -- CPP = ((Stock Físico Anterior * CPP Anterior) + (Nueva Cantidad * Nuevo Costo)) / Stock Total Nuevo
            v_nuevo_cpp := ((v_stock_actual * v_cpp_actual) + (NEW.cantidad * NEW.costo_unitario)) / v_cantidad_total_inventario;
        ELSE
            v_nuevo_cpp := NEW.costo_unitario;
        END IF;

        -- Registrar costo histórico para auditorías de inflación
        INSERT INTO public.costos_historicos (materia_prima_id, tipo_costo, valor)
        VALUES (NEW.materia_prima_id, 'compra', NEW.costo_unitario);

        -- Actualizar el costo de la materia prima consolidada
        UPDATE public.materia_prima
        SET costo_promedio_ponderado = v_nuevo_cpp
        WHERE id = NEW.materia_prima_id;

    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger de Inserción de Movimiento
DROP TRIGGER IF EXISTS trg_actualizar_materia_prima_cpp ON public.movimientos_inventario;
CREATE TRIGGER trg_actualizar_materia_prima_cpp
AFTER INSERT ON public.movimientos_inventario
FOR EACH ROW
EXECUTE FUNCTION public.fn_actualizar_materia_prima_cpp();


-- =========================================================================
-- 2. EFECTO CASCADA: RECALCULAR COSTO BOM Y PRECIO DINÁMICO DEL PRODUCTO
-- =========================================================================

CREATE OR REPLACE FUNCTION public.fn_recalcular_costo_y_precio_producto_por_id(p_producto_id UUID)
RETURNS VOID AS $$
DECLARE
    v_costo_materiales NUMERIC(12,2);
    v_costo_mano_obra NUMERIC(12,2);
    v_margen NUMERIC(5,4);
    v_costo_total NUMERIC(12,2);
    v_precio_venta NUMERIC(12,2);
BEGIN
    -- Calcular sumatoria de materiales según la Ficha Técnica (BOM) y el CPP de los insumos
    SELECT COALESCE(SUM(bom.cantidad_requerida * (1 + bom.porcentaje_desperdicio_estandar) * mp.costo_promedio_ponderado), 0.00)
    INTO v_costo_materiales
    FROM public.ficha_tecnica_bom bom
    JOIN public.materia_prima mp ON bom.materia_prima_id = mp.id
    WHERE bom.producto_id = p_producto_id;

    -- Obtener valores de mano de obra y margen del producto actual
    SELECT costo_mano_obra, margen_deseado
    INTO v_costo_mano_obra, v_margen
    FROM public.productos
    WHERE id = p_producto_id;

    v_costo_total := v_costo_materiales + COALESCE(v_costo_mano_obra, 0.00);

    -- Aplicar ecuación de Margen Dinámico: Precio = Costo / (1 - Margen)
    IF v_margen < 1.0000 THEN
        v_precio_venta := v_costo_total / (1 - v_margen);
    ELSE
        v_precio_venta := v_costo_total * 3.33; -- Salvaguarda
    END IF;

    -- Actualizar el producto con el costo acumulado de materiales y precio
    UPDATE public.productos
    SET costo_calculado_bom = v_costo_total,
        precio_venta = ROUND(v_precio_venta, 2)
    WHERE id = p_producto_id;
END;
$$ LANGUAGE plpgsql;

-- Función Trigger para cambios en la Ficha Técnica (BOM)
CREATE OR REPLACE FUNCTION public.fn_recalcular_costo_y_precio_producto_trigger()
RETURNS TRIGGER AS $$
DECLARE
    v_producto_id UUID;
BEGIN
    IF TG_OP = 'DELETE' THEN
        v_producto_id := OLD.producto_id;
    ELSE
        v_producto_id := NEW.producto_id;
    END IF;

    PERFORM public.fn_recalcular_costo_y_precio_producto_por_id(v_producto_id);
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Triggers en Ficha Técnica (BOM)
DROP TRIGGER IF EXISTS trg_recalcular_costo_bom_cambio ON public.ficha_tecnica_bom;
CREATE TRIGGER trg_recalcular_costo_bom_cambio
AFTER INSERT OR UPDATE OR DELETE ON public.ficha_tecnica_bom
FOR EACH ROW
EXECUTE FUNCTION public.fn_recalcular_costo_y_precio_producto_trigger();

-- Trigger para propagar cambios de CPP de Materia Prima a Productos Terminados asociados
CREATE OR REPLACE FUNCTION public.fn_propagar_cambio_cpp_materia_prima()
RETURNS TRIGGER AS $$
DECLARE
    r_producto RECORD;
BEGIN
    -- Buscar todos los productos que contienen la materia prima en su BOM
    FOR r_producto IN 
        SELECT DISTINCT producto_id 
        FROM public.ficha_tecnica_bom 
        WHERE materia_prima_id = NEW.id
    LOOP
        PERFORM public.fn_recalcular_costo_y_precio_producto_por_id(r_producto.producto_id);
    END LOOP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_propagar_cambio_cpp_materia_prima ON public.materia_prima;
CREATE TRIGGER trg_propagar_cambio_cpp_materia_prima
AFTER UPDATE OF costo_promedio_ponderado ON public.materia_prima
FOR EACH ROW
EXECUTE FUNCTION public.fn_propagar_cambio_cpp_materia_prima();


-- =========================================================================
-- 3. INTEGRACIÓN MRP: CONTROL AUTOMÁTICO DE MATERIALES POR ORDEN DE PRODUCCIÓN (OP)
-- =========================================================================

CREATE OR REPLACE FUNCTION public.fn_procesar_materia_prima_por_op()
RETURNS TRIGGER AS $$
DECLARE
    r_bom RECORD;
    v_bodega_taller_id UUID;
    v_cantidad_consumo NUMERIC(12,4);
BEGIN
    -- Si la OP pasa de 'planificada' a 'corte', descontamos la materia prima estimada en bodega
    IF NEW.estado = 'corte' AND (OLD.estado IS NULL OR OLD.estado = 'planificada') THEN
        
        -- Obtener la bodega de tipo taller (o central si no hay taller configurado)
        SELECT id INTO v_bodega_taller_id 
        FROM public.bodegas 
        WHERE tipo = 'taller' LIMIT 1;
        
        IF v_bodega_taller_id IS NULL THEN
            SELECT id INTO v_bodega_taller_id FROM public.bodegas WHERE tipo = 'central' LIMIT 1;
        END IF;

        IF v_bodega_taller_id IS NOT NULL THEN
            -- Recorrer el BOM del producto asociado a la OP
            FOR r_bom IN 
                SELECT materia_prima_id, cantidad_requerida, porcentaje_desperdicio_estandar
                FROM public.ficha_tecnica_bom
                WHERE producto_id = NEW.producto_id
            LOOP
                -- Cantidad calculada: (Cantidad requerida * (1 + Desperdicio estándar %)) * Cantidad de items a fabricar
                v_cantidad_consumo := (r_bom.cantidad_requerida * (1 + r_bom.porcentaje_desperdicio_estandar)) * NEW.cantidad_solicitada;

                -- Restar de la tabla de inventario físico de materia prima
                UPDATE public.inventario_materia_prima
                SET cantidad = cantidad - v_cantidad_consumo
                WHERE materia_prima_id = r_bom.materia_prima_id AND bodega_id = v_bodega_taller_id;

                -- Insertar movimiento transaccional de salida para auditoría física
                INSERT INTO public.movimientos_inventario (
                    tipo_movimiento, materia_prima_id, bodega_origen_id, cantidad, documento_referencia_id, observaciones
                ) VALUES (
                    'salida_produccion', r_bom.materia_prima_id, v_bodega_taller_id, v_cantidad_consumo, NEW.id, 
                    'Consumo estimado en BOM para OP Código: ' || NEW.codigo_op
                );
            END LOOP;
        END IF;
    END IF;

    -- Si la OP se marca como 'completada', ingresamos las unidades producidas al Producto Terminado
    IF NEW.estado = 'completada' AND OLD.estado != 'completada' THEN
        -- Incrementar stock disponible en la bodega de destino asignada
        INSERT INTO public.inventario_productos (producto_id, bodega_id, cantidad_disponible)
        VALUES (NEW.producto_id, NEW.bodega_destino_id, NEW.cantidad_producida)
        ON CONFLICT (producto_id, bodega_id)
        DO UPDATE SET cantidad_disponible = public.inventario_productos.cantidad_disponible + EXCLUDED.cantidad_disponible;

        -- Insertar movimiento transaccional de entrada
        INSERT INTO public.movimientos_inventario (
            tipo_movimiento, producto_id, bodega_destino_id, cantidad, documento_referencia_id, observaciones
        ) VALUES (
            'entrada_produccion', NEW.producto_id, NEW.bodega_destino_id, NEW.cantidad_producida, NEW.id,
            'Entrada de producto terminado desde OP Código: ' || NEW.codigo_op
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger en Órdenes de Producción
DROP TRIGGER IF EXISTS trg_procesar_materia_prima_por_op ON public.ordenes_produccion;
CREATE TRIGGER trg_procesar_materia_prima_por_op
AFTER UPDATE ON public.ordenes_produccion
FOR EACH ROW
EXECUTE FUNCTION public.fn_procesar_materia_prima_por_op();
