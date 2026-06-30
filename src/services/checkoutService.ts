/**
 * checkoutService.ts — Motor de Checkout y Reserva de Inventario
 *
 * Responsabilidades:
 *  - Registrar transacciones de venta (ventas, detalle_venta)
 *  - Reservar stock físico de Producto Terminado (cantidad_disponible vs cantidad_reservada)
 *  - Disparar Órdenes de Producción (OP) en estado 'planificada' si el stock es insuficiente (MTO / Bajo Pedido)
 *  - Soporte reactivo Dual-Mode (Supabase y localStorage Demo Mode)
 */
import { supabase, isSupabaseConfigured } from './supabase';
import type { CartItem } from '../context/CartContext';
import type { Product } from '../types';
import type { OrdenProduccionConDetalle } from '../types/mrp';

export interface CheckoutResult {
  success: boolean;
  factura: string;
  ventaId?: string;
  opsGeneradas: string[]; // Códigos de las OPs generadas por desabastecimiento
  mensaje: string;
}

const PRODUCTS_STORAGE_KEY = 'jc_products';

const generarNumeroFactura = (): string => {
  const rand = Math.floor(Math.random() * 90000) + 10000;
  const yy = new Date().getFullYear().toString().slice(-2);
  return `FAC-${yy}${rand}`;
};

const generarCodigoOP = (): string => {
  const fecha = new Date();
  const yy = String(fecha.getFullYear()).slice(2);
  const mm = String(fecha.getMonth() + 1).padStart(2, '0');
  const dd = String(fecha.getDate()).padStart(2, '0');
  const rand = Math.floor(Math.random() * 9000) + 1000;
  return `OP-${yy}${mm}${dd}-${rand}`;
};

export const CheckoutService = {
  /**
   * Ejecuta la transacción comercial de checkout.
   */
  procesarCheckout: async (
    items: CartItem[],
    clienteId: string | null = null,
    metodoPago = 'Tarjeta de Crédito',
    transaccionId = `TX-${Date.now()}`
  ): Promise<CheckoutResult> => {
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const descuento = 0;
    const impuestos = Math.round(subtotal * 0.19); // 19% IVA (estándar Colombia / premium)
    const total = subtotal - descuento + impuestos;
    const numeroFactura = generarNumeroFactura();

    if (!isSupabaseConfigured) {
      // ───────────────────────────────────────────────────────────────────────
      // MODO DEMO (LOCAL STORAGE FALLBACK)
      // ───────────────────────────────────────────────────────────────────────
      try {
        // Cargar productos locales
        const productsLocal = localStorage.getItem(PRODUCTS_STORAGE_KEY);
        if (!productsLocal) throw new Error('No hay productos en base de datos local.');
        const products: Product[] = JSON.parse(productsLocal);

        // Cargar órdenes OP locales
        const demoOpsRaw = localStorage.getItem('jc_demo_ordenes');
        const demoOps: any[] = demoOpsRaw ? JSON.parse(demoOpsRaw) : [];

        // Cargar movimientos de inventario locales
        const demoMovsRaw = localStorage.getItem('jc_demo_movimientos');
        const demoMovs: any[] = demoMovsRaw ? JSON.parse(demoMovsRaw) : [];

        // Cargar ventas locales (auditoría comercial en Demo Mode)
        const demoVentasRaw = localStorage.getItem('jc_demo_ventas');
        const demoVentas: any[] = demoVentasRaw ? JSON.parse(demoVentasRaw) : [];

        const opsGeneradas: string[] = [];
        const itemsModificados = [...products];

        // Calcular costo histórico consolidado simulado (usamos el 45% del precio de venta como costo de materiales/BOM)
        const costoHistoricoTotal = subtotal * 0.45;
        const ventaId = `v-${Date.now()}`;

        for (const item of items) {
          const productIndex = itemsModificados.findIndex(
            (p) => String(p.id) === String(item.id) || p.ref === item.ref
          );

          if (productIndex !== -1) {
            const product = itemsModificados[productIndex];
            const stockActual = product.stock ?? 0;
            const cantidadComprada = item.quantity;

            if (stockActual >= cantidadComprada) {
              // 1. Caso stock suficiente: descontar stock disponible
              product.stock = stockActual - cantidadComprada;
              
              // Registrar movimiento de reserva/salida de venta local
              demoMovs.unshift({
                id: `mov-${Date.now()}-${Math.random()}`,
                tipo_movimiento: 'salida_venta',
                materia_prima_nombre: undefined,
                materia_prima_sku: undefined,
                cantidad: cantidadComprada,
                costo_unitario: item.price,
                bodega_destino_nombre: 'Showroom Quinta Camacho',
                created_at: new Date().toISOString(),
                observaciones: `Venta E-Commerce. Factura: ${numeroFactura}. Producto: ${item.name}`,
              });
            } else {
              // 2. Caso stock insuficiente: descontar lo disponible a 0 y generar OP para el déficit
              const disponible = stockActual;
              const deficit = cantidadComprada - disponible;
              product.stock = 0;

              if (disponible > 0) {
                // Registrar movimiento de salida por lo que sí había en stock
                demoMovs.unshift({
                  id: `mov-${Date.now()}-${Math.random()}`,
                  tipo_movimiento: 'salida_venta',
                  materia_prima_nombre: undefined,
                  materia_prima_sku: undefined,
                  cantidad: disponible,
                  costo_unitario: item.price,
                  bodega_destino_nombre: 'Showroom Quinta Camacho',
                  created_at: new Date().toISOString(),
                  observaciones: `Venta E-Commerce (Stock Parcial). Factura: ${numeroFactura}. Producto: ${item.name}`,
                });
              }

              // Generar Orden de Producción OP para el déficit (Bajo Pedido / MTO)
              const codigoOP = generarCodigoOP();
              opsGeneradas.push(codigoOP);

              demoOps.unshift({
                id: `op-${Date.now()}-${Math.random()}`,
                codigo_op: codigoOP,
                producto_id: String(product.id),
                producto_nombre: product.name,
                producto_ref: product.ref,
                cantidad_solicitada: deficit,
                cantidad_producida: 0,
                estado: 'planificada',
                artesano_responsable_id: 'art1', // John Callas por defecto
                artesano_nombre: 'John Callas',
                bodega_destino_id: 'b2',
                bodega_destino_nombre: 'Showroom Quinta Camacho',
                fecha_inicio: new Date().toISOString().split('T')[0],
                fecha_entrega_prometida: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0], // 7 días después
                porcentaje_avance: 0,
                desperdicios_reportados: [],
              });

              // Registrar movimiento solicitando producción
              demoMovs.unshift({
                id: `mov-${Date.now()}-${Math.random()}`,
                tipo_movimiento: 'reserva_venta',
                materia_prima_nombre: undefined,
                materia_prima_sku: undefined,
                cantidad: deficit,
                costo_unitario: 0,
                bodega_destino_nombre: 'Taller de Marroquinería Principal',
                created_at: new Date().toISOString(),
                observaciones: `Bajo Pedido (Backorder) - Generación OP: ${codigoOP} por stock insuficiente de ${item.name} (${deficit} unds).`,
              });
            }
          }
        }

        // Registrar venta en historial demo para analítica local
        demoVentas.unshift({
          id: ventaId,
          numero_factura: numeroFactura,
          fecha_venta: new Date().toISOString(),
          canal_venta: 'e_commerce',
          subtotal,
          descuento,
          impuestos,
          total,
          costo_historico_total: costoHistoricoTotal,
          estado: opsGeneradas.length > 0 ? 'en_produccion' : 'procesando',
          metodo_pago: metodoPago,
          transaccion_id: transaccionId,
          detalles: items.map((i) => ({
            producto_id: i.id,
            producto_nombre: i.name,
            cantidad: i.quantity,
            precio_unitario: i.price,
            subtotal: i.price * i.quantity,
          })),
        });

        // Guardar de vuelta a localStorage
        localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(itemsModificados));
        localStorage.setItem('jc_demo_ordenes', JSON.stringify(demoOps));
        localStorage.setItem('jc_demo_movimientos', JSON.stringify(demoMovs));
        localStorage.setItem('jc_demo_ventas', JSON.stringify(demoVentas));

        // Actualizar KPIs analíticos simulados en demo
        const demoAnaliticaRaw = localStorage.getItem('jc_demo_analitica_canales');
        let demoAnalitica = demoAnaliticaRaw ? JSON.parse(demoAnaliticaRaw) : [
          { canal: 'e_commerce', total_ventas: 48, total_unidades: 85, ingresos: 82450000, costo_historico: 35600000, margen_bruto: 46850000, margen_porcentaje: 56.8 },
          { canal: 'showroom', total_ventas: 28, total_unidades: 42, ingresos: 48900000, costo_historico: 21400000, margen_bruto: 27500000, margen_porcentaje: 56.2 },
          { canal: 'mayorista', total_ventas: 8, total_unidades: 35, ingresos: 32000000, costo_historico: 16500000, margen_bruto: 15500000, margen_porcentaje: 48.4 }
        ];

        demoAnalitica = demoAnalitica.map((canalObj: any) => {
          if (canalObj.canal === 'e_commerce') {
            const nuevosIngresos = canalObj.ingresos + total;
            const nuevoCosto = canalObj.costo_historico + costoHistoricoTotal;
            const nuevoMargen = nuevosIngresos - nuevoCosto;
            return {
              ...canalObj,
              total_ventas: canalObj.total_ventas + 1,
              total_unidades: canalObj.total_unidades + items.reduce((s, i) => s + i.quantity, 0),
              ingresos: nuevosIngresos,
              costo_historico: nuevoCosto,
              margen_bruto: nuevoMargen,
              margen_porcentaje: nuevosIngresos > 0 ? (nuevoMargen / nuevosIngresos) * 100 : 0,
            };
          }
          return canalObj;
        });
        localStorage.setItem('jc_demo_analitica_canales', JSON.stringify(demoAnalitica));

        let mensaje = 'Venta simulada procesada con éxito.';
        if (opsGeneradas.length > 0) {
          mensaje += ` Se crearon las siguientes órdenes de taller por falta de stock: ${opsGeneradas.join(', ')}`;
        }

        return {
          success: true,
          factura: numeroFactura,
          ventaId,
          opsGeneradas,
          mensaje,
        };
      } catch (err: any) {
        console.error('Error en Demo Checkout:', err);
        return {
          success: false,
          factura: '',
          mensaje: `Error al procesar la venta local: ${err.message}`,
          opsGeneradas: [],
        };
      }
    }

    // ───────────────────────────────────────────────────────────────────────
    // MODO SUPABASE REAL
    // ───────────────────────────────────────────────────────────────────────
    try {
      // 1. Obtener los costos reales BOM de los productos para auditoría de rentabilidad
      const ids = items.map((i) => String(i.id));
      const { data: dbProductos, error: errProd } = await supabase
        .from('productos')
        .select('id, costo_calculado_bom, bajo_pedido, nombre, ref_sku')
        .in('id', ids);

      if (errProd) throw errProd;

      const prodMap = (dbProductos ?? []).reduce<Record<string, { costo: number; bajo_pedido: boolean; nombre: string; ref: string }>>((acc, p) => {
        acc[p.id] = {
          costo: Number(p.costo_calculado_bom ?? 0),
          bajo_pedido: Boolean(p.bajo_pedido),
          nombre: p.nombre,
          ref: p.ref_sku,
        };
        return acc;
      }, {});

      const costoHistoricoTotal = items.reduce((sum, item) => {
        const prod = prodMap[item.id] || { costo: item.price * 0.45 };
        return sum + prod.costo * item.quantity;
      }, 0);

      // 2. Insertar Cabecera de Venta
      const { data: ventaDB, error: errVenta } = await supabase
        .from('ventas')
        .insert({
          numero_factura: numeroFactura,
          cliente_id: clienteId,
          canal_venta: 'e_commerce',
          subtotal,
          descuento,
          impuestos,
          total,
          costo_historico_total: costoHistoricoTotal,
          estado: 'procesando',
          metodo_pago: metodoPago,
          transaccion_id: transaccionId,
        })
        .select()
        .single();

      if (errVenta) throw errVenta;
      const ventaId = ventaDB.id;
      const opsGeneradas: string[] = [];

      // 3. Procesar cada ítem del carrito
      for (const item of items) {
        const prodMeta = prodMap[item.id] || { costo: item.price * 0.45, bajo_pedido: false, nombre: item.name, ref: item.ref };

        // A. Registrar en detalle_venta
        const { error: errDetalle } = await supabase
          .from('detalle_venta')
          .insert({
            venta_id: ventaId,
            producto_id: item.id,
            cantidad: item.quantity,
            precio_unitario: item.price,
            costo_unitario_historico: prodMeta.costo,
            subtotal: item.price * item.quantity,
          });

        if (errDetalle) throw errDetalle;

        // B. Gestionar reservas físicas en 'inventario_productos'
        const { data: stocks, error: errStockQuery } = await supabase
          .from('inventario_productos')
          .select('id, bodega_id, cantidad_disponible, cantidad_reservada')
          .eq('producto_id', item.id);

        if (errStockQuery) throw errStockQuery;

        const stockConsolidado = (stocks ?? []).reduce((sum, s) => sum + s.cantidad_disponible, 0);
        const cantidadComprada = item.quantity;

        // Buscar una bodega default para transacciones (usualmente Showroom o la primera)
        let bodegaPrincipalId = '';
        const showroomBod = (stocks ?? []).find(() => true); // fallback primer registro
        if (showroomBod) {
          bodegaPrincipalId = showroomBod.bodega_id;
        } else {
          // Si no hay stock registrado, buscar la bodega tipo showroom/central
          const { data: defaultBodega } = await supabase
            .from('bodegas')
            .select('id')
            .eq('tipo', 'showroom')
            .limit(1)
            .maybeSingle();
          
          if (defaultBodega) {
            bodegaPrincipalId = defaultBodega.id;
          } else {
            const { data: anyBodega } = await supabase.from('bodegas').select('id').limit(1).single();
            if (anyBodega) bodegaPrincipalId = anyBodega.id;
          }
        }

        if (stockConsolidado >= cantidadComprada) {
          // 1. Hay stock suficiente. Reservamos la mercancía
          let restanteAReservar = cantidadComprada;
          for (const s of (stocks ?? [])) {
            if (restanteAReservar <= 0) break;
            const aReservarEnBodega = Math.min(s.cantidad_disponible, restanteAReservar);

            const { error: errUpdStock } = await supabase
              .from('inventario_productos')
              .update({
                cantidad_disponible: s.cantidad_disponible - aReservarEnBodega,
                cantidad_reservada: s.cantidad_reservada + aReservarEnBodega,
              })
              .eq('id', s.id);

            if (errUpdStock) throw errUpdStock;

            // Registrar movimiento en bitácora de movimientos
            await supabase.from('movimientos_inventario').insert({
              tipo_movimiento: 'reserva_venta',
              producto_id: item.id,
              bodega_origen_id: s.bodega_id,
              cantidad: aReservarEnBodega,
              costo_unitario: item.price,
              documento_referencia_id: ventaId,
              observaciones: `Reserva comercial en bodega para la factura ${numeroFactura}`,
            });

            restanteAReservar -= aReservarEnBodega;
          }
        } else {
          // 2. Stock insuficiente. Reservamos lo que haya disponible y creamos OP por el déficit
          const disponible = stockConsolidado;
          const deficit = cantidadComprada - disponible;

          // Reservar todo el stock disponible actual a 0
          if (disponible > 0) {
            let restanteAReservar = disponible;
            for (const s of (stocks ?? [])) {
              if (restanteAReservar <= 0) break;
              const aReservarEnBodega = Math.min(s.cantidad_disponible, restanteAReservar);

              const { error: errUpdStock } = await supabase
                .from('inventario_productos')
                .update({
                  cantidad_disponible: 0,
                  cantidad_reservada: s.cantidad_reservada + aReservarEnBodega,
                })
                .eq('id', s.id);

              if (errUpdStock) throw errUpdStock;

              await supabase.from('movimientos_inventario').insert({
                tipo_movimiento: 'reserva_venta',
                producto_id: item.id,
                bodega_origen_id: s.bodega_id,
                cantidad: aReservarEnBodega,
                costo_unitario: item.price,
                documento_referencia_id: ventaId,
                observaciones: `Reserva comercial parcial para la factura ${numeroFactura} (Resto pasa a taller)`,
              });

              restanteAReservar -= aReservarEnBodega;
            }
          }

          // Si el producto está configurado para producción bajo pedido, disparamos OP
          if (prodMeta.bajo_pedido) {
            const codigoOP = generarCodigoOP();
            opsGeneradas.push(codigoOP);

            // Obtener bodega taller por defecto
            const { data: bodegaTaller } = await supabase
              .from('bodegas')
              .select('id')
              .eq('tipo', 'taller')
              .limit(1)
              .maybeSingle();

            const bodegaDestinoId = bodegaTaller?.id || bodegaPrincipalId;

            // Insertar Orden de Producción
            await supabase.from('ordenes_produccion').insert({
              codigo_op: codigoOP,
              venta_id: ventaId,
              producto_id: item.id,
              cantidad_solicitada: deficit,
              estado: 'planificada',
              bodega_destino_id: bodegaDestinoId,
              fecha_inicio: new Date().toISOString().split('T')[0],
              fecha_entrega_prometida: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0], // 7 días de lead-time
            });

            // Registrar en bitácora el lanzamiento automático a producción
            await supabase.from('movimientos_inventario').insert({
              tipo_movimiento: 'reserva_venta',
              producto_id: item.id,
              bodega_destino_id: bodegaDestinoId,
              cantidad: deficit,
              costo_unitario: 0,
              documento_referencia_id: ventaId,
              observaciones: `Déficit de ${deficit} unidades. Generada OP bajo pedido: ${codigoOP}`,
            });
          }
        }
      }

      // Si se generaron OPs, actualizamos el estado de la venta a 'en_produccion'
      if (opsGeneradas.length > 0) {
        await supabase
          .from('ventas')
          .update({ estado: 'en_produccion' })
          .eq('id', ventaId);
      }

      let mensaje = 'Venta registrada con éxito y existencias actualizadas.';
      if (opsGeneradas.length > 0) {
        mensaje += ` Se instanciaron órdenes de producción bajo pedido: ${opsGeneradas.join(', ')}`;
      }

      return {
        success: true,
        factura: numeroFactura,
        ventaId,
        opsGeneradas,
        mensaje,
      };
    } catch (err: any) {
      console.error('Error en Supabase Checkout:', err);
      return {
        success: false,
        factura: '',
        mensaje: `Error en base de datos al realizar checkout: ${err.message}`,
        opsGeneradas: [],
      };
    }
  },
};
