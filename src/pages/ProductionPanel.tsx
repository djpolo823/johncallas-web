import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '../context/AuthContext';
import { MRPService } from '../services/mrpService';
import type {
  OrdenProduccionConDetalle,
  EstadoOP,
  MotivoDesperdicio,
  Desperdicio,
} from '../types/mrp';
import type { MateriaPrimaConInventario } from '../types/erp';
import {
  Scissors, Layers, CheckCircle, Package, AlertTriangle,
  ChevronRight, Clock, X, Plus, RefreshCw, Hammer, Flame,
  Star, Activity, Trash2, Eye, ArrowRight
} from 'lucide-react';

// ─── Constantes de Estado ────────────────────────────────────────────────────

const ESTADO_CONFIG: Record<EstadoOP, {
  label: string;
  color: string;
  bg: string;
  border: string;
  icon: React.ReactNode;
  siguiente: EstadoOP | null;
  accion: string;
}> = {
  planificada: {
    label: 'Planificada',
    color: '#7B6F5C',
    bg: '#F7F4F0',
    border: '#E5DDD3',
    icon: <Clock size={14} />,
    siguiente: 'corte',
    accion: 'Iniciar Corte',
  },
  corte: {
    label: 'En Corte',
    color: '#B07A30',
    bg: '#FBF6EE',
    border: '#ECD9B8',
    icon: <Scissors size={14} />,
    siguiente: 'armado',
    accion: 'Pasar a Armado',
  },
  armado: {
    label: 'En Armado',
    color: '#5A7A6A',
    bg: '#EFF5F2',
    border: '#C5DDD3',
    icon: <Hammer size={14} />,
    siguiente: 'acabado',
    accion: 'Pasar a Acabado',
  },
  acabado: {
    label: 'Acabado Final',
    color: '#7A5A8A',
    bg: '#F5F0FA',
    border: '#D9C5E8',
    icon: <Flame size={14} />,
    siguiente: 'control_calidad',
    accion: 'Pasar a Control de Calidad',
  },
  control_calidad: {
    label: 'Control de Calidad',
    color: '#3A6A8A',
    bg: '#EFF5FA',
    border: '#C0D8EA',
    icon: <Star size={14} />,
    siguiente: 'completada',
    accion: 'Marcar como Completada',
  },
  completada: {
    label: 'Completada',
    color: '#3A7A50',
    bg: '#EFF8F3',
    border: '#B8DFCA',
    icon: <CheckCircle size={14} />,
    siguiente: null,
    accion: '',
  },
  cancelada: {
    label: 'Cancelada',
    color: '#8A3A3A',
    bg: '#FAF0EF',
    border: '#EAC0C0',
    icon: <X size={14} />,
    siguiente: null,
    accion: '',
  },
};

const ESTADO_ORDEN: EstadoOP[] = ['planificada', 'corte', 'armado', 'acabado', 'control_calidad', 'completada'];

const MOTIVOS_DESPERDICIO: { value: MotivoDesperdicio; label: string }[] = [
  { value: 'imperfeccion_cuero', label: 'Imperfección en Cuero' },
  { value: 'error_corte', label: 'Error de Corte' },
  { value: 'sobrante_molde', label: 'Sobrante de Molde' },
  { value: 'defecto_material', label: 'Defecto del Material' },
  { value: 'error_costura', label: 'Error de Costura' },
  { value: 'otro', label: 'Otro' },
];

// ─── Utilidad: Demo seed data ────────────────────────────────────────────────

const DEMO_SEED_OPS = (): OrdenProduccionConDetalle[] => [
  {
    id: 'op-demo-1',
    codigo_op: 'OP-260521-3812',
    producto_id: 'prod-1',
    producto_nombre: 'Bolso Tote Milano — Cognac',
    producto_ref: 'JC-TOT-COG-01',
    cantidad_solicitada: 2,
    cantidad_producida: 0,
    estado: 'planificada',
    artesano_responsable_id: 'mock-artesano-id',
    artesano_nombre: 'John Callas',
    bodega_destino_id: 'b2',
    bodega_destino_nombre: 'Showroom Quinta Camacho',
    venta_id: 'venta-demo-1',
    venta_numero_factura: 'JC-2025-0041',
    fecha_inicio: new Date().toISOString().split('T')[0],
    fecha_entrega_prometida: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
    created_at: new Date(Date.now() - 3600000).toISOString(),
    updated_at: new Date(Date.now() - 3600000).toISOString(),
    observaciones: 'Pedido urgente, cliente VIP',
    desperdicios_reportados: [],
    porcentaje_avance: 0,
    dias_restantes: 7,
  },
  {
    id: 'op-demo-2',
    codigo_op: 'OP-260520-7194',
    producto_id: 'prod-2',
    producto_nombre: 'Billetera Slim Saffiano — Negro Onyx',
    producto_ref: 'JC-BIL-SAF-02',
    cantidad_solicitada: 5,
    cantidad_producida: 0,
    estado: 'corte',
    artesano_responsable_id: 'mock-artesano-id',
    artesano_nombre: 'John Callas',
    bodega_destino_id: 'b1',
    bodega_destino_nombre: 'Taller de Marroquinería Principal',
    venta_id: null,
    venta_numero_factura: undefined,
    fecha_inicio: new Date(Date.now() - 86400000).toISOString().split('T')[0],
    fecha_entrega_prometida: new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0],
    created_at: new Date(Date.now() - 86400000).toISOString(),
    updated_at: new Date(Date.now() - 3600000).toISOString(),
    observaciones: 'Reposición de stock showroom',
    desperdicios_reportados: [],
    porcentaje_avance: 0,
    dias_restantes: 5,
  },
  {
    id: 'op-demo-3',
    codigo_op: 'OP-260519-2256',
    producto_id: 'prod-3',
    producto_nombre: 'Bolso Bandolera Florentina — Beige',
    producto_ref: 'JC-BAN-BEI-03',
    cantidad_solicitada: 1,
    cantidad_producida: 1,
    estado: 'completada',
    artesano_responsable_id: 'mock-artesano-id',
    artesano_nombre: 'John Callas',
    bodega_destino_id: 'b2',
    bodega_destino_nombre: 'Showroom Quinta Camacho',
    venta_id: null,
    venta_numero_factura: undefined,
    fecha_inicio: new Date(Date.now() - 5 * 86400000).toISOString().split('T')[0],
    fecha_entrega_prometida: new Date(Date.now() - 86400000).toISOString().split('T')[0],
    created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 86400000).toISOString(),
    observaciones: null,
    desperdicios_reportados: [
      {
        id: 'desp-1',
        orden_produccion_id: 'op-demo-3',
        materia_prima_id: 'mp1',
        cantidad_desperdiciada: 12,
        motivo: 'sobrante_molde',
        reportado_por: 'mock-artesano-id',
        created_at: new Date(Date.now() - 86400000).toISOString(),
      } as Desperdicio,
    ],
    porcentaje_avance: 100,
    dias_restantes: 0,
  },
];

// ─── Sub-componentes ─────────────────────────────────────────────────────────

interface OPCardProps {
  op: OrdenProduccionConDetalle;
  onAvanzar: (op: OrdenProduccionConDetalle) => void;
  onReportarMerma: (op: OrdenProduccionConDetalle) => void;
  onVerDetalle: (op: OrdenProduccionConDetalle) => void;
}

const OPCard: React.FC<OPCardProps> = ({ op, onAvanzar, onReportarMerma, onVerDetalle }) => {
  const cfg = ESTADO_CONFIG[op.estado as EstadoOP];
  const isActiva = op.estado !== 'completada' && op.estado !== 'cancelada';
  const isUrgente = (op.dias_restantes ?? 99) <= 2 && isActiva;

  return (
    <div style={{
      backgroundColor: 'var(--color-white)',
      border: `1px solid ${isUrgente ? '#EAC0C0' : 'var(--color-border)'}`,
      borderLeft: `3px solid ${isUrgente ? '#C05C5C' : cfg.color}`,
      padding: '1.5rem',
      marginBottom: '1rem',
      transition: 'box-shadow 0.2s',
      position: 'relative',
    }}
      onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)')}
      onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
    >
      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
        <div>
          <span style={{
            fontFamily: 'monospace', fontSize: '0.7rem', color: 'var(--color-text-secondary)',
            backgroundColor: '#FAF9F6', border: '1px solid var(--color-border)',
            padding: '0.15rem 0.5rem', letterSpacing: '0.05em'
          }}>
            {op.codigo_op}
          </span>
          {isUrgente && (
            <span style={{
              marginLeft: '0.5rem', fontSize: '0.65rem', fontWeight: 700,
              color: '#C05C5C', textTransform: 'uppercase', letterSpacing: '0.05em'
            }}>
              ⚠ Urgente
            </span>
          )}
        </div>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
          padding: '0.2rem 0.6rem', fontSize: '0.65rem', fontWeight: 600,
          textTransform: 'uppercase', letterSpacing: '0.05em',
          backgroundColor: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`,
        }}>
          {cfg.icon} {cfg.label}
        </span>
      </div>

      {/* Product info */}
      <h4 style={{ fontSize: '1rem', color: 'var(--color-black)', margin: '0 0 0.25rem', fontWeight: 500 }}>
        {op.producto_nombre}
      </h4>
      <p style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', margin: '0 0 1rem', fontFamily: 'monospace' }}>
        {op.producto_ref}
      </p>

      {/* Stats row */}
      <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <div>
          <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-secondary)', fontWeight: 600, display: 'block' }}>Unidades</span>
          <span style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--color-black)' }}>
            {op.cantidad_producida} / {op.cantidad_solicitada}
          </span>
        </div>
        {op.dias_restantes !== undefined && (
          <div>
            <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-secondary)', fontWeight: 600, display: 'block' }}>Días restantes</span>
            <span style={{ fontSize: '1.1rem', fontWeight: 600, color: isUrgente ? '#C05C5C' : 'var(--color-black)' }}>
              {op.dias_restantes}
            </span>
          </div>
        )}
        {op.venta_numero_factura && (
          <div>
            <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-secondary)', fontWeight: 600, display: 'block' }}>Pedido Cliente</span>
            <span style={{ fontSize: '0.85rem', fontFamily: 'monospace', color: 'var(--color-gold-subtle)' }}>
              {op.venta_numero_factura}
            </span>
          </div>
        )}
      </div>

      {/* Progress bar */}
      {isActiva && (
        <div style={{ marginBottom: '1rem' }}>
          <div style={{ height: '3px', backgroundColor: '#F0EDE8', borderRadius: '2px', overflow: 'hidden' }}>
            <div style={{
              height: '100%', width: `${op.porcentaje_avance}%`,
              backgroundColor: cfg.color, transition: 'width 0.5s ease',
              borderRadius: '2px'
            }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.3rem' }}>
            {ESTADO_ORDEN.filter(e => e !== 'completada').map((estado, idx) => (
              <span key={estado} style={{
                fontSize: '0.6rem', color: ESTADO_ORDEN.indexOf(op.estado as EstadoOP) >= idx
                  ? cfg.color : 'var(--color-text-secondary)',
                fontWeight: ESTADO_ORDEN.indexOf(op.estado as EstadoOP) >= idx ? 600 : 400,
              }}>
                {idx + 1}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        <button
          onClick={() => onVerDetalle(op)}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
            padding: '0.5rem 1rem', fontSize: '0.78rem', fontWeight: 600,
            textTransform: 'uppercase', letterSpacing: '0.05em',
            border: '1px solid var(--color-border)', backgroundColor: 'var(--color-white)',
            color: 'var(--color-text-secondary)', cursor: 'pointer',
          }}
        >
          <Eye size={13} /> Detalle
        </button>
        {isActiva && (
          <button
            onClick={() => onReportarMerma(op)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
              padding: '0.5rem 1rem', fontSize: '0.78rem', fontWeight: 600,
              textTransform: 'uppercase', letterSpacing: '0.05em',
              border: '1px solid #ECD9B8', backgroundColor: '#FBF6EE',
              color: '#B07A30', cursor: 'pointer',
            }}
          >
            <Trash2 size={13} /> Merma
          </button>
        )}
        {cfg.siguiente && (
          <button
            onClick={() => onAvanzar(op)}
            className="btn btn-primary"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
              padding: '0.5rem 1.25rem', fontSize: '0.78rem', fontWeight: 600,
              textTransform: 'uppercase', letterSpacing: '0.05em',
              flex: 1, justifyContent: 'center',
            }}
          >
            {cfg.accion} <ArrowRight size={13} />
          </button>
        )}
      </div>
    </div>
  );
};

// ─── Panel Principal ──────────────────────────────────────────────────────────

const ProductionPanel: React.FC = () => {
  const { isDemoMode, currentUser } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ops, setOps] = useState<OrdenProduccionConDetalle[]>([]);
  const [materiasPrimas, setMateriasPrimas] = useState<MateriaPrimaConInventario[]>([]);
  const [filtroEstado, setFiltroEstado] = useState<EstadoOP | 'todas'>('todas');

  // Modal: Avanzar OP
  const [showAvanzarModal, setShowAvanzarModal] = useState(false);
  const [opSeleccionada, setOpSeleccionada] = useState<OrdenProduccionConDetalle | null>(null);
  const [cantidadProducida, setCantidadProducida] = useState(0);
  const [avanzando, setAvanzando] = useState(false);

  // Modal: Merma / Desperdicio
  const [showMermaModal, setShowMermaModal] = useState(false);
  const [opParaMerma, setOpParaMerma] = useState<OrdenProduccionConDetalle | null>(null);
  const [mermaMateriaId, setMermaMateriaId] = useState('');
  const [mermaCantidad, setMermaCantidad] = useState<number>(0);
  const [mermaMotivo, setMermaMotivo] = useState<MotivoDesperdicio>('sobrante_molde');
  const [mermaObs, setMermaObs] = useState('');
  const [guardandoMerma, setGuardandoMerma] = useState(false);

  // Modal: Detalle OP
  const [showDetalleModal, setShowDetalleModal] = useState(false);
  const [opDetalle, setOpDetalle] = useState<OrdenProduccionConDetalle | null>(null);

  // ── Carga de datos ──────────────────────────────────────────────────────────

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (isDemoMode) {
        // Inicializar semilla de OPs si no existe
        if (!localStorage.getItem('jc_demo_ordenes')) {
          localStorage.setItem('jc_demo_ordenes', JSON.stringify(DEMO_SEED_OPS()));
        }
        const demoOps: OrdenProduccionConDetalle[] = JSON.parse(
          localStorage.getItem('jc_demo_ordenes')!
        );
        // Recalcular porcentaje_avance y dias_restantes al cargar
        const hoy = new Date();
        const opsProcesadas = demoOps.map(op => {
          const avance = op.cantidad_solicitada > 0
            ? Math.round((op.cantidad_producida / op.cantidad_solicitada) * 100) : 0;
          const dias = op.fecha_entrega_prometida
            ? Math.max(0, Math.ceil((new Date(op.fecha_entrega_prometida).getTime() - hoy.getTime()) / 86400000))
            : undefined;
          return { ...op, porcentaje_avance: avance, dias_restantes: dias };
        });
        setOps(opsProcesadas);

        // Cargar materias primas para el formulario de merma
        const demoMaterias: MateriaPrimaConInventario[] = JSON.parse(
          localStorage.getItem('jc_demo_materias') || '[]'
        );
        setMateriasPrimas(demoMaterias);
        if (demoMaterias.length > 0 && !mermaMateriaId) {
          setMermaMateriaId(demoMaterias[0].id);
        }
      } else {
        const [mrpOps] = await Promise.all([MRPService.getOrdenes()]);
        setOps(mrpOps);
      }
    } catch (err: any) {
      setError(err.message || 'Error al cargar las órdenes de producción.');
    } finally {
      setLoading(false);
    }
  }, [isDemoMode]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ── Avanzar Estado ──────────────────────────────────────────────────────────

  const handleOpenAvanzar = (op: OrdenProduccionConDetalle) => {
    setOpSeleccionada(op);
    setCantidadProducida(op.cantidad_solicitada);
    setShowAvanzarModal(true);
  };

  const handleAvanzarEstado = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!opSeleccionada) return;
    setAvanzando(true);
    setError(null);

    const cfg = ESTADO_CONFIG[opSeleccionada.estado as EstadoOP];
    const nuevoEstado = cfg.siguiente!;

    try {
      if (isDemoMode) {
        const demoOps: OrdenProduccionConDetalle[] = JSON.parse(
          localStorage.getItem('jc_demo_ordenes')!
        );
        const idx = demoOps.findIndex(o => o.id === opSeleccionada.id);
        if (idx === -1) throw new Error('OP no encontrada.');

        const op = { ...demoOps[idx] };
        const estadoAnterior = op.estado as EstadoOP;
        op.estado = nuevoEstado;
        op.updated_at = new Date().toISOString();

        // Al entrar a CORTE → descontar materia prima del BOM (simulado)
        if (nuevoEstado === 'corte') {
          const demoMaterias: MateriaPrimaConInventario[] = JSON.parse(
            localStorage.getItem('jc_demo_materias') || '[]'
          );
          const demoMovimientos = JSON.parse(localStorage.getItem('jc_demo_movimientos') || '[]');

          // BOM simulado para las OPs demo
          const BOM_DEMO: Record<string, Array<{ mp_id: string; cantidad_por_unidad: number }>> = {
            'op-demo-1': [{ mp_id: 'mp1', cantidad_por_unidad: 45 }, { mp_id: 'mp3', cantidad_por_unidad: 3 }, { mp_id: 'mp4', cantidad_por_unidad: 2 }],
            'op-demo-2': [{ mp_id: 'mp2', cantidad_por_unidad: 25 }, { mp_id: 'mp3', cantidad_por_unidad: 2 }],
          };

          const bom = BOM_DEMO[op.id] ?? [];
          bom.forEach(item => {
            const mpIdx = demoMaterias.findIndex(m => m.id === item.mp_id);
            if (mpIdx !== -1) {
              const totalDescontar = item.cantidad_por_unidad * op.cantidad_solicitada;
              demoMaterias[mpIdx].stock_total = Math.max(0, demoMaterias[mpIdx].stock_total - totalDescontar);
              // Actualizar semáforo
              const min = Number(demoMaterias[mpIdx].stock_minimo ?? 0);
              const st = demoMaterias[mpIdx].stock_total;
              demoMaterias[mpIdx].estado_semaforo = st <= min ? 'critico' : (st <= min * 1.2 ? 'alerta' : 'normal');

              // Registrar movimiento de salida
              demoMovimientos.unshift({
                id: `mov-${Date.now()}-${item.mp_id}`,
                tipo_movimiento: 'salida_produccion',
                materia_prima_id: item.mp_id,
                materia_prima_nombre: demoMaterias[mpIdx].nombre,
                materia_prima_sku: demoMaterias[mpIdx].sku,
                bodega_origen_id: 'b3',
                bodega_origen_nombre: 'Almacén de Materias Primas',
                cantidad: totalDescontar,
                costo_unitario: demoMaterias[mpIdx].costo_promedio_ponderado ?? 0,
                created_at: new Date().toISOString(),
                observaciones: `Consumo BOM — OP ${op.codigo_op}`,
              });
            }
          });

          localStorage.setItem('jc_demo_materias', JSON.stringify(demoMaterias));
          localStorage.setItem('jc_demo_movimientos', JSON.stringify(demoMovimientos));
        }

        // Al COMPLETAR → ingresar producto terminado al inventario (simulado)
        if (nuevoEstado === 'completada') {
          op.cantidad_producida = cantidadProducida;
          op.porcentaje_avance = 100;

          const jcProductsRaw = localStorage.getItem('jc_products');
          if (jcProductsRaw) {
            const jcProducts = JSON.parse(jcProductsRaw);
            const prodIdx = jcProducts.findIndex((p: any) =>
              p.id?.toString() === op.producto_id?.toString() ||
              p.ref === op.producto_ref
            );
            if (prodIdx !== -1) {
              jcProducts[prodIdx].stock = (jcProducts[prodIdx].stock ?? 0) + cantidadProducida;
              localStorage.setItem('jc_products', JSON.stringify(jcProducts));
            }
          }

          // Registrar entrada de producto terminado en movimientos
          const demoMovimientos = JSON.parse(localStorage.getItem('jc_demo_movimientos') || '[]');
          demoMovimientos.unshift({
            id: `mov-${Date.now()}-pt`,
            tipo_movimiento: 'entrada_produccion',
            materia_prima_nombre: `PT — ${op.producto_nombre}`,
            materia_prima_sku: op.producto_ref,
            bodega_destino_nombre: op.bodega_destino_nombre ?? 'Taller',
            cantidad: cantidadProducida,
            costo_unitario: 0,
            created_at: new Date().toISOString(),
            observaciones: `Ingreso producto terminado — OP ${op.codigo_op}`,
          });
          localStorage.setItem('jc_demo_movimientos', JSON.stringify(demoMovimientos));
        }

        demoOps[idx] = op;
        localStorage.setItem('jc_demo_ordenes', JSON.stringify(demoOps));
      } else {
        await MRPService.avanzarEstadoOP({
          op_id: opSeleccionada.id,
          nuevo_estado: nuevoEstado,
          cantidad_producida: nuevoEstado === 'completada' ? cantidadProducida : undefined,
        });
      }

      setShowAvanzarModal(false);
      setOpSeleccionada(null);
      await fetchData();
    } catch (err: any) {
      setError(err.message || 'Error al avanzar el estado de la OP.');
    } finally {
      setAvanzando(false);
    }
  };

  // ── Reportar Merma ──────────────────────────────────────────────────────────

  const handleOpenMerma = (op: OrdenProduccionConDetalle) => {
    setOpParaMerma(op);
    setMermaCantidad(0);
    setMermaMotivo('sobrante_molde');
    setMermaObs('');
    setShowMermaModal(true);
  };

  const handleGuardarMerma = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!opParaMerma || !mermaMateriaId || mermaCantidad <= 0) {
      setError('Completa todos los campos de merma correctamente.');
      return;
    }
    setGuardandoMerma(true);
    setError(null);
    try {
      if (isDemoMode) {
        const demoOps: OrdenProduccionConDetalle[] = JSON.parse(
          localStorage.getItem('jc_demo_ordenes')!
        );
        const idx = demoOps.findIndex(o => o.id === opParaMerma.id);
        if (idx === -1) throw new Error('OP no encontrada.');

        const nuevaMerma: Desperdicio = {
          id: `desp-${Date.now()}`,
          orden_produccion_id: opParaMerma.id,
          materia_prima_id: mermaMateriaId,
          cantidad_desperdiciada: mermaCantidad,
          motivo: mermaMotivo,
          reportado_por: currentUser?.id ?? null,
          created_at: new Date().toISOString(),
        };

        if (!demoOps[idx].desperdicios_reportados) {
          demoOps[idx].desperdicios_reportados = [];
        }
        demoOps[idx].desperdicios_reportados.push(nuevaMerma);

        // También registrar como movimiento de salida (ajuste negativo)
        const demoMovimientos = JSON.parse(localStorage.getItem('jc_demo_movimientos') || '[]');
        const mpInfo = materiasPrimas.find(m => m.id === mermaMateriaId);
        demoMovimientos.unshift({
          id: `mov-${Date.now()}-merma`,
          tipo_movimiento: 'ajuste_negativo',
          materia_prima_id: mermaMateriaId,
          materia_prima_nombre: mpInfo?.nombre ?? 'Materia Prima',
          materia_prima_sku: mpInfo?.sku ?? '',
          bodega_origen_nombre: 'Taller de Marroquinería Principal',
          cantidad: mermaCantidad,
          costo_unitario: mpInfo?.costo_promedio_ponderado ?? 0,
          created_at: new Date().toISOString(),
          observaciones: `Merma reportada — ${MOTIVOS_DESPERDICIO.find(m => m.value === mermaMotivo)?.label ?? mermaMotivo} — OP ${opParaMerma.codigo_op}. ${mermaObs}`,
        });
        localStorage.setItem('jc_demo_movimientos', JSON.stringify(demoMovimientos));
        localStorage.setItem('jc_demo_ordenes', JSON.stringify(demoOps));
      } else {
        await MRPService.reportarDesperdicio({
          orden_produccion_id: opParaMerma.id,
          materia_prima_id: mermaMateriaId,
          cantidad_desperdiciada: mermaCantidad,
          motivo: mermaMotivo,
          reportado_por: currentUser?.id,
        });
      }

      setShowMermaModal(false);
      setOpParaMerma(null);
      await fetchData();
    } catch (err: any) {
      setError(err.message || 'Error al registrar el desperdicio.');
    } finally {
      setGuardandoMerma(false);
    }
  };

  // ── Filtrado ────────────────────────────────────────────────────────────────

  const opsFiltradas = ops.filter(op =>
    filtroEstado === 'todas' ? true : op.estado === filtroEstado
  );

  // KPIs rápidos
  const opsActivas = ops.filter(op => !['completada', 'cancelada'].includes(op.estado)).length;
  const opsCompletadas = ops.filter(op => op.estado === 'completada').length;
  const opsUrgentes = ops.filter(op => (op.dias_restantes ?? 99) <= 2 && !['completada', 'cancelada'].includes(op.estado)).length;

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div style={{ paddingBottom: '6rem', backgroundColor: 'var(--color-off-white)', minHeight: '100vh' }}>
      <Helmet>
        <title>Panel de Producción — Taller | JohnCallas</title>
        <meta name="description" content="Panel de control del Maestro Artesano: gestión de órdenes de producción, avance de taller y control de mermas." />
      </Helmet>

      {/* ── Header ── */}
      <div style={{
        backgroundColor: 'var(--color-white)',
        borderBottom: '1px solid var(--color-border)',
        padding: '2.5rem 0', marginBottom: '3rem'
      }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '2rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <span style={{
                textTransform: 'uppercase', letterSpacing: '0.15em',
                fontSize: '0.75rem', color: 'var(--color-gold-subtle)', fontWeight: 600
              }}>
                Taller Artesanal · Planta de Producción
              </span>
              <span style={{
                backgroundColor: '#FAF9F6', border: '1px solid var(--color-gold-subtle)',
                color: 'var(--color-gold-subtle)', fontSize: '0.65rem',
                padding: '0.15rem 0.5rem', textTransform: 'uppercase',
                letterSpacing: '0.05em', fontWeight: 600
              }}>
                {isDemoMode ? 'Demostración Local' : 'Supabase Conectado'}
              </span>
            </div>
            <h1 className="text-serif" style={{ fontSize: '2.5rem', color: 'var(--color-black)', margin: '0 0 0.25rem' }}>
              Órdenes de Producción
            </h1>
            {currentUser && (
              <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', margin: 0 }}>
                Maestro: <strong>{currentUser.name}</strong>
              </p>
            )}
          </div>

          <button
            onClick={fetchData}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.75rem 1.5rem', fontSize: '0.85rem', fontWeight: 600,
              textTransform: 'uppercase', letterSpacing: '0.05em',
              border: '1px solid var(--color-border)', backgroundColor: 'var(--color-white)',
              color: 'var(--color-black)', cursor: 'pointer',
            }}
          >
            <RefreshCw size={15} /> Actualizar
          </button>
        </div>
      </div>

      <div className="container">

        {/* ── Error Banner ── */}
        {error && (
          <div style={{
            backgroundColor: '#FDF2F2', border: '1px solid #F3DFDF',
            color: '#C05C5C', padding: '1rem 1.5rem',
            marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem',
            fontSize: '0.9rem'
          }}>
            <AlertTriangle size={16} />
            {error}
            <button onClick={() => setError(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#C05C5C' }}>
              <X size={16} />
            </button>
          </div>
        )}

        {/* ── KPI Row ── */}
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
          {[
            { label: 'OPs Activas', value: opsActivas, icon: <Activity size={16} color="var(--color-gold-subtle)" />, sub: 'En progreso' },
            { label: 'Completadas', value: opsCompletadas, icon: <CheckCircle size={16} color="#4C9A63" />, sub: 'Finalizadas', color: '#4C9A63' },
            { label: 'Total OPs', value: ops.length, icon: <Package size={16} color="#7B6F5C" />, sub: 'En sistema' },
            {
              label: 'Urgentes', value: opsUrgentes,
              icon: <AlertTriangle size={16} color={opsUrgentes > 0 ? '#C05C5C' : '#7B6F5C'} />,
              sub: '≤ 2 días plazo', color: opsUrgentes > 0 ? '#C05C5C' : undefined
            },
          ].map(kpi => (
            <div key={kpi.label} style={{
              backgroundColor: 'var(--color-white)', padding: '1.5rem',
              border: '1px solid var(--color-border)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
                  {kpi.label}
                </span>
                {kpi.icon}
              </div>
              <span className="text-serif" style={{ fontSize: '2rem', fontWeight: 300, color: kpi.color ?? 'var(--color-black)' }}>
                {kpi.value}
              </span>
              <p style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', margin: '0.25rem 0 0' }}>
                {kpi.sub}
              </p>
            </div>
          ))}
        </div>

        {/* ── Filtros de Estado ── */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '2.5rem' }}>
          <button
            onClick={() => setFiltroEstado('todas')}
            style={{
              padding: '0.5rem 1.25rem', fontSize: '0.8rem', fontWeight: 600,
              textTransform: 'uppercase', letterSpacing: '0.05em', cursor: 'pointer',
              border: filtroEstado === 'todas' ? '1px solid var(--color-black)' : '1px solid var(--color-border)',
              backgroundColor: filtroEstado === 'todas' ? 'var(--color-black)' : 'var(--color-white)',
              color: filtroEstado === 'todas' ? 'var(--color-white)' : 'var(--color-text-secondary)',
              transition: 'all 0.15s',
            }}
          >
            Todas ({ops.length})
          </button>
          {ESTADO_ORDEN.map(estado => {
            const cfg = ESTADO_CONFIG[estado];
            const count = ops.filter(o => o.estado === estado).length;
            return (
              <button
                key={estado}
                onClick={() => setFiltroEstado(estado)}
                style={{
                  padding: '0.5rem 1.25rem', fontSize: '0.8rem', fontWeight: 600,
                  textTransform: 'uppercase', letterSpacing: '0.05em', cursor: 'pointer',
                  border: filtroEstado === estado ? `1px solid ${cfg.color}` : '1px solid var(--color-border)',
                  backgroundColor: filtroEstado === estado ? cfg.bg : 'var(--color-white)',
                  color: filtroEstado === estado ? cfg.color : 'var(--color-text-secondary)',
                  transition: 'all 0.15s',
                }}
              >
                {cfg.label} ({count})
              </button>
            );
          })}
        </div>

        {/* ── Lista de OPs ── */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '5rem 0', color: 'var(--color-text-secondary)' }}>
            <RefreshCw size={28} style={{ margin: '0 auto 1rem', display: 'block', animation: 'spin 1s linear infinite' }} />
            Cargando órdenes de producción...
          </div>
        ) : opsFiltradas.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '5rem 2rem',
            backgroundColor: 'var(--color-white)', border: '1px solid var(--color-border)',
          }}>
            <Layers size={36} color="var(--color-border)" style={{ marginBottom: '1rem' }} />
            <p className="text-serif" style={{ fontSize: '1.25rem', color: 'var(--color-text-secondary)', margin: 0 }}>
              No hay órdenes en este estado
            </p>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginTop: '0.5rem' }}>
              {filtroEstado === 'todas' ? 'El tablero de producción está vacío.' : `No hay OPs con estado "${ESTADO_CONFIG[filtroEstado]?.label ?? filtroEstado}".`}
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '1.5rem' }}>
            {opsFiltradas.map(op => (
              <OPCard
                key={op.id}
                op={op}
                onAvanzar={handleOpenAvanzar}
                onReportarMerma={handleOpenMerma}
                onVerDetalle={op => { setOpDetalle(op); setShowDetalleModal(true); }}
              />
            ))}
          </div>
        )}

      </div>

      {/* ════════════════════════════════════════════════════════
          MODAL: AVANZAR ESTADO OP
      ════════════════════════════════════════════════════════ */}
      {showAvanzarModal && opSeleccionada && (() => {
        const cfg = ESTADO_CONFIG[opSeleccionada.estado as EstadoOP];
        const nuevoEstado = cfg.siguiente!;
        const cfgNuevo = ESTADO_CONFIG[nuevoEstado];
        return (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
            padding: '1rem',
          }}>
            <div style={{
              backgroundColor: 'var(--color-white)', width: '100%', maxWidth: '540px',
              padding: '2.5rem', border: '1px solid var(--color-border)',
              boxShadow: '0 20px 50px rgba(0,0,0,0.15)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
                <div>
                  <h3 className="text-serif" style={{ fontSize: '1.5rem', color: 'var(--color-black)', margin: '0 0 0.35rem' }}>
                    Avanzar Orden
                  </h3>
                  <span style={{ fontFamily: 'monospace', fontSize: '0.78rem', color: 'var(--color-text-secondary)' }}>
                    {opSeleccionada.codigo_op}
                  </span>
                </div>
                <button onClick={() => setShowAvanzarModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)' }}>
                  <X size={20} />
                </button>
              </div>

              {/* Transición visual */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem', padding: '1rem', backgroundColor: '#FAF9F6', border: '1px solid var(--color-border)' }}>
                <span style={{ padding: '0.3rem 0.75rem', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', backgroundColor: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
                  {cfg.label}
                </span>
                <ChevronRight size={16} color="var(--color-text-secondary)" />
                <span style={{ padding: '0.3rem 0.75rem', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', backgroundColor: cfgNuevo.bg, color: cfgNuevo.color, border: `1px solid ${cfgNuevo.border}` }}>
                  {cfgNuevo.label}
                </span>
              </div>

              <form onSubmit={handleAvanzarEstado} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ padding: '1rem', backgroundColor: '#FBF6EE', border: '1px solid #ECD9B8' }}>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: '#7A5A30' }}>
                    <strong>{opSeleccionada.producto_nombre}</strong>
                    {nuevoEstado === 'corte' && (
                      <><br /><span style={{ fontSize: '0.8rem' }}>⚙ Al iniciar el corte se descontarán automáticamente los insumos del BOM del inventario del taller.</span></>
                    )}
                    {nuevoEstado === 'completada' && (
                      <><br /><span style={{ fontSize: '0.8rem' }}>✔ Al completar la OP se ingresarán las unidades producidas al inventario de productos terminados.</span></>
                    )}
                  </p>
                </div>

                {nuevoEstado === 'completada' && (
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>
                      Unidades Producidas (de {opSeleccionada.cantidad_solicitada} solicitadas)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={opSeleccionada.cantidad_solicitada}
                      value={cantidadProducida}
                      onChange={e => setCantidadProducida(Number(e.target.value))}
                      required
                      style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--color-border)', fontSize: '1rem', boxSizing: 'border-box' }}
                    />
                  </div>
                )}

                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={() => setShowAvanzarModal(false)}
                    style={{ padding: '0.75rem 1.5rem', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-white)', cursor: 'pointer' }}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={avanzando}
                    className="btn btn-primary"
                    style={{ padding: '0.75rem 2rem', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
                  >
                    {avanzando ? <><RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} /> Procesando...</> : <><CheckCircle size={14} /> {cfg.accion}</>}
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}

      {/* ════════════════════════════════════════════════════════
          MODAL: REPORTAR MERMA / DESPERDICIO
      ════════════════════════════════════════════════════════ */}
      {showMermaModal && opParaMerma && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
          padding: '1rem',
        }}>
          <div style={{
            backgroundColor: 'var(--color-white)', width: '100%', maxWidth: '540px',
            padding: '2.5rem', border: '1px solid var(--color-border)',
            boxShadow: '0 20px 50px rgba(0,0,0,0.15)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
              <div>
                <h3 className="text-serif" style={{ fontSize: '1.5rem', color: 'var(--color-black)', margin: '0 0 0.35rem' }}>
                  Reportar Merma
                </h3>
                <span style={{ fontFamily: 'monospace', fontSize: '0.78rem', color: 'var(--color-text-secondary)' }}>
                  {opParaMerma.codigo_op} · {opParaMerma.producto_nombre}
                </span>
              </div>
              <button onClick={() => setShowMermaModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleGuardarMerma} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>
                  Materia Prima Afectada
                </label>
                <select
                  value={mermaMateriaId}
                  onChange={e => setMermaMateriaId(e.target.value)}
                  required
                  style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--color-border)', backgroundColor: '#FAF9F6', fontSize: '0.9rem' }}
                >
                  {materiasPrimas.length > 0 ? (
                    materiasPrimas.map(mp => (
                      <option key={mp.id} value={mp.id}>{mp.nombre} ({mp.sku})</option>
                    ))
                  ) : (
                    <>
                      <option value="mp1">Piel de Becerro Plena Flor — Cognac (MP-CUERO-COG-01)</option>
                      <option value="mp2">Piel Saffiano Premium — Negro Onyx (MP-CUERO-SAF-02)</option>
                      <option value="mp3">Hilo de Lino Encerado — Off-White (MP-HILO-LINO-03)</option>
                      <option value="mp4">Herrajes de Latón Macizo (MP-HERR-LAT-04)</option>
                    </>
                  )}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>
                    Cantidad Desperdiciada
                  </label>
                  <input
                    type="number"
                    min={0.01}
                    step={0.01}
                    value={mermaCantidad || ''}
                    onChange={e => setMermaCantidad(Number(e.target.value))}
                    required
                    placeholder="ej. 5.5"
                    style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--color-border)', fontSize: '0.9rem', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>
                    Motivo
                  </label>
                  <select
                    value={mermaMotivo}
                    onChange={e => setMermaMotivo(e.target.value as MotivoDesperdicio)}
                    style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--color-border)', backgroundColor: '#FAF9F6', fontSize: '0.9rem' }}
                  >
                    {MOTIVOS_DESPERDICIO.map(m => (
                      <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>
                  Observaciones (opcional)
                </label>
                <textarea
                  value={mermaObs}
                  onChange={e => setMermaObs(e.target.value)}
                  rows={3}
                  placeholder="Detalle adicional sobre la merma..."
                  style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--color-border)', fontSize: '0.85rem', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', paddingTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setShowMermaModal(false)}
                  style={{ padding: '0.75rem 1.5rem', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-white)', cursor: 'pointer' }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardandoMerma}
                  style={{
                    padding: '0.75rem 2rem', fontSize: '0.85rem', fontWeight: 600,
                    textTransform: 'uppercase', letterSpacing: '0.05em',
                    backgroundColor: '#B07A30', color: 'var(--color-white)',
                    border: 'none', cursor: 'pointer',
                    display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                    opacity: guardandoMerma ? 0.7 : 1,
                  }}
                >
                  {guardandoMerma ? <><RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} /> Guardando...</> : <><Plus size={14} /> Registrar Merma</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════
          MODAL: DETALLE OP
      ════════════════════════════════════════════════════════ */}
      {showDetalleModal && opDetalle && (() => {
        const cfg = ESTADO_CONFIG[opDetalle.estado as EstadoOP];
        return (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
            padding: '1rem', overflowY: 'auto',
          }}>
            <div style={{
              backgroundColor: 'var(--color-white)', width: '100%', maxWidth: '640px',
              padding: '2.5rem', border: '1px solid var(--color-border)',
              boxShadow: '0 20px 50px rgba(0,0,0,0.15)',
              maxHeight: '90vh', overflowY: 'auto',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
                <div>
                  <span style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
                    {opDetalle.codigo_op}
                  </span>
                  <h3 className="text-serif" style={{ fontSize: '1.6rem', color: 'var(--color-black)', margin: 0 }}>
                    {opDetalle.producto_nombre}
                  </h3>
                  <span style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)', fontFamily: 'monospace' }}>
                    {opDetalle.producto_ref}
                  </span>
                </div>
                <button onClick={() => setShowDetalleModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)' }}>
                  <X size={20} />
                </button>
              </div>

              {/* Estado badge */}
              <div style={{ marginBottom: '2rem' }}>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                  padding: '0.35rem 1rem', fontSize: '0.75rem', fontWeight: 600,
                  textTransform: 'uppercase', letterSpacing: '0.05em',
                  backgroundColor: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`,
                }}>
                  {cfg.icon} {cfg.label}
                </span>
              </div>

              {/* Info grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
                {[
                  { label: 'Unidades Solicitadas', value: opDetalle.cantidad_solicitada },
                  { label: 'Unidades Producidas', value: opDetalle.cantidad_producida },
                  { label: 'Artesano', value: opDetalle.artesano_nombre ?? '—' },
                  { label: 'Destino', value: opDetalle.bodega_destino_nombre ?? '—' },
                  { label: 'Fecha Inicio', value: opDetalle.fecha_inicio ? new Date(opDetalle.fecha_inicio).toLocaleDateString('es-CO') : '—' },
                  { label: 'Entrega Prometida', value: opDetalle.fecha_entrega_prometida ? new Date(opDetalle.fecha_entrega_prometida).toLocaleDateString('es-CO') : '—' },
                  ...(opDetalle.venta_numero_factura ? [{ label: 'Pedido Vinculado', value: opDetalle.venta_numero_factura }] : []),
                  ...(opDetalle.observaciones ? [{ label: 'Observaciones', value: opDetalle.observaciones }] : []),
                ].map(row => (
                  <div key={row.label}>
                    <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-secondary)', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>
                      {row.label}
                    </span>
                    <span style={{ fontSize: '0.95rem', color: 'var(--color-black)' }}>
                      {row.value}
                    </span>
                  </div>
                ))}
              </div>

              {/* Desperdicios reportados */}
              {opDetalle.desperdicios_reportados?.length > 0 && (
                <div>
                  <h4 style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-secondary)', fontWeight: 600, marginBottom: '1rem' }}>
                    Mermas Reportadas ({opDetalle.desperdicios_reportados.length})
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {opDetalle.desperdicios_reportados.map(d => (
                      <div key={d.id} style={{
                        padding: '0.75rem 1rem', backgroundColor: '#FBF6EE',
                        border: '1px solid #ECD9B8', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      }}>
                        <div>
                          <span style={{ fontSize: '0.82rem', fontWeight: 500, color: '#7A5A30' }}>
                            {MOTIVOS_DESPERDICIO.find(m => m.value === d.motivo)?.label ?? d.motivo}
                          </span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', display: 'block' }}>
                            {new Date(d.created_at || '').toLocaleDateString('es-CO')}
                          </span>
                        </div>
                        <span style={{ fontWeight: 600, color: '#B07A30', fontSize: '1rem' }}>
                          {d.cantidad_desperdiciada} u.
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setShowDetalleModal(false)}
                  className="btn"
                  style={{ padding: '0.75rem 2rem', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-white)', cursor: 'pointer' }}
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        );
      })()}

    </div>
  );
};

export default ProductionPanel;
