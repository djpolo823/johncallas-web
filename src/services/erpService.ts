/**
 * erpService.ts — Núcleo Operacional de Inventario
 *
 * Responsabilidades:
 *  - Gestión de materia prima y proveedores
 *  - Entradas por compra (dispara trigger CPP en DB)
 *  - Ajustes de inventario por bodega
 *  - Semáforo de stock y alertas críticas
 *  - Analítica por canal de venta
 *  - Bitácora de movimientos con trazabilidad completa
 */
import { supabase, isSupabaseConfigured } from './supabase';
import type {
  MateriaPrima,
  MateriaPrimaConInventario,
  Bodega,
  Proveedor,
  MovimientoConDetalle,
  EntradaCompraDTO,
  AjusteInventarioDTO,
  ResumenInventarioMP,
  KPIInventario,
  AnaliticaCanalVenta,
} from '../types/erp';

// ─── Utilidades ────────────────────────────────────────────────────────────

/** Formatea un valor monetario en COP */
export const formatCOP = (value: number | string | null | undefined): string => {
  const clean = Number(value || 0);
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(clean);
};

/** Calcula el estado del semáforo de stock */
const calcularSemaforo = (
  stock: number,
  minimo: number
): 'critico' | 'alerta' | 'normal' => {
  if (stock <= minimo) return 'critico';
  if (stock <= minimo * 1.2) return 'alerta';
  return 'normal';
};

// ─── Bodegas ───────────────────────────────────────────────────────────────

export const ERPService = {
  // ── BODEGAS ──────────────────────────────────────────────────────────────

  getBodegas: async (): Promise<Bodega[]> => {
    if (!isSupabaseConfigured) return [];
    const { data, error } = await supabase
      .from('bodegas')
      .select('*')
      .order('tipo');
    if (error) throw new Error(`Error al obtener bodegas: ${error.message}`);
    return data ?? [];
  },

  // ── PROVEEDORES ──────────────────────────────────────────────────────────

  getProveedores: async (): Promise<Proveedor[]> => {
    if (!isSupabaseConfigured) return [];
    const { data, error } = await supabase
      .from('proveedores')
      .select('*')
      .order('nombre');
    if (error) throw new Error(`Error al obtener proveedores: ${error.message}`);
    return data ?? [];
  },

  crearProveedor: async (
    proveedor: Omit<Proveedor, 'id' | 'created_at'>
  ): Promise<Proveedor> => {
    if (!isSupabaseConfigured) throw new Error('Supabase no configurado.');
    const { data, error } = await supabase
      .from('proveedores')
      .insert(proveedor)
      .select()
      .single();
    if (error) throw new Error(`Error al crear proveedor: ${error.message}`);
    return data;
  },

  // ── MATERIA PRIMA ─────────────────────────────────────────────────────────

  getMateriasPrimas: async (): Promise<MateriaPrima[]> => {
    if (!isSupabaseConfigured) return [];
    const { data, error } = await supabase
      .from('materia_prima')
      .select('*')
      .order('nombre');
    if (error) throw new Error(`Error al obtener materias primas: ${error.message}`);
    return data ?? [];
  },

  /**
   * Retorna cada materia prima con su inventario consolidado por bodega
   * y calcula el semáforo de stock automáticamente.
   */
  getInventarioConsolidado: async (): Promise<MateriaPrimaConInventario[]> => {
    if (!isSupabaseConfigured) return [];

    const { data: materias, error: errMaterias } = await supabase
      .from('materia_prima')
      .select('*')
      .order('nombre');
    if (errMaterias) throw new Error(errMaterias.message);

    const { data: stocks, error: errStocks } = await supabase
      .from('inventario_materia_prima')
      .select('materia_prima_id, bodega_id, cantidad, bodegas(nombre, tipo)');
    if (errStocks) throw new Error(errStocks.message);

    return (materias ?? []).map((mp) => {
      const stocksBodega = (stocks ?? [])
        .filter((s) => s.materia_prima_id === mp.id)
        .map((s) => ({
          bodega_id: s.bodega_id,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          bodega_nombre: (s as any).bodegas?.nombre ?? '—',
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          bodega_tipo: ((s as any).bodegas?.tipo ?? 'central') as MateriaPrimaConInventario['inventario'][0]['bodega_tipo'],
          cantidad: Number(s.cantidad),
        }));

      const stockTotal = stocksBodega.reduce((acc, b) => acc + b.cantidad, 0);
      const minimo = Number(mp.stock_minimo ?? 0);

      return {
        ...mp,
        inventario: stocksBodega,
        stock_total: stockTotal,
        estado_semaforo: calcularSemaforo(stockTotal, minimo),
      };
    });
  },

  crearMateriaPrima: async (
    mp: Omit<MateriaPrima, 'id' | 'created_at'>
  ): Promise<MateriaPrima> => {
    if (!isSupabaseConfigured) throw new Error('Supabase no configurado.');
    const { data, error } = await supabase
      .from('materia_prima')
      .insert(mp)
      .select()
      .single();
    if (error) throw new Error(`Error al crear materia prima: ${error.message}`);
    return data;
  },

  actualizarMateriaPrima: async (
    id: string,
    updates: Partial<Omit<MateriaPrima, 'id' | 'created_at'>>
  ): Promise<MateriaPrima> => {
    if (!isSupabaseConfigured) throw new Error('Supabase no configurado.');
    const { data, error } = await supabase
      .from('materia_prima')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw new Error(`Error al actualizar materia prima: ${error.message}`);
    return data;
  },

  // ── ENTRADA POR COMPRA (dispara trigger CPP en DB) ────────────────────────

  /**
   * Registra una entrada de material por compra.
   * Este INSERT en movimientos_inventario dispara automáticamente
   * el trigger fn_actualizar_materia_prima_cpp en PostgreSQL,
   * que recalcula el Costo Promedio Ponderado y propaga el cambio
   * al precio de venta de todos los productos que usan este insumo.
   */
  registrarEntradaCompra: async (dto: EntradaCompraDTO): Promise<void> => {
    if (!isSupabaseConfigured) throw new Error('Supabase no configurado.');

    // 1. Insertar movimiento de inventario (dispara trigger CPP)
    const { error: errMov } = await supabase
      .from('movimientos_inventario')
      .insert({
        tipo_movimiento: 'entrada_compra',
        materia_prima_id: dto.materia_prima_id,
        bodega_destino_id: dto.bodega_destino_id,
        cantidad: dto.cantidad,
        costo_unitario: dto.costo_unitario,
        observaciones: dto.observaciones ?? `Compra registrada. Factura: ${dto.numero_factura_compra ?? 'N/A'}`,
        usuario_operador_id: dto.usuario_operador_id ?? null,
      });
    if (errMov) throw new Error(`Error al registrar movimiento: ${errMov.message}`);

    // 2. Actualizar stock físico en la bodega destino
    const { data: existente } = await supabase
      .from('inventario_materia_prima')
      .select('id, cantidad')
      .eq('materia_prima_id', dto.materia_prima_id)
      .eq('bodega_id', dto.bodega_destino_id)
      .maybeSingle();

    if (existente) {
      const { error: errUpd } = await supabase
        .from('inventario_materia_prima')
        .update({ cantidad: Number(existente.cantidad) + dto.cantidad })
        .eq('id', existente.id);
      if (errUpd) throw new Error(`Error al actualizar stock: ${errUpd.message}`);
    } else {
      const { error: errIns } = await supabase
        .from('inventario_materia_prima')
        .insert({
          materia_prima_id: dto.materia_prima_id,
          bodega_id: dto.bodega_destino_id,
          cantidad: dto.cantidad,
        });
      if (errIns) throw new Error(`Error al crear registro de stock: ${errIns.message}`);
    }
  },

  // ── AJUSTE MANUAL DE INVENTARIO ──────────────────────────────────────────

  registrarAjuste: async (dto: AjusteInventarioDTO): Promise<void> => {
    if (!isSupabaseConfigured) throw new Error('Supabase no configurado.');

    const delta = dto.tipo === 'ajuste_positivo' ? dto.cantidad : -dto.cantidad;

    const { data: existente, error: errSel } = await supabase
      .from('inventario_materia_prima')
      .select('id, cantidad')
      .eq('materia_prima_id', dto.materia_prima_id)
      .eq('bodega_id', dto.bodega_id)
      .maybeSingle();
    if (errSel) throw new Error(errSel.message);

    const cantidadActual = Number(existente?.cantidad ?? 0);
    const nuevaCantidad = cantidadActual + delta;
    if (nuevaCantidad < 0) throw new Error('El ajuste resultaría en stock negativo.');

    if (existente) {
      await supabase
        .from('inventario_materia_prima')
        .update({ cantidad: nuevaCantidad })
        .eq('id', existente.id);
    } else if (dto.tipo === 'ajuste_positivo') {
      await supabase
        .from('inventario_materia_prima')
        .insert({ materia_prima_id: dto.materia_prima_id, bodega_id: dto.bodega_id, cantidad: dto.cantidad });
    }

    await supabase.from('movimientos_inventario').insert({
      tipo_movimiento: dto.tipo,
      materia_prima_id: dto.materia_prima_id,
      bodega_origen_id: dto.bodega_id,
      cantidad: dto.cantidad,
      costo_unitario: 0,
      observaciones: dto.observaciones,
      usuario_operador_id: dto.usuario_operador_id ?? null,
    });
  },

  // ── BITÁCORA DE MOVIMIENTOS ───────────────────────────────────────────────

  getMovimientos: async (
    filtros?: { materia_prima_id?: string; bodega_id?: string; limite?: number }
  ): Promise<MovimientoConDetalle[]> => {
    if (!isSupabaseConfigured) return [];

    let query = supabase
      .from('movimientos_inventario')
      .select(`
        *,
        materia_prima:materia_prima_id ( nombre, sku ),
        bodega_origen:bodega_origen_id ( nombre ),
        bodega_destino:bodega_destino_id ( nombre )
      `)
      .order('created_at', { ascending: false })
      .limit(filtros?.limite ?? 100);

    if (filtros?.materia_prima_id) {
      query = query.eq('materia_prima_id', filtros.materia_prima_id);
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);

    return (data ?? []).map((m) => ({
      ...m,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      materia_prima_nombre: (m as any).materia_prima?.nombre,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      materia_prima_sku: (m as any).materia_prima?.sku,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      bodega_origen_nombre: (m as any).bodega_origen?.nombre,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      bodega_destino_nombre: (m as any).bodega_destino?.nombre,
    }));
  },

  // ── KPIs Y SEMÁFORO ───────────────────────────────────────────────────────

  getResumenInventario: async (): Promise<ResumenInventarioMP[]> => {
    if (!isSupabaseConfigured) return [];

    const consolidado = await ERPService.getInventarioConsolidado();
    return consolidado.map((mp) => ({
      materia_prima_id: mp.id,
      sku: mp.sku,
      nombre: mp.nombre,
      unidad_medida: mp.unidad_medida,
      costo_promedio_ponderado: Number(mp.costo_promedio_ponderado ?? 0),
      stock_minimo: Number(mp.stock_minimo ?? 0),
      stock_total: mp.stock_total,
      estado_semaforo: mp.estado_semaforo,
      por_bodega: mp.inventario,
    }));
  },

  getKPIInventario: async (): Promise<KPIInventario> => {
    if (!isSupabaseConfigured) {
      return {
        total_materias_primas: 0, materias_criticas: 0,
        materias_en_alerta: 0, valor_total_bodega: 0,
        ultimos_movimientos: [],
      };
    }

    const resumen = await ERPService.getResumenInventario();
    const movimientos = await ERPService.getMovimientos({ limite: 10 });

    return {
      total_materias_primas: resumen.length,
      materias_criticas: resumen.filter((r) => r.estado_semaforo === 'critico').length,
      materias_en_alerta: resumen.filter((r) => r.estado_semaforo === 'alerta').length,
      valor_total_bodega: resumen.reduce(
        (acc, r) => acc + r.stock_total * r.costo_promedio_ponderado, 0
      ),
      ultimos_movimientos: movimientos,
    };
  },

  // ── ANALÍTICA POR CANAL DE VENTA ──────────────────────────────────────────

  getAnaliticaPorCanal: async (): Promise<AnaliticaCanalVenta[]> => {
    if (!isSupabaseConfigured) return [];

    const { data, error } = await supabase
      .from('ventas')
      .select('canal_venta, total, costo_historico_total, detalle_venta(cantidad)')
      .eq('estado', 'entregado');
    if (error) throw new Error(error.message);

    const canales: AnaliticaCanalVenta['canal'][] = ['e_commerce', 'showroom', 'mayorista'];
    return canales.map((canal) => {
      const ventasCanal = (data ?? []).filter((v) => v.canal_venta === canal);
      const ingresos = ventasCanal.reduce((a, v) => a + Number(v.total), 0);
      const costo = ventasCanal.reduce((a, v) => a + Number(v.costo_historico_total), 0);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const unidades = ventasCanal.reduce((a, v) => a + ((v as any).detalle_venta?.reduce((s: number, d: any) => s + d.cantidad, 0) ?? 0), 0);
      const margen = ingresos - costo;
      return {
        canal,
        total_ventas: ventasCanal.length,
        total_unidades: unidades,
        ingresos,
        costo_historico: costo,
        margen_bruto: margen,
        margen_porcentaje: ingresos > 0 ? (margen / ingresos) * 100 : 0,
      };
    });
  },
};
