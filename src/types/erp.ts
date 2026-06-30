// ============================================================
// TIPOS ERP: Cadena de Suministros, Inventario y Operaciones
// ============================================================
import type { Tables } from './database.types';

// ----- Entidades base de base de datos (Row directa) -----
export type Bodega = Tables<'bodegas'>;
export type Proveedor = Tables<'proveedores'>;
export type MateriaPrima = Tables<'materia_prima'>;
export type InventarioMateriaPrima = Tables<'inventario_materia_prima'>;
export type MovimientoInventario = Tables<'movimientos_inventario'>;
export type CostoHistorico = Tables<'costos_historicos'>;

// ----- Enums de Dominio -----
export type TipoBodega = 'central' | 'taller' | 'satelite' | 'showroom';

export type TipoMovimiento =
  | 'entrada_compra'
  | 'entrada_produccion'
  | 'salida_produccion'
  | 'salida_venta'
  | 'reserva_venta'
  | 'liberacion_reserva'
  | 'ajuste_positivo'
  | 'ajuste_negativo'
  | 'desperdicio_corte';

export type UnidadMedida = 'dm2' | 'unidad' | 'metros' | 'litros' | 'gramos' | 'kg';

// ----- Vistas Enriquecidas (JOIN con relaciones) -----
export interface MateriaPrimaConInventario extends MateriaPrima {
  inventario: Array<{
    bodega_id: string;
    bodega_nombre: string;
    bodega_tipo: TipoBodega;
    cantidad: number;
  }>;
  stock_total: number;
  estado_semaforo: 'critico' | 'alerta' | 'normal'; // semáforo de stock
}

export interface MovimientoConDetalle extends MovimientoInventario {
  materia_prima_nombre?: string;
  materia_prima_sku?: string;
  bodega_origen_nombre?: string;
  bodega_destino_nombre?: string;
  usuario_nombre?: string;
}

// ----- DTOs de Entrada (para operaciones de servicio) -----
export interface EntradaCompraDTO {
  materia_prima_id: string;
  bodega_destino_id: string;
  cantidad: number;
  costo_unitario: number;         // Precio de compra actual (alimenta CPP)
  proveedor_id?: string;
  numero_factura_compra?: string;
  observaciones?: string;
  usuario_operador_id?: string;
}

export interface AjusteInventarioDTO {
  materia_prima_id: string;
  bodega_id: string;
  tipo: 'ajuste_positivo' | 'ajuste_negativo';
  cantidad: number;
  observaciones: string;
  usuario_operador_id?: string;
}

// ----- Analítica y Semáforo de Stock -----
export interface ResumenInventarioMP {
  materia_prima_id: string;
  sku: string;
  nombre: string;
  unidad_medida: string;
  costo_promedio_ponderado: number;
  stock_minimo: number;
  stock_total: number;
  estado_semaforo: 'critico' | 'alerta' | 'normal';
  por_bodega: Array<{
    bodega_id: string;
    bodega_nombre: string;          // aligned with MateriaPrimaConInventario.inventario
    bodega_tipo: TipoBodega;
    cantidad: number;
  }>;
}


export interface KPIInventario {
  total_materias_primas: number;
  materias_criticas: number;   // por debajo del stock_minimo
  materias_en_alerta: number;  // entre 100% y 120% del mínimo
  valor_total_bodega: number;  // suma: cantidad × CPP de todos los insumos
  ultimos_movimientos: MovimientoConDetalle[];
}

// ----- Analítica por Canal de Venta -----
export interface AnaliticaCanalVenta {
  canal: 'e_commerce' | 'showroom' | 'mayorista';
  total_ventas: number;
  total_unidades: number;
  ingresos: number;
  costo_historico: number;
  margen_bruto: number;
  margen_porcentaje: number;
}
