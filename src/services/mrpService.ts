/**
 * mrpService.ts — Núcleo de Producción Artesanal
 *
 * Responsabilidades:
 *  - Gestión de Fichas Técnicas (BOM) con costeo en cascada
 *  - Creación y gestión de Órdenes de Producción (OP)
 *  - Avance de estado de taller (dispara triggers de inventario en DB)
 *  - Reporte de desperdicios reales
 *  - KPIs de producción y eficiencia
 *  - Catálogo de productos con costos dinámicos
 */
import { supabase, isSupabaseConfigured } from './supabase';
import type {
  FichaTecnicaBOM,
  BOMConMateria,
  OrdenProduccion,
  OrdenProduccionConDetalle,
  ProductoConCosto,
  Desperdicio,
  CrearOrdenProduccionDTO,
  ActualizarEstadoOPDTO,
  ReportarDesperdicioDTO,
  ActualizarBOMItemDTO,
  KPIProduccion,
  ResumenDesperdicioOP,
  EstadoOP,
} from '../types/mrp';

// ─── Utilidades ────────────────────────────────────────────────────────────

/** Genera un código único de Orden de Producción */
const generarCodigoOP = (): string => {
  const fecha = new Date();
  const yy = String(fecha.getFullYear()).slice(2);
  const mm = String(fecha.getMonth() + 1).padStart(2, '0');
  const dd = String(fecha.getDate()).padStart(2, '0');
  const rand = Math.floor(Math.random() * 9000) + 1000;
  return `OP-${yy}${mm}${dd}-${rand}`;
};

const diasEntre = (desde: string, hasta: string): number => {
  const d1 = new Date(desde).getTime();
  const d2 = new Date(hasta).getTime();
  return Math.max(0, Math.ceil((d2 - d1) / (1000 * 60 * 60 * 24)));
};

// ─── Servicio MRP ──────────────────────────────────────────────────────────

export const MRPService = {

  // ── FICHA TÉCNICA / BOM ───────────────────────────────────────────────────

  /**
   * Obtiene el BOM completo de un producto, enriquecido con datos
   * de la materia prima (nombre, SKU, unidad, CPP) y campos calculados
   * (cantidad con desperdicio, costo por línea).
   */
  getBOMProducto: async (producto_id: string): Promise<BOMConMateria[]> => {
    if (!isSupabaseConfigured) return [];

    const { data, error } = await supabase
      .from('ficha_tecnica_bom')
      .select(`
        *,
        materia_prima:materia_prima_id (
          nombre, sku, unidad_medida, costo_promedio_ponderado
        )
      `)
      .eq('producto_id', producto_id);
    if (error) throw new Error(`Error al obtener BOM: ${error.message}`);

    return (data ?? []).map((row) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mp = (row as any).materia_prima ?? {};
      const cpp = Number(mp.costo_promedio_ponderado ?? 0);
      const cantidadBase = Number(row.cantidad_requerida);
      const desperdicio = Number(row.porcentaje_desperdicio_estandar ?? 0);
      const cantidadConDesperdicio = cantidadBase * (1 + desperdicio);
      return {
        ...row,
        materia_prima_nombre: mp.nombre ?? '—',
        materia_prima_sku: mp.sku ?? '—',
        unidad_medida: mp.unidad_medida ?? '—',
        costo_promedio_ponderado: cpp,
        cantidad_con_desperdicio: cantidadConDesperdicio,
        costo_linea: cantidadConDesperdicio * cpp,
      };
    });
  },

  upsertBOMItem: async (dto: ActualizarBOMItemDTO): Promise<FichaTecnicaBOM> => {
    if (!isSupabaseConfigured) throw new Error('Supabase no configurado.');
    // El trigger en la DB recalculará automáticamente el costo y precio del producto
    const { data, error } = await supabase
      .from('ficha_tecnica_bom')
      .upsert(
        {
          producto_id: dto.producto_id,
          materia_prima_id: dto.materia_prima_id,
          cantidad_requerida: dto.cantidad_requerida,
          porcentaje_desperdicio_estandar: dto.porcentaje_desperdicio_estandar,
        },
        { onConflict: 'producto_id,materia_prima_id' }
      )
      .select()
      .single();
    if (error) throw new Error(`Error al guardar BOM: ${error.message}`);
    return data;
  },

  eliminarBOMItem: async (producto_id: string, materia_prima_id: string): Promise<void> => {
    if (!isSupabaseConfigured) throw new Error('Supabase no configurado.');
    // El trigger DELETE en ficha_tecnica_bom recalcula el precio del producto
    const { error } = await supabase
      .from('ficha_tecnica_bom')
      .delete()
      .eq('producto_id', producto_id)
      .eq('materia_prima_id', materia_prima_id);
    if (error) throw new Error(`Error al eliminar item BOM: ${error.message}`);
  },

  // ── CATÁLOGO CON COSTOS DINÁMICOS ─────────────────────────────────────────

  getProductosConCosto: async (): Promise<ProductoConCosto[]> => {
    if (!isSupabaseConfigured) return [];

    const { data: productos, error: errP } = await supabase
      .from('productos')
      .select('*')
      .order('nombre');
    if (errP) throw new Error(errP.message);

    const { data: stocks, error: errS } = await supabase
      .from('inventario_productos')
      .select('producto_id, cantidad_disponible, cantidad_reservada');
    if (errS) throw new Error(errS.message);

    return await Promise.all(
      (productos ?? []).map(async (p) => {
        const bom = await MRPService.getBOMProducto(p.id);
        const stocksBodega = (stocks ?? []).filter((s) => s.producto_id === p.id);
        const disponible = stocksBodega.reduce((a, s) => a + s.cantidad_disponible, 0);
        const reservado = stocksBodega.reduce((a, s) => a + s.cantidad_reservada, 0);
        const costo = Number(p.costo_calculado_bom ?? 0);
        const precio = Number(p.precio_venta ?? 0);
        return {
          ...p,
          bom,
          stock_consolidado: disponible,
          stock_reservado: reservado,
          margen_real_porcentaje: precio > 0 ? ((precio - costo) / precio) * 100 : 0,
          disponible_para_venta: (disponible - reservado) > 0,
        };
      })
    );
  },

  // ── ÓRDENES DE PRODUCCIÓN ─────────────────────────────────────────────────

  getOrdenes: async (
    filtros?: { estado?: EstadoOP; artesano_id?: string }
  ): Promise<OrdenProduccionConDetalle[]> => {
    if (!isSupabaseConfigured) return [];

    let query = supabase
      .from('ordenes_produccion')
      .select(`
        *,
        productos:producto_id ( nombre, ref_sku ),
        artesano:artesano_responsable_id ( nombre, full_name ),
        bodegas:bodega_destino_id ( nombre ),
        ventas:venta_id ( numero_factura )
      `)
      .order('created_at', { ascending: false });

    if (filtros?.estado) query = query.eq('estado', filtros.estado);
    if (filtros?.artesano_id) query = query.eq('artesano_responsable_id', filtros.artesano_id);

    const { data: ops, error } = await query;
    if (error) throw new Error(error.message);

    // Obtener desperdicios para cada OP
    const opIds = (ops ?? []).map((o) => o.id);
    const { data: desperdicios } = opIds.length > 0
      ? await supabase.from('desperdicios').select('*').in('orden_produccion_id', opIds)
      : { data: [] };

    return (ops ?? []).map((op) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const a = op as any;
      const opDesperdicios = (desperdicios ?? []).filter((d) => d.orden_produccion_id === op.id);
      const avance = op.cantidad_solicitada > 0
        ? Math.round((op.cantidad_producida / op.cantidad_solicitada) * 100)
        : 0;
      return {
        ...op,
        producto_nombre: a.productos?.nombre ?? '—',
        producto_ref: a.productos?.ref_sku ?? '—',
        artesano_nombre: a.artesano?.nombre ?? a.artesano?.full_name ?? '—',
        bodega_destino_nombre: a.bodegas?.nombre ?? '—',
        venta_numero_factura: a.ventas?.numero_factura ?? undefined,
        desperdicios_reportados: opDesperdicios as Desperdicio[],
        porcentaje_avance: avance,
        dias_restantes: op.fecha_entrega_prometida
          ? diasEntre(new Date().toISOString(), op.fecha_entrega_prometida)
          : undefined,
      };
    });
  },

  crearOrden: async (dto: CrearOrdenProduccionDTO): Promise<OrdenProduccion> => {
    if (!isSupabaseConfigured) throw new Error('Supabase no configurado.');
    const { data, error } = await supabase
      .from('ordenes_produccion')
      .insert({
        codigo_op: generarCodigoOP(),
        producto_id: dto.producto_id,
        cantidad_solicitada: dto.cantidad_solicitada,
        bodega_destino_id: dto.bodega_destino_id,
        artesano_responsable_id: dto.artesano_responsable_id ?? null,
        venta_id: dto.venta_id ?? null,
        fecha_inicio: dto.fecha_inicio ?? new Date().toISOString().split('T')[0],
        fecha_entrega_prometida: dto.fecha_entrega_prometida ?? null,
        estado: 'planificada',
      })
      .select()
      .single();
    if (error) throw new Error(`Error al crear OP: ${error.message}`);
    return data;
  },

  /**
   * Avanza el estado de una OP.
   * Al pasar a 'corte' → el trigger fn_procesar_materia_prima_por_op
   * descuenta automáticamente la materia prima del taller según el BOM.
   * Al pasar a 'completada' → el trigger ingresa el producto terminado al inventario.
   */
  avanzarEstadoOP: async (dto: ActualizarEstadoOPDTO): Promise<OrdenProduccion> => {
    if (!isSupabaseConfigured) throw new Error('Supabase no configurado.');

    const updates: Partial<OrdenProduccion> = { estado: dto.nuevo_estado };
    if (dto.nuevo_estado === 'completada' && dto.cantidad_producida !== undefined) {
      updates.cantidad_producida = dto.cantidad_producida;
    }

    const { data, error } = await supabase
      .from('ordenes_produccion')
      .update(updates)
      .eq('id', dto.op_id)
      .select()
      .single();
    if (error) throw new Error(`Error al avanzar estado OP: ${error.message}`);
    return data;
  },

  // ── DESPERDICIOS ─────────────────────────────────────────────────────────

  reportarDesperdicio: async (dto: ReportarDesperdicioDTO): Promise<Desperdicio> => {
    if (!isSupabaseConfigured) throw new Error('Supabase no configurado.');
    const { data, error } = await supabase
      .from('desperdicios')
      .insert({
        orden_produccion_id: dto.orden_produccion_id,
        materia_prima_id: dto.materia_prima_id,
        cantidad_desperdiciada: dto.cantidad_desperdiciada,
        motivo: dto.motivo,
        reportado_por: dto.reportado_por ?? null,
      })
      .select()
      .single();
    if (error) throw new Error(`Error al reportar desperdicio: ${error.message}`);
    return data;
  },

  getDesperdiciosPorOP: async (op_id: string): Promise<Desperdicio[]> => {
    if (!isSupabaseConfigured) return [];
    const { data, error } = await supabase
      .from('desperdicios')
      .select('*')
      .eq('orden_produccion_id', op_id)
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  },

  // ── ANALÍTICA MRP ────────────────────────────────────────────────────────

  getKPIProduccion: async (): Promise<KPIProduccion> => {
    if (!isSupabaseConfigured) {
      return {
        ops_activas: 0, ops_completadas_mes: 0, unidades_producidas_mes: 0,
        eficiencia_desperdicio: 0,
        ops_por_estado: { planificada: 0, corte: 0, armado: 0, acabado: 0, control_calidad: 0, completada: 0, cancelada: 0 },
        artesanos_activos: 0,
      };
    }

    const { data: ops } = await supabase.from('ordenes_produccion').select('estado, cantidad_producida, artesano_responsable_id, created_at');
    const ahora = new Date();
    const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1).toISOString();

    const estadosActivos: EstadoOP[] = ['planificada', 'corte', 'armado', 'acabado', 'control_calidad'];
    const opsMes = (ops ?? []).filter((o) => o.created_at && o.created_at >= inicioMes);

    const opsPorEstado = (ops ?? []).reduce((acc, op) => {
      const e = op.estado as EstadoOP;
      acc[e] = (acc[e] ?? 0) + 1;
      return acc;
    }, {} as Record<EstadoOP, number>);

    const artesanosActivos = new Set(
      (ops ?? [])
        .filter((o) => estadosActivos.includes(o.estado as EstadoOP) && o.artesano_responsable_id)
        .map((o) => o.artesano_responsable_id)
    ).size;

    return {
      ops_activas: (ops ?? []).filter((o) => estadosActivos.includes(o.estado as EstadoOP)).length,
      ops_completadas_mes: opsMes.filter((o) => o.estado === 'completada').length,
      unidades_producidas_mes: opsMes
        .filter((o) => o.estado === 'completada')
        .reduce((a, o) => a + Number(o.cantidad_producida ?? 0), 0),
      eficiencia_desperdicio: 0, // Se calcula con comparación real vs estimado (implementación avanzada)
      ops_por_estado: opsPorEstado,
      artesanos_activos: artesanosActivos,
    };
  },

  getResumenDesperdicios: async (): Promise<ResumenDesperdicioOP[]> => {
    if (!isSupabaseConfigured) return [];

    const ops = await MRPService.getOrdenes();
    return await Promise.all(
      ops.map(async (op) => {
        const bom = await MRPService.getBOMProducto(op.producto_id);
        const estimadoTotal = bom.reduce((a, b) => a + b.costo_linea - (b.cantidad_requerida * b.costo_promedio_ponderado), 0);
        const realTotal = op.desperdicios_reportados.reduce(
          (a, d) => a + Number(d.cantidad_desperdiciada), 0
        );
        const variacion = estimadoTotal > 0 ? ((realTotal - estimadoTotal) / estimadoTotal) * 100 : 0;
        return {
          op_codigo: op.codigo_op,
          producto_nombre: op.producto_nombre,
          desperdicio_estimado_total: estimadoTotal,
          desperdicio_real_total: realTotal,
          variacion_porcentaje: variacion,
          impacto_costo: 0,
        };
      })
    );
  },
};
