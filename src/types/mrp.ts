// ============================================================
// TIPOS MRP: Producción, BOM, Órdenes y Control de Taller
// ============================================================
import type { Tables } from './database.types';

// ----- Entidades base de base de datos (Row directa) -----
export type FichaTecnicaBOM = Tables<'ficha_tecnica_bom'>;
export type OrdenProduccion = Tables<'ordenes_produccion'>;
export type Desperdicio = Tables<'desperdicios'>;
export type ProductoDB = Tables<'productos'>;
export type InventarioProducto = Tables<'inventario_productos'>;

// ----- Enums de Dominio -----
export type EstadoOP =
  | 'planificada'
  | 'corte'
  | 'armado'
  | 'acabado'
  | 'control_calidad'
  | 'completada'
  | 'cancelada';

export type MotivoDesperdicio =
  | 'imperfeccion_cuero'
  | 'error_corte'
  | 'sobrante_molde'
  | 'defecto_material'
  | 'error_costura'
  | 'otro';

// ----- Vistas Enriquecidas (JOIN con relaciones) -----
export interface BOMConMateria extends FichaTecnicaBOM {
  materia_prima_nombre: string;
  materia_prima_sku: string;
  unidad_medida: string;
  costo_promedio_ponderado: number;
  // Campos calculados en cliente
  cantidad_con_desperdicio: number;      // cantidad_requerida × (1 + porcentaje_desperdicio)
  costo_linea: number;                   // cantidad_con_desperdicio × CPP
}

export interface ProductoConCosto extends ProductoDB {
  bom: BOMConMateria[];
  stock_consolidado: number;             // suma de cantidad_disponible en todas las bodegas
  stock_reservado: number;               // suma de cantidad_reservada
  margen_real_porcentaje: number;        // (precio_venta - costo_calculado_bom) / precio_venta
  disponible_para_venta: boolean;        // stock_consolidado - stock_reservado > 0
}

export interface OrdenProduccionConDetalle extends OrdenProduccion {
  producto_nombre: string;
  producto_ref: string;
  artesano_nombre?: string;
  bodega_destino_nombre?: string;
  venta_numero_factura?: string;
  desperdicios_reportados: Desperdicio[];
  // Progreso calculado
  porcentaje_avance: number;             // (cantidad_producida / cantidad_solicitada) × 100
  dias_restantes?: number;
}

// ----- DTOs de Entrada (para operaciones de servicio) -----
export interface CrearOrdenProduccionDTO {
  producto_id: string;
  cantidad_solicitada: number;
  bodega_destino_id: string;
  artesano_responsable_id?: string;
  venta_id?: string;
  fecha_inicio?: string;
  fecha_entrega_prometida?: string;
}

export interface ActualizarEstadoOPDTO {
  op_id: string;
  nuevo_estado: EstadoOP;
  cantidad_producida?: number;           // requerido al marcar como 'completada'
  observaciones?: string;
}

export interface ReportarDesperdicioDTO {
  orden_produccion_id: string;
  materia_prima_id: string;
  cantidad_desperdiciada: number;
  motivo: MotivoDesperdicio | string;
  reportado_por?: string;
}

export interface ActualizarBOMItemDTO {
  producto_id: string;
  materia_prima_id: string;
  cantidad_requerida: number;
  porcentaje_desperdicio_estandar: number;
}

// ----- Analítica MRP -----
export interface KPIProduccion {
  ops_activas: number;                   // planificada + corte + armado + acabado + control_calidad
  ops_completadas_mes: number;
  unidades_producidas_mes: number;
  eficiencia_desperdicio: number;        // desperdicio_real / desperdicio_estimado × 100
  ops_por_estado: Record<EstadoOP, number>;
  artesanos_activos: number;
}

export interface ResumenDesperdicioOP {
  op_codigo: string;
  producto_nombre: string;
  desperdicio_estimado_total: number;    // suma de (cantidad × % estándar) por ítem BOM
  desperdicio_real_total: number;        // suma de desperdicios reportados en la OP
  variacion_porcentaje: number;          // (real - estimado) / estimado × 100
  impacto_costo: number;                 // variacion × CPP del material
}
