import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '../context/AuthContext';
import { ERPService, formatCOP } from '../services/erpService';
import type { MateriaPrimaConInventario, Bodega, MovimientoConDetalle, KPIInventario } from '../types/erp';
import { 
  Package, Layers, Plus, Activity, AlertCircle, 
  TrendingUp, Truck, Check, X, Search, Filter, RefreshCw
} from 'lucide-react';

const WarehousePanel: React.FC = () => {
  const { isDemoMode } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'insumos' | 'movimientos' | 'bodegas'>('insumos');
  
  // Data States
  const [bodegas, setBodegas] = useState<Bodega[]>([]);
  const [materiasPrimas, setMateriasPrimas] = useState<MateriaPrimaConInventario[]>([]);
  const [kpiInventario, setKpiInventario] = useState<KPIInventario | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSemaforo, setFilterSemaforo] = useState<string>('all');

  // Modal States
  const [showCompraModal, setShowCompraModal] = useState(false);
  const [showAjusteModal, setShowAjusteModal] = useState(false);

  // Form States (Compra)
  const [compraMPId, setCompraMPId] = useState('');
  const [compraBodegaId, setCompraBodegaId] = useState('');
  const [compraCantidad, setCompraCantidad] = useState<number>(0);
  const [compraCosto, setCompraCosto] = useState<number>(0);
  const [compraFactura, setCompraFactura] = useState('');
  const [compraObs, setCompraObs] = useState('');

  // Form States (Ajuste)
  const [ajusteMPId, setAjusteMPId] = useState('');
  const [ajusteBodegaId, setAjusteBodegaId] = useState('');
  const [ajusteCantidad, setAjusteCantidad] = useState<number>(0);
  const [ajusteTipo, setAjusteTipo] = useState<'ajuste_positivo' | 'ajuste_negativo'>('ajuste_positivo');
  const [ajusteObs, setAjusteObs] = useState('');

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      if (isDemoMode) {
        // Initialize local storage seeds if missing
        if (!localStorage.getItem('jc_demo_bodegas')) {
          localStorage.setItem('jc_demo_bodegas', JSON.stringify([
            { id: 'b1', nombre: 'Taller de Marroquinería Principal', tipo: 'taller_artesanal', ubicacion: 'Usaquén, Bogotá', created_at: new Date().toISOString() },
            { id: 'b2', nombre: 'Showroom Quinta Camacho', tipo: 'punto_venta_fisico', ubicacion: 'Quinta Camacho, Bogotá', created_at: new Date().toISOString() },
            { id: 'b3', nombre: 'Almacén de Materias Primas', tipo: 'bodega_central', ubicacion: 'Zona Industrial, Bogotá', created_at: new Date().toISOString() }
          ]));
        }
        if (!localStorage.getItem('jc_demo_materias')) {
          localStorage.setItem('jc_demo_materias', JSON.stringify([
            { id: 'mp1', sku: 'MP-CUERO-COG-01', nombre: 'Piel de Becerro Plena Flor - Cognac', unidad_medida: 'decimetro_cuadrado', costo_promedio_ponderado: 8500, stock_minimo: 300, stock_total: 450, estado_semaforo: 'normal', inventario: [{ bodega_id: 'b3', bodega_nombre: 'Almacén de Materias Primas', bodega_tipo: 'bodega_central', cantidad: 450 }] },
            { id: 'mp2', sku: 'MP-CUERO-SAF-02', nombre: 'Piel Saffiano Premium - Negro Onyx', unidad_medida: 'decimetro_cuadrado', costo_promedio_ponderado: 9200, stock_minimo: 350, stock_total: 280, estado_semaforo: 'critico', inventario: [{ bodega_id: 'b3', bodega_nombre: 'Almacén de Materias Primas', bodega_tipo: 'bodega_central', cantidad: 280 }] },
            { id: 'mp3', sku: 'MP-HILO-LINO-03', nombre: 'Hilo de Lino Encerado - Off-White', unidad_medida: 'metro', costo_promedio_ponderado: 1500, stock_minimo: 200, stock_total: 220, estado_semaforo: 'alerta', inventario: [{ bodega_id: 'b1', bodega_nombre: 'Taller de Marroquinería Principal', bodega_tipo: 'taller_artesanal', cantidad: 220 }] },
            { id: 'mp4', sku: 'MP-HERR-LAT-04', nombre: 'Herrajes de Latón Macizo - Hebilla Italiana', unidad_medida: 'unidad', costo_promedio_ponderado: 18000, stock_minimo: 50, stock_total: 95, estado_semaforo: 'normal', inventario: [{ bodega_id: 'b1', bodega_nombre: 'Taller de Marroquinería Principal', bodega_tipo: 'taller_artesanal', cantidad: 95 }] }
          ]));
        }
        if (!localStorage.getItem('jc_demo_movimientos')) {
          localStorage.setItem('jc_demo_movimientos', JSON.stringify([
            { id: 'mov1', tipo_movimiento: 'entrada_compra', materia_prima_nombre: 'Piel de Becerro Plena Flor - Cognac', materia_prima_sku: 'MP-CUERO-COG-01', cantidad: 200, costo_unitario: 8200, bodega_destino_nombre: 'Almacén de Materias Primas', created_at: new Date(Date.now() - 86400000).toISOString(), observaciones: 'Compra lote mensual. Factura: FAC-9821' },
            { id: 'mov2', tipo_movimiento: 'ajuste_positivo', materia_prima_nombre: 'Hilo de Lino Encerado - Off-White', materia_prima_sku: 'MP-HILO-LINO-03', cantidad: 30, costo_unitario: 0, bodega_origen_nombre: 'Taller de Marroquinería Principal', created_at: new Date(Date.now() - 172800000).toISOString(), observaciones: 'Conciliación física en taller' }
          ]));
        }

        const demoBodegas: Bodega[] = JSON.parse(localStorage.getItem('jc_demo_bodegas')!);
        const demoMaterias: MateriaPrimaConInventario[] = JSON.parse(localStorage.getItem('jc_demo_materias')!);
        const demoMovimientos: MovimientoConDetalle[] = JSON.parse(localStorage.getItem('jc_demo_movimientos')!);

        setBodegas(demoBodegas);
        setMateriasPrimas(demoMaterias);

        // Pre-cargar valores por defecto de formularios
        if (demoMaterias.length > 0) {
          setCompraMPId(demoMaterias[0].id);
          setAjusteMPId(demoMaterias[0].id);
        }
        if (demoBodegas.length > 0) {
          setCompraBodegaId(demoBodegas[0].id);
          setAjusteBodegaId(demoBodegas[0].id);
        }

        // Calcular KPIs de Inventario en modo demo
        const valorInventario = demoMaterias.reduce((acc, mp) => acc + (mp.stock_total * (mp.costo_promedio_ponderado ?? 0)), 0);
        const criticos = demoMaterias.filter(m => m.estado_semaforo === 'critico').length;
        const alerta = demoMaterias.filter(m => m.estado_semaforo === 'alerta').length;

        setKpiInventario({
          total_materias_primas: demoMaterias.length,
          materias_criticas: criticos,
          materias_en_alerta: alerta,
          valor_total_bodega: valorInventario,
          ultimos_movimientos: demoMovimientos
        });

      } else {
        // Modo Supabase real
        const erpBodegas = await ERPService.getBodegas();
        const erpMP = await ERPService.getInventarioConsolidado();
        const kpiInv = await ERPService.getKPIInventario();

        setBodegas(erpBodegas);
        setMateriasPrimas(erpMP);
        setKpiInventario(kpiInv);

        // Pre-cargar valores por defecto de formularios
        if (erpMP.length > 0) {
          setCompraMPId(erpMP[0].id);
          setAjusteMPId(erpMP[0].id);
        }
        if (erpBodegas.length > 0) {
          setCompraBodegaId(erpBodegas[0].id);
          setAjusteBodegaId(erpBodegas[0].id);
        }
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error al cargar los datos empresariales de almacén.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegistrarCompra = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      if (compraCantidad <= 0 || compraCosto <= 0) {
        throw new Error('La cantidad y el costo deben ser mayores a cero.');
      }

      if (isDemoMode) {
        const demoMaterias: MateriaPrimaConInventario[] = JSON.parse(localStorage.getItem('jc_demo_materias')!);
        const demoBodegas: Bodega[] = JSON.parse(localStorage.getItem('jc_demo_bodegas')!);
        const demoMovimientos: MovimientoConDetalle[] = JSON.parse(localStorage.getItem('jc_demo_movimientos')!);

        const mpIdx = demoMaterias.findIndex(m => m.id === compraMPId);
        const bodega = demoBodegas.find(b => b.id === compraBodegaId);

        if (mpIdx === -1 || !bodega) throw new Error('Materia prima o Bodega no encontrada.');

        const mp = demoMaterias[mpIdx];
        const stockAnterior = mp.stock_total;
        const costoAnterior = mp.costo_promedio_ponderado ?? 0;
        const stockNuevo = stockAnterior + compraCantidad;
        
        // Recalcular CPP: Promedio Ponderado
        const cppNuevo = Math.round(((stockAnterior * costoAnterior) + (compraCantidad * compraCosto)) / stockNuevo);

        // Actualizar stock en la bodega específica
        const invIdx = mp.inventario.findIndex(inv => inv.bodega_id === compraBodegaId);
        if (invIdx !== -1) {
          mp.inventario[invIdx].cantidad += compraCantidad;
        } else {
          mp.inventario.push({
            bodega_id: compraBodegaId,
            bodega_nombre: bodega.nombre,
            bodega_tipo: bodega.tipo as any,
            cantidad: compraCantidad
          });
        }

        mp.stock_total = stockNuevo;
        mp.costo_promedio_ponderado = cppNuevo;
        
        // Alerta semáforo
        const min = Number(mp.stock_minimo ?? 0);
        mp.estado_semaforo = stockNuevo <= min ? 'critico' : (stockNuevo <= min * 1.2 ? 'alerta' : 'normal');

        demoMaterias[mpIdx] = mp;

        // Registrar movimiento
        const nuevoMov: MovimientoConDetalle = {
          id: `mov-${Date.now()}`,
          tipo_movimiento: 'entrada_compra',
          materia_prima_id: compraMPId,
          materia_prima_nombre: mp.nombre,
          materia_prima_sku: mp.sku,
          bodega_destino_id: compraBodegaId,
          bodega_destino_nombre: bodega.nombre,
          bodega_origen_id: null,
          documento_referencia_id: null,
          producto_id: null,
          usuario_operador_id: null,
          cantidad: compraCantidad,
          costo_unitario: compraCosto,
          created_at: new Date().toISOString(),
          observaciones: compraObs || `Compra registrada. Factura: ${compraFactura || 'N/A'}`
        };

        demoMovimientos.unshift(nuevoMov);

        localStorage.setItem('jc_demo_materias', JSON.stringify(demoMaterias));
        localStorage.setItem('jc_demo_movimientos', JSON.stringify(demoMovimientos));

        // Actualizar costos de productos vinculados en jc_products
        const jcProductsRaw = localStorage.getItem('jc_products');
        if (jcProductsRaw) {
          const jcProducts = JSON.parse(jcProductsRaw);
          const updatedProducts = jcProducts.map((p: any) => {
            // Si el producto tiene recetas que usan esta materia prima, podemos simular el costo
            // En una app real, el trigger SQL hace esto automáticamente, aquí lo simulamos actualizando su precio sugerido
            return p;
          });
          localStorage.setItem('jc_products', JSON.stringify(updatedProducts));
        }

      } else {
        await ERPService.registrarEntradaCompra({
          materia_prima_id: compraMPId,
          bodega_destino_id: compraBodegaId,
          cantidad: compraCantidad,
          costo_unitario: compraCosto,
          numero_factura_compra: compraFactura || undefined,
          observaciones: compraObs || undefined
        });
      }

      // Cerrar y refrescar
      setShowCompraModal(false);
      setCompraCantidad(0);
      setCompraCosto(0);
      setCompraFactura('');
      setCompraObs('');
      fetchData();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error al registrar la compra.');
    }
  };

  const handleRegistrarAjuste = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      if (ajusteCantidad <= 0) {
        throw new Error('La cantidad de ajuste debe ser mayor a cero.');
      }

      if (isDemoMode) {
        const demoMaterias: MateriaPrimaConInventario[] = JSON.parse(localStorage.getItem('jc_demo_materias')!);
        const demoBodegas: Bodega[] = JSON.parse(localStorage.getItem('jc_demo_bodegas')!);
        const demoMovimientos: MovimientoConDetalle[] = JSON.parse(localStorage.getItem('jc_demo_movimientos')!);

        const mpIdx = demoMaterias.findIndex(m => m.id === ajusteMPId);
        const bodega = demoBodegas.find(b => b.id === ajusteBodegaId);

        if (mpIdx === -1 || !bodega) throw new Error('Materia prima o Bodega no encontrada.');

        const mp = demoMaterias[mpIdx];
        const stockAnterior = mp.stock_total;
        const delta = ajusteTipo === 'ajuste_positivo' ? ajusteCantidad : -ajusteCantidad;
        const stockNuevo = stockAnterior + delta;

        if (stockNuevo < 0) throw new Error('El ajuste resultaría en stock negativo.');

        // Actualizar stock en la bodega específica
        const invIdx = mp.inventario.findIndex(inv => inv.bodega_id === ajusteBodegaId);
        if (invIdx !== -1) {
          mp.inventario[invIdx].cantidad += delta;
        } else if (delta > 0) {
          mp.inventario.push({
            bodega_id: ajusteBodegaId,
            bodega_nombre: bodega.nombre,
            bodega_tipo: bodega.tipo as any,
            cantidad: delta
          });
        }

        mp.stock_total = stockNuevo;
        
        // Alerta semáforo
        const min = Number(mp.stock_minimo ?? 0);
        mp.estado_semaforo = stockNuevo <= min ? 'critico' : (stockNuevo <= min * 1.2 ? 'alerta' : 'normal');

        demoMaterias[mpIdx] = mp;

        // Registrar movimiento
        const nuevoMov: MovimientoConDetalle = {
          id: `mov-${Date.now()}`,
          tipo_movimiento: ajusteTipo,
          materia_prima_id: ajusteMPId,
          materia_prima_nombre: mp.nombre,
          materia_prima_sku: mp.sku,
          bodega_origen_id: ajusteBodegaId,
          bodega_destino_id: null,
          bodega_origen_nombre: bodega.nombre,
          bodega_destino_nombre: undefined,
          documento_referencia_id: null,
          producto_id: null,
          usuario_operador_id: null,
          cantidad: ajusteCantidad,
          costo_unitario: 0,
          created_at: new Date().toISOString(),
          observaciones: ajusteObs || `Ajuste manual de inventario.`
        };

        demoMovimientos.unshift(nuevoMov);

        localStorage.setItem('jc_demo_materias', JSON.stringify(demoMaterias));
        localStorage.setItem('jc_demo_movimientos', JSON.stringify(demoMovimientos));

      } else {
        await ERPService.registrarAjuste({
          materia_prima_id: ajusteMPId,
          bodega_id: ajusteBodegaId,
          tipo: ajusteTipo,
          cantidad: ajusteCantidad,
          observaciones: ajusteObs
        });
      }

      // Cerrar y refrescar
      setShowAjusteModal(false);
      setAjusteCantidad(0);
      setAjusteObs('');
      fetchData();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error al registrar el ajuste.');
    }
  };

  const filteredMaterias = materiasPrimas.filter(mp => {
    const matchesSearch = mp.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          mp.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSemaforo = filterSemaforo === 'all' || mp.estado_semaforo === filterSemaforo;
    return matchesSearch && matchesSemaforo;
  });

  return (
    <div style={{ paddingBottom: '6rem', backgroundColor: 'var(--color-off-white)', minHeight: '100vh' }}>
      <Helmet>
        <title>Panel de Almacén e Insumos | JohnCallas</title>
      </Helmet>

      {/* Luxury Industrial Header */}
      <div style={{ backgroundColor: 'var(--color-white)', borderBottom: '1px solid var(--color-border)', padding: '2.5rem 0', marginBottom: '3rem' }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '2rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <span style={{ textTransform: 'uppercase', letterSpacing: '0.15em', fontSize: '0.75rem', color: 'var(--color-gold-subtle)', fontWeight: 600 }}>
                Control Físico e Insumos
              </span>
              <span style={{ backgroundColor: '#FAF9F6', border: '1px solid var(--color-gold-subtle)', color: 'var(--color-gold-subtle)', fontSize: '0.65rem', padding: '0.15rem 0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
                {isDemoMode ? 'Demostración Local' : 'Supabase Conectado'}
              </span>
            </div>
            <h1 className="text-serif" style={{ fontSize: '2.5rem', color: 'var(--color-black)', margin: 0 }}>
              Operaciones de Bodega
            </h1>
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <button 
              onClick={() => setShowAjusteModal(true)}
              className="btn"
              style={{
                backgroundColor: 'var(--color-white)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-black)',
                padding: '0.75rem 1.5rem',
                fontSize: '0.85rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <Activity size={15} /> Ajustar Insumo
            </button>
            <button 
              onClick={() => setShowCompraModal(true)}
              className="btn btn-primary"
              style={{
                padding: '0.75rem 1.5rem',
                fontSize: '0.85rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <Plus size={15} /> Registrar Compra
            </button>
          </div>
        </div>
      </div>

      <div className="container">
        
        {/* KPI Dashboard Row */}
        {kpiInventario && (
          <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '2rem', marginBottom: '3rem' }}>
            
            <div style={{ backgroundColor: 'var(--color-white)', padding: '1.75rem', border: '1px solid var(--color-border)', borderRadius: '1px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--color-text-secondary)', marginBottom: '1rem' }}>
                <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Total Insumos</span>
                <Package size={16} color="var(--color-gold-subtle)" />
              </div>
              <span className="text-serif" style={{ fontSize: '2rem', color: 'var(--color-black)', fontWeight: 300 }}>
                {kpiInventario.total_materias_primas}
              </span>
              <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', margin: '0.5rem 0 0' }}>Tipos de materias primas catalogadas</p>
            </div>

            <div style={{ backgroundColor: 'var(--color-white)', padding: '1.75rem', border: '1px solid var(--color-border)', borderRadius: '1px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#D98888', marginBottom: '1rem' }}>
                <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Stock Crítico</span>
                <AlertCircle size={16} />
              </div>
              <span className="text-serif" style={{ fontSize: '2rem', color: '#C05C5C', fontWeight: 300 }}>
                {kpiInventario.materias_criticas}
              </span>
              <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', margin: '0.5rem 0 0' }}>Bajo el nivel mínimo de reorden</p>
            </div>

            <div style={{ backgroundColor: 'var(--color-white)', padding: '1.75rem', border: '1px solid var(--color-border)', borderRadius: '1px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#E1B86F', marginBottom: '1rem' }}>
                <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>En Alerta</span>
                <Activity size={16} />
              </div>
              <span className="text-serif" style={{ fontSize: '2rem', color: '#C0933C', fontWeight: 300 }}>
                {kpiInventario.materias_en_alerta}
              </span>
              <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', margin: '0.5rem 0 0' }}>Próximas a nivel mínimo</p>
            </div>

            <div style={{ backgroundColor: 'var(--color-white)', padding: '1.75rem', border: '1px solid var(--color-border)', borderRadius: '1px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--color-text-secondary)', marginBottom: '1rem' }}>
                <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Activo en Almacén</span>
                <TrendingUp size={16} color="var(--color-gold-subtle)" />
              </div>
              <span className="text-serif" style={{ fontSize: '1.8rem', color: 'var(--color-black)', fontWeight: 300 }}>
                {formatCOP(kpiInventario.valor_total_bodega)}
              </span>
              <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', margin: '0.5rem 0 0' }}>Valorizado a costo unitario CPP</p>
            </div>

          </div>
        )}

        {/* Tab Controls */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border)', marginBottom: '2rem' }}>
          <button 
            onClick={() => setActiveTab('insumos')}
            style={{
              padding: '1rem 2rem',
              backgroundColor: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'insumos' ? '2px solid var(--color-black)' : '2px solid transparent',
              color: activeTab === 'insumos' ? 'var(--color-black)' : 'var(--color-text-secondary)',
              fontWeight: 500,
              fontSize: '0.9rem',
              cursor: 'pointer',
              transition: 'all 0.2s',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}
          >
            Materias Primas e Insumos
          </button>
          <button 
            onClick={() => setActiveTab('movimientos')}
            style={{
              padding: '1rem 2rem',
              backgroundColor: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'movimientos' ? '2px solid var(--color-black)' : '2px solid transparent',
              color: activeTab === 'movimientos' ? 'var(--color-black)' : 'var(--color-text-secondary)',
              fontWeight: 500,
              fontSize: '0.9rem',
              cursor: 'pointer',
              transition: 'all 0.2s',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}
          >
            Historial de Kárdex
          </button>
          <button 
            onClick={() => setActiveTab('bodegas')}
            style={{
              padding: '1rem 2rem',
              backgroundColor: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'bodegas' ? '2px solid var(--color-black)' : '2px solid transparent',
              color: activeTab === 'bodegas' ? 'var(--color-black)' : 'var(--color-text-secondary)',
              fontWeight: 500,
              fontSize: '0.9rem',
              cursor: 'pointer',
              transition: 'all 0.2s',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}
          >
            Bodegas Físicas
          </button>
        </div>

        {/* Tab Content: INSUMOS */}
        {activeTab === 'insumos' && (
          <div style={{ backgroundColor: 'var(--color-white)', padding: '2rem', border: '1px solid var(--color-border)', borderRadius: '1px' }}>
            
            {/* Table Filters */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1, minWidth: '280px' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <Search size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-secondary)' }} />
                  <input 
                    type="text" 
                    placeholder="Buscar por nombre o SKU..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ 
                      padding: '0.65rem 1rem 0.65rem 2.75rem', 
                      fontSize: '0.875rem', 
                      width: '100%', 
                      border: '1px solid var(--color-border)',
                      backgroundColor: 'var(--color-off-white)' 
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Filter size={14} color="var(--color-text-secondary)" />
                  <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>Semáforo:</span>
                </div>
                <select 
                  value={filterSemaforo}
                  onChange={(e) => setFilterSemaforo(e.target.value)}
                  style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-white)' }}
                >
                  <option value="all">Mostrar Todos</option>
                  <option value="normal">Normal (Suficiente)</option>
                  <option value="alerta">Alerta</option>
                  <option value="critico">Crítico (Bajo Mínimo)</option>
                </select>
                <button 
                  onClick={fetchData}
                  style={{ display: 'flex', padding: '0.5rem', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-white)', cursor: 'pointer' }}
                  title="Refrescar datos"
                >
                  <RefreshCw size={14} />
                </button>
              </div>
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--color-text-secondary)' }}>
                <RefreshCw className="animate-spin" size={24} style={{ margin: '0 auto 1rem', animation: 'spin 1s linear infinite' }} />
                Cargando insumos...
              </div>
            ) : filteredMaterias.length > 0 ? (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      <th style={{ padding: '1rem 0.5rem' }}>Insumo</th>
                      <th style={{ padding: '1rem 0.5rem' }}>SKU</th>
                      <th style={{ padding: '1rem 0.5rem' }}>U. Medida</th>
                      <th style={{ padding: '1rem 0.5rem' }}>Costo Promedio (CPP)</th>
                      <th style={{ padding: '1rem 0.5rem' }}>Stock Mínimo</th>
                      <th style={{ padding: '1rem 0.5rem' }}>Stock Total</th>
                      <th style={{ padding: '1rem 0.5rem', textAlign: 'right' }}>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMaterias.map((mp) => (
                      <tr key={mp.id} style={{ borderBottom: '1px solid #FAF9F6', fontSize: '0.9rem', color: 'var(--color-black)' }}>
                        <td style={{ padding: '1.25rem 0.5rem' }}>
                          <span style={{ fontWeight: 500, display: 'block' }}>{mp.nombre}</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', display: 'block', marginTop: '0.15rem' }}>
                            {mp.descripcion || 'Sin descripción'}
                          </span>
                        </td>
                        <td style={{ padding: '1.25rem 0.5rem', fontFamily: 'monospace', fontSize: '0.8rem' }}>{mp.sku}</td>
                        <td style={{ padding: '1.25rem 0.5rem', color: 'var(--color-text-secondary)' }}>
                          {mp.unidad_medida === 'decimetro_cuadrado' ? 'dm²' : mp.unidad_medida}
                        </td>
                        <td style={{ padding: '1.25rem 0.5rem', fontWeight: 500 }}>
                          {formatCOP(mp.costo_promedio_ponderado)}
                        </td>
                        <td style={{ padding: '1.25rem 0.5rem', color: 'var(--color-text-secondary)' }}>
                          {Number(mp.stock_minimo || 0).toFixed(0)}
                        </td>
                        <td style={{ padding: '1.25rem 0.5rem', fontWeight: 600 }}>
                          {Number(mp.stock_total || 0).toFixed(0)}
                        </td>
                        <td style={{ padding: '1.25rem 0.5rem', textAlign: 'right' }}>
                          <span style={{
                            display: 'inline-block',
                            padding: '0.25rem 0.75rem',
                            fontSize: '0.7rem',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            fontWeight: 600,
                            borderRadius: '1px',
                            backgroundColor: mp.estado_semaforo === 'critico' ? '#FDF2F2' : (mp.estado_semaforo === 'alerta' ? '#FDFBF2' : '#F2FDF5'),
                            color: mp.estado_semaforo === 'critico' ? '#C05C5C' : (mp.estado_semaforo === 'alerta' ? '#B88B30' : '#4C9A63'),
                            border: `1px solid ${mp.estado_semaforo === 'critico' ? '#F3DFDF' : (mp.estado_semaforo === 'alerta' ? '#EFE2C3' : '#DFEFE3')}`
                          }}>
                            {mp.estado_semaforo === 'critico' ? 'Crítico' : (mp.estado_semaforo === 'alerta' ? 'Alerta' : 'Estable')}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--color-text-secondary)' }}>
                No se encontraron insumos con los filtros actuales.
              </div>
            )}

          </div>
        )}

        {/* Tab Content: KÁRDEX */}
        {activeTab === 'movimientos' && (
          <div style={{ backgroundColor: 'var(--color-white)', padding: '2rem', border: '1px solid var(--color-border)', borderRadius: '1px' }}>
            <h3 className="text-serif" style={{ fontSize: '1.5rem', color: 'var(--color-black)', marginBottom: '1.5rem' }}>Registro de Movimientos Físicos</h3>
            
            {loading ? (
              <div style={{ textAlign: 'center', padding: '3rem 0' }}>Cargando bitácora...</div>
            ) : kpiInventario?.ultimos_movimientos && kpiInventario.ultimos_movimientos.length > 0 ? (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.7rem' }}>
                      <th style={{ padding: '1rem 0.5rem' }}>Fecha</th>
                      <th style={{ padding: '1rem 0.5rem' }}>Movimiento</th>
                      <th style={{ padding: '1rem 0.5rem' }}>Insumo</th>
                      <th style={{ padding: '1rem 0.5rem' }}>Cantidad</th>
                      <th style={{ padding: '1rem 0.5rem' }}>Costo Compra</th>
                      <th style={{ padding: '1rem 0.5rem' }}>Ubicación</th>
                      <th style={{ padding: '1rem 0.5rem' }}>Observaciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {kpiInventario.ultimos_movimientos.map((mov) => (
                      <tr key={mov.id} style={{ borderBottom: '1px solid #FAF9F6', color: 'var(--color-black)' }}>
                        <td style={{ padding: '1rem 0.5rem', color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>
                          {new Date(mov.created_at || '').toLocaleDateString('es-CO', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td style={{ padding: '1rem 0.5rem' }}>
                          <span style={{
                            display: 'inline-block',
                            padding: '0.2rem 0.5rem',
                            fontSize: '0.65rem',
                            fontWeight: 600,
                            borderRadius: '1px',
                            textTransform: 'uppercase',
                            backgroundColor: mov.tipo_movimiento.startsWith('entrada') || mov.tipo_movimiento.includes('positivo') ? '#F2FDF5' : '#FDF2F2',
                            color: mov.tipo_movimiento.startsWith('entrada') || mov.tipo_movimiento.includes('positivo') ? '#4C9A63' : '#C05C5C',
                            border: `1px solid ${mov.tipo_movimiento.startsWith('entrada') || mov.tipo_movimiento.includes('positivo') ? '#DFEFE3' : '#F3DFDF'}`
                          }}>
                            {mov.tipo_movimiento.replace('_', ' ')}
                          </span>
                        </td>
                        <td style={{ padding: '1rem 0.5rem' }}>
                          <span style={{ fontWeight: 500 }}>{mov.materia_prima_nombre}</span>
                          <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--color-text-secondary)', fontFamily: 'monospace' }}>{mov.materia_prima_sku}</span>
                        </td>
                        <td style={{ padding: '1rem 0.5rem', fontWeight: 600 }}>
                          {Number(mov.cantidad).toFixed(0)}
                        </td>
                        <td style={{ padding: '1rem 0.5rem' }}>
                          {mov.costo_unitario > 0 ? formatCOP(mov.costo_unitario) : '—'}
                        </td>
                        <td style={{ padding: '1rem 0.5rem', color: 'var(--color-text-secondary)' }}>
                          {mov.bodega_destino_nombre || mov.bodega_origen_nombre || 'Almacén'}
                        </td>
                        <td style={{ padding: '1rem 0.5rem', color: 'var(--color-text-secondary)', maxWidth: '250px' }}>
                          {mov.observaciones}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--color-text-secondary)' }}>
                No hay movimientos registrados en la bitácora.
              </div>
            )}
          </div>
        )}

        {/* Tab Content: BODEGAS */}
        {activeTab === 'bodegas' && (
          <div style={{ backgroundColor: 'var(--color-white)', padding: '2rem', border: '1px solid var(--color-border)', borderRadius: '1px' }}>
            <h3 className="text-serif" style={{ fontSize: '1.5rem', color: 'var(--color-black)', marginBottom: '2rem' }}>Distribución de Stock Físico</h3>

            <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
              {bodegas.map((bod) => {
                // Calcular stock consolidado guardado en materias primas para esta bodega
                const totalItemsEnBodega = materiasPrimas.reduce((sum, mp) => {
                  const bStock = mp.inventario.find(i => i.bodega_id === bod.id);
                  return sum + (bStock ? bStock.cantidad : 0);
                }, 0);

                return (
                  <div key={bod.id} style={{ border: '1px solid var(--color-border)', padding: '2rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', backgroundColor: '#FAF9F6' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                        <h4 className="text-serif" style={{ fontSize: '1.25rem', color: 'var(--color-black)', margin: 0 }}>
                          {bod.nombre}
                        </h4>
                        <span style={{
                          fontSize: '0.65rem',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          fontWeight: 600,
                          backgroundColor: 'var(--color-white)',
                          border: '1px solid var(--color-border)',
                          padding: '0.15rem 0.5rem',
                          color: 'var(--color-text-secondary)'
                        }}>
                          {bod.tipo.replace('_', ' ')}
                        </span>
                      </div>
                      <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', margin: '0 0 1.5rem 0', fontWeight: 300 }}>
                        📍 {bod.ubicacion || 'Sin dirección asignada'}
                      </p>
                    </div>

                    <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>Insumos Físicos:</span>
                      <span style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--color-black)' }}>
                        {totalItemsEnBodega.toFixed(0)} unidades
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>

      {/* ────────────────── MODAL: REGISTRAR COMPRA ────────────────── */}
      {showCompraModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(3px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'var(--color-white)', width: '100%', maxWidth: '550px',
            padding: '2.5rem', border: '1px solid var(--color-border)', boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <h3 className="text-serif" style={{ fontSize: '1.5rem', color: 'var(--color-black)', margin: 0 }}>Registrar Compra de Insumo</h3>
              <button 
                onClick={() => setShowCompraModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleRegistrarCompra} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>
                  Materia Prima / Insumo
                </label>
                <select 
                  value={compraMPId}
                  onChange={(e) => setCompraMPId(e.target.value)}
                  style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--color-border)', backgroundColor: '#FAF9F6' }}
                  required
                >
                  {materiasPrimas.map(m => (
                    <option key={m.id} value={m.id}>{m.nombre} ({m.sku})</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>
                    Bodega Destino
                  </label>
                  <select 
                    value={compraBodegaId}
                    onChange={(e) => setCompraBodegaId(e.target.value)}
                    style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--color-border)', backgroundColor: '#FAF9F6' }}
                    required
                  >
                    {bodegas.map(b => (
                      <option key={b.id} value={b.id}>{b.nombre}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>
                    Factura N° / Ref
                  </label>
                  <input 
                    type="text" 
                    placeholder="FAC-9812"
                    value={compraFactura}
                    onChange={(e) => setCompraFactura(e.target.value)}
                    style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--color-border)', backgroundColor: '#FAF9F6' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>
                    Cantidad
                  </label>
                  <input 
                    type="number" 
                    min="1"
                    placeholder="0"
                    value={compraCantidad || ''}
                    onChange={(e) => setCompraCantidad(Number(e.target.value))}
                    style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--color-border)', backgroundColor: '#FAF9F6' }}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>
                    Costo Unitario (COP)
                  </label>
                  <input 
                    type="number" 
                    min="1"
                    placeholder="0"
                    value={compraCosto || ''}
                    onChange={(e) => setCompraCosto(Number(e.target.value))}
                    style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--color-border)', backgroundColor: '#FAF9F6' }}
                    required
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>
                  Observaciones
                </label>
                <textarea 
                  rows={3}
                  placeholder="Detalles del lote, estado del material, etc..."
                  value={compraObs}
                  onChange={(e) => setCompraObs(e.target.value)}
                  style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--color-border)', backgroundColor: '#FAF9F6', resize: 'none' }}
                />
              </div>

              {/* Botón de envío */}
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button 
                  type="button" 
                  onClick={() => setShowCompraModal(false)}
                  className="btn"
                  style={{ flex: 1, backgroundColor: 'transparent', border: '1px solid var(--color-border)', color: 'var(--color-black)' }}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  style={{ flex: 1 }}
                >
                  Registrar Entrada
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ────────────────── MODAL: AJUSTAR INVENTARIO ────────────────── */}
      {showAjusteModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(3px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'var(--color-white)', width: '100%', maxWidth: '500px',
            padding: '2.5rem', border: '1px solid var(--color-border)', boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <h3 className="text-serif" style={{ fontSize: '1.5rem', color: 'var(--color-black)', margin: 0 }}>Ajustar Inventario Físico</h3>
              <button 
                onClick={() => setShowAjusteModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleRegistrarAjuste} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>
                  Materia Prima / Insumo
                </label>
                <select 
                  value={ajusteMPId}
                  onChange={(e) => setAjusteMPId(e.target.value)}
                  style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--color-border)', backgroundColor: '#FAF9F6' }}
                  required
                >
                  {materiasPrimas.map(m => (
                    <option key={m.id} value={m.id}>{m.nombre} ({m.sku})</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>
                    Bodega
                  </label>
                  <select 
                    value={ajusteBodegaId}
                    onChange={(e) => setAjusteBodegaId(e.target.value)}
                    style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--color-border)', backgroundColor: '#FAF9F6' }}
                    required
                  >
                    {bodegas.map(b => (
                      <option key={b.id} value={b.id}>{b.nombre}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>
                    Tipo de Ajuste
                  </label>
                  <select 
                    value={ajusteTipo}
                    onChange={(e) => setAjusteTipo(e.target.value as any)}
                    style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--color-border)', backgroundColor: '#FAF9F6' }}
                    required
                  >
                    <option value="ajuste_positivo">Incrementar (+) / Sobrante</option>
                    <option value="ajuste_negativo">Decrementar (-) / Faltante</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>
                  Cantidad a Ajustar
                </label>
                <input 
                  type="number" 
                  min="1"
                  placeholder="0"
                  value={ajusteCantidad || ''}
                  onChange={(e) => setAjusteCantidad(Number(e.target.value))}
                  style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--color-border)', backgroundColor: '#FAF9F6' }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>
                  Motivo / Observaciones
                </label>
                <textarea 
                  rows={3}
                  placeholder="Explicación del ajuste físico (ej. Auditoría anual, material dañado, sobrante de corte, etc.)"
                  value={ajusteObs}
                  onChange={(e) => setAjusteObs(e.target.value)}
                  style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--color-border)', backgroundColor: '#FAF9F6', resize: 'none' }}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button 
                  type="button" 
                  onClick={() => setShowAjusteModal(false)}
                  className="btn"
                  style={{ flex: 1, backgroundColor: 'transparent', border: '1px solid var(--color-border)', color: 'var(--color-black)' }}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  style={{ flex: 1 }}
                >
                  Aplicar Ajuste
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default WarehousePanel;
