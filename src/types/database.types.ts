// ⚠️  AUTO-GENERADO POR SUPABASE — NO EDITAR MANUALMENTE
// Generado el: 2026-05-22 | Proyecto: qzmhkyazrnowicrjkcvc
// Regenerar con: supabase gen types typescript --project-id qzmhkyazrnowicrjkcvc

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      bodegas: {
        Row: {
          created_at: string | null
          id: string
          nombre: string
          tipo: string
          ubicacion: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          nombre: string
          tipo: string
          ubicacion?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          nombre?: string
          tipo?: string
          ubicacion?: string | null
        }
        Relationships: []
      }
      costos_historicos: {
        Row: {
          created_at: string | null
          id: string
          materia_prima_id: string | null
          tipo_costo: string
          valor: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          materia_prima_id?: string | null
          tipo_costo?: string
          valor: number
        }
        Update: {
          created_at?: string | null
          id?: string
          materia_prima_id?: string | null
          tipo_costo?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "costos_historicos_materia_prima_id_fkey"
            columns: ["materia_prima_id"]
            isOneToOne: false
            referencedRelation: "materia_prima"
            referencedColumns: ["id"]
          },
        ]
      }
      desperdicios: {
        Row: {
          cantidad_desperdiciada: number
          created_at: string | null
          id: string
          materia_prima_id: string
          motivo: string
          orden_produccion_id: string
          reportado_por: string | null
        }
        Insert: {
          cantidad_desperdiciada: number
          created_at?: string | null
          id?: string
          materia_prima_id: string
          motivo: string
          orden_produccion_id: string
          reportado_por?: string | null
        }
        Update: {
          cantidad_desperdiciada?: number
          created_at?: string | null
          id?: string
          materia_prima_id?: string
          motivo?: string
          orden_produccion_id?: string
          reportado_por?: string | null
        }
        Relationships: []
      }
      detalle_venta: {
        Row: {
          cantidad: number
          costo_unitario_historico: number
          created_at: string | null
          id: string
          precio_unitario: number
          producto_id: string
          subtotal: number
          venta_id: string
        }
        Insert: {
          cantidad: number
          costo_unitario_historico: number
          created_at?: string | null
          id?: string
          precio_unitario: number
          producto_id: string
          subtotal: number
          venta_id: string
        }
        Update: {
          cantidad?: number
          costo_unitario_historico?: number
          created_at?: string | null
          id?: string
          precio_unitario?: number
          producto_id?: string
          subtotal?: number
          venta_id?: string
        }
        Relationships: []
      }
      ficha_tecnica_bom: {
        Row: {
          cantidad_requerida: number
          created_at: string | null
          id: string
          materia_prima_id: string
          porcentaje_desperdicio_estandar: number | null
          producto_id: string
        }
        Insert: {
          cantidad_requerida: number
          created_at?: string | null
          id?: string
          materia_prima_id: string
          porcentaje_desperdicio_estandar?: number | null
          producto_id: string
        }
        Update: {
          cantidad_requerida?: number
          created_at?: string | null
          id?: string
          materia_prima_id?: string
          porcentaje_desperdicio_estandar?: number | null
          producto_id?: string
        }
        Relationships: []
      }
      inventario_materia_prima: {
        Row: {
          bodega_id: string
          cantidad: number
          created_at: string | null
          id: string
          materia_prima_id: string
          updated_at: string | null
        }
        Insert: {
          bodega_id: string
          cantidad?: number
          created_at?: string | null
          id?: string
          materia_prima_id: string
          updated_at?: string | null
        }
        Update: {
          bodega_id?: string
          cantidad?: number
          created_at?: string | null
          id?: string
          materia_prima_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      inventario_productos: {
        Row: {
          bodega_id: string
          cantidad_disponible: number
          cantidad_reservada: number
          id: string
          producto_id: string
        }
        Insert: {
          bodega_id: string
          cantidad_disponible?: number
          cantidad_reservada?: number
          id?: string
          producto_id: string
        }
        Update: {
          bodega_id?: string
          cantidad_disponible?: number
          cantidad_reservada?: number
          id?: string
          producto_id?: string
        }
        Relationships: []
      }
      materia_prima: {
        Row: {
          costo_promedio_ponderado: number | null
          created_at: string | null
          descripcion: string | null
          id: string
          nombre: string
          proveedor_preferido_id: string | null
          sku: string
          stock_minimo: number | null
          unidad_medida: string
        }
        Insert: {
          costo_promedio_ponderado?: number | null
          created_at?: string | null
          descripcion?: string | null
          id?: string
          nombre: string
          proveedor_preferido_id?: string | null
          sku: string
          stock_minimo?: number | null
          unidad_medida: string
        }
        Update: {
          costo_promedio_ponderado?: number | null
          created_at?: string | null
          descripcion?: string | null
          id?: string
          nombre?: string
          proveedor_preferido_id?: string | null
          sku?: string
          stock_minimo?: number | null
          unidad_medida?: string
        }
        Relationships: []
      }
      movimientos_inventario: {
        Row: {
          bodega_destino_id: string | null
          bodega_origen_id: string | null
          cantidad: number
          costo_unitario: number
          created_at: string | null
          documento_referencia_id: string | null
          id: string
          materia_prima_id: string | null
          observaciones: string | null
          producto_id: string | null
          tipo_movimiento: string
          usuario_operador_id: string | null
        }
        Insert: {
          bodega_destino_id?: string | null
          bodega_origen_id?: string | null
          cantidad: number
          costo_unitario?: number
          created_at?: string | null
          documento_referencia_id?: string | null
          id?: string
          materia_prima_id?: string | null
          observaciones?: string | null
          producto_id?: string | null
          tipo_movimiento: string
          usuario_operador_id?: string | null
        }
        Update: {
          bodega_destino_id?: string | null
          bodega_origen_id?: string | null
          cantidad?: number
          costo_unitario?: number
          created_at?: string | null
          documento_referencia_id?: string | null
          id?: string
          materia_prima_id?: string | null
          observaciones?: string | null
          producto_id?: string | null
          tipo_movimiento?: string
          usuario_operador_id?: string | null
        }
        Relationships: []
      }
      ordenes_produccion: {
        Row: {
          artesano_responsable_id: string | null
          bodega_destino_id: string | null
          cantidad_producida: number
          cantidad_solicitada: number
          codigo_op: string
          created_at: string | null
          estado: string
          fecha_entrega_prometida: string | null
          fecha_inicio: string | null
          id: string
          producto_id: string
          venta_id: string | null
        }
        Insert: {
          artesano_responsable_id?: string | null
          bodega_destino_id?: string | null
          cantidad_producida?: number
          cantidad_solicitada: number
          codigo_op: string
          created_at?: string | null
          estado?: string
          fecha_entrega_prometida?: string | null
          fecha_inicio?: string | null
          id?: string
          producto_id: string
          venta_id?: string | null
        }
        Update: {
          artesano_responsable_id?: string | null
          bodega_destino_id?: string | null
          cantidad_producida?: number
          cantidad_solicitada?: number
          codigo_op?: string
          created_at?: string | null
          estado?: string
          fecha_entrega_prometida?: string | null
          fecha_inicio?: string | null
          id?: string
          producto_id?: string
          venta_id?: string | null
        }
        Relationships: []
      }
      productos: {
        Row: {
          bajo_pedido: boolean | null
          categoria: string
          categoria_id: string
          costo_calculado_bom: number | null
          costo_mano_obra: number | null
          created_at: string | null
          descripcion: string | null
          filtros: Json
          id: string
          imagenes: string[]
          margen_deseado: number | null
          nombre: string
          precio_mayoreo: number | null
          precio_venta: number
          ref_sku: string
        }
        Insert: {
          bajo_pedido?: boolean | null
          categoria: string
          categoria_id: string
          costo_calculado_bom?: number | null
          costo_mano_obra?: number | null
          created_at?: string | null
          descripcion?: string | null
          filtros?: Json
          id?: string
          imagenes: string[]
          margen_deseado?: number | null
          nombre: string
          precio_mayoreo?: number | null
          precio_venta?: number
          ref_sku: string
        }
        Update: {
          bajo_pedido?: boolean | null
          categoria?: string
          categoria_id?: string
          costo_calculado_bom?: number | null
          costo_mano_obra?: number | null
          created_at?: string | null
          descripcion?: string | null
          filtros?: Json
          id?: string
          imagenes?: string[]
          margen_deseado?: number | null
          nombre?: string
          precio_mayoreo?: number | null
          precio_venta?: number
          ref_sku?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          nombre: string | null
          role_id: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          nombre?: string | null
          role_id?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          nombre?: string | null
          role_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      proveedores: {
        Row: {
          contacto_nombre: string | null
          created_at: string | null
          direccion: string | null
          email: string | null
          id: string
          nit_rut: string
          nombre: string
          telefono: string | null
        }
        Insert: {
          contacto_nombre?: string | null
          created_at?: string | null
          direccion?: string | null
          email?: string | null
          id?: string
          nit_rut: string
          nombre: string
          telefono?: string | null
        }
        Update: {
          contacto_nombre?: string | null
          created_at?: string | null
          direccion?: string | null
          email?: string | null
          id?: string
          nit_rut?: string
          nombre?: string
          telefono?: string | null
        }
        Relationships: []
      }
      roles: {
        Row: {
          codigo: string
          created_at: string | null
          descripcion: string | null
          id: string
          nombre: string
        }
        Insert: {
          codigo: string
          created_at?: string | null
          descripcion?: string | null
          id?: string
          nombre: string
        }
        Update: {
          codigo?: string
          created_at?: string | null
          descripcion?: string | null
          id?: string
          nombre?: string
        }
        Relationships: []
      }
      ventas: {
        Row: {
          canal_venta: string
          cliente_id: string | null
          costo_historico_total: number
          created_at: string | null
          descuento: number | null
          estado: string
          fecha_venta: string | null
          id: string
          impuestos: number | null
          metodo_pago: string | null
          numero_factura: string
          subtotal: number
          total: number
          transaccion_id: string | null
        }
        Insert: {
          canal_venta: string
          cliente_id?: string | null
          costo_historico_total: number
          created_at?: string | null
          descuento?: number | null
          estado?: string
          fecha_venta?: string | null
          id?: string
          impuestos?: number | null
          metodo_pago?: string | null
          numero_factura: string
          subtotal: number
          total: number
          transaccion_id?: string | null
        }
        Update: {
          canal_venta?: string
          cliente_id?: string | null
          costo_historico_total?: number
          created_at?: string | null
          descuento?: number | null
          estado?: string
          fecha_venta?: string | null
          id?: string
          impuestos?: number | null
          metodo_pago?: string | null
          numero_factura?: string
          subtotal?: number
          total?: number
          transaccion_id?: string | null
        }
        Relationships: []
      }
    }
    Views: { [_ in never]: never }
    Functions: {
      fn_recalcular_costo_y_precio_producto_por_id: {
        Args: { p_producto_id: string }
        Returns: undefined
      }
    }
    Enums: { [_ in never]: never }
    CompositeTypes: { [_ in never]: never }
  }
}

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']

export type TablesInsert<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert']

export type TablesUpdate<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update']
