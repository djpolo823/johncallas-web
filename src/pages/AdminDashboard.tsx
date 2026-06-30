import React, { useState, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '../context/AuthContext';
import type { Product, ProductFilters } from '../types';
import { ProductService } from '../services/productService';
import { ImageService } from '../services/imageService';
import { ERPService, formatCOP } from '../services/erpService';
import { MRPService } from '../services/mrpService';
import type {
  MateriaPrimaConInventario,
  Bodega,
  MovimientoConDetalle,
  KPIInventario,
  AnaliticaCanalVenta,
} from '../types/erp';
import type {
  OrdenProduccionConDetalle,
  KPIProduccion,
  EstadoOP,
} from '../types/mrp';
import { 
  Plus, Edit, Trash2, X, Upload, Sparkles, 
  Layers, Package, 
  Activity, 
  Wrench, BarChart3, Truck, Compass, CheckCircle2
} from 'lucide-react';


export const AdminDashboard: React.FC = () => {
  const { currentUser, isDemoMode } = useAuth();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [price, setPrice] = useState(0);
  const [category, setCategory] = useState('Tote Bags');
  const [categoryId, setCategoryId] = useState('bolsos');
  const [refCode, setRefCode] = useState('');
  const [description, setDescription] = useState('');
  const [stock, setStock] = useState(5);
  const [features, setFeatures] = useState<string[]>(['']);
  
  // Advanced Filters Form Fields
  const [filterUso, setFilterUso] = useState<ProductFilters['uso']>('Diario');
  const [filterTamano, setFilterTamano] = useState<ProductFilters['tamano']>('Mediano');
  const [filterColor, setFilterColor] = useState<ProductFilters['color']>('Cognac');

  // Image Uploading Fields
  const [images, setImages] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);

  // ─── Pestañas y Estados ERP/MRP ──────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<'catalogo' | 'inventario' | 'produccion' | 'analitica'>('catalogo');
  
  const [bodegas, setBodegas] = useState<Bodega[]>([]);
  const [materiasPrimas, setMateriasPrimas] = useState<MateriaPrimaConInventario[]>([]);
  // const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [kpiInventario, setKpiInventario] = useState<KPIInventario | null>(null);
  const [analiticaCanal, setAnaliticaCanal] = useState<AnaliticaCanalVenta[]>([]);
  const [ordenesOP, setOrdenesOP] = useState<OrdenProduccionConDetalle[]>([]);
  const [kpiProduccion, setKpiProduccion] = useState<KPIProduccion | null>(null);

  // ─── Modales ERP/MRP ─────────────────────────────────────────────────────
  const [showCompraModal, setShowCompraModal] = useState(false);
  const [showAjusteModal, setShowAjusteModal] = useState(false);
  const [showOPModal, setShowOPModal] = useState(false);
  const [showDesperdicioModal, setShowDesperdicioModal] = useState(false);
  
  // ─── Formularios ERP/MRP ─────────────────────────────────────────────────
  // Compra
  const [compraMPId, setCompraMPId] = useState('');
  const [compraBodegaId, setCompraBodegaId] = useState('');
  const [compraCantidad, setCompraCantidad] = useState(0);
  const [compraCosto, setCompraCosto] = useState(0);
  const [compraFactura, setCompraFactura] = useState('');
  const [compraObs, setCompraObs] = useState('');

  // Ajuste
  const [ajusteMPId, setAjusteMPId] = useState('');
  const [ajusteBodegaId, setAjusteBodegaId] = useState('');
  const [ajusteCantidad, setAjusteCantidad] = useState(0);
  const [ajusteTipo, setAjusteTipo] = useState<'ajuste_positivo' | 'ajuste_negativo'>('ajuste_positivo');
  const [ajusteObs, setAjusteObs] = useState('');

  // Nueva OP
  const [opProductoId, setOpProductoId] = useState('');
  const [opCantidad, setOpCantidad] = useState(1);
  const [opBodegaDestinoId, setOpBodegaDestinoId] = useState('');
  const [opArtesanoId, setOpArtesanoId] = useState('');
  const [opFechaEntrega, setOpFechaEntrega] = useState('');

  // Desperdicio
  const [desperdicioOPId, setDesperdicioOPId] = useState('');
  const [desperdicioMPId, setDesperdicioMPId] = useState('');
  const [desperdicioCantidad, setDesperdicioCantidad] = useState(0);
  const [desperdicioMotivo, setDesperdicioMotivo] = useState('');


  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Obtener productos de catálogo
      const prodData = await ProductService.getProducts();
      setProducts(prodData);

      if (isDemoMode) {
        // Inicializar semillas de modo demo en localStorage si no existen
        if (!localStorage.getItem('jc_demo_bodegas')) {
          localStorage.setItem('jc_demo_bodegas', JSON.stringify([
            { id: 'b1', nombre: 'Taller de Marroquinería Principal', tipo: 'taller_artesanal', ubicacion: 'Usaquén, Bogotá', created_at: new Date().toISOString() },
            { id: 'b2', nombre: 'Showroom Quinta Camacho', tipo: 'punto_venta_fisico', ubicacion: 'Quinta Camacho, Bogotá', created_at: new Date().toISOString() },
            { id: 'b3', nombre: 'Almacén de Materias Primas', tipo: 'bodega_central', ubicacion: 'Zona Industrial, Bogotá', created_at: new Date().toISOString() }
          ]));
        }
        if (!localStorage.getItem('jc_demo_proveedores')) {
          localStorage.setItem('jc_demo_proveedores', JSON.stringify([
            { id: 'prov1', nombre: 'Curtiembres de los Andes S.A.S.', contacto: 'Carlos Mendoza', telefono: '+57 312 456 7890', created_at: new Date().toISOString() },
            { id: 'prov2', nombre: 'Herrajes Finos Firenze', contacto: 'Guiseppe Rossi', telefono: '+39 055 123 456', created_at: new Date().toISOString() }
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
        if (!localStorage.getItem('jc_demo_ordenes')) {
          localStorage.setItem('jc_demo_ordenes', JSON.stringify([
            { id: 'op1', codigo_op: 'OP-260520-4100', producto_id: String(prodData[0]?.id || '1'), producto_nombre: prodData[0]?.name || 'Classic Shoulder Bag', producto_ref: prodData[0]?.ref || 'JC-SADDLE-01', cantidad_solicitada: 15, cantidad_producida: 15, estado: 'completada', artesano_responsable_id: 'art1', artesano_nombre: 'John Callas', bodega_destino_id: 'b2', bodega_destino_nombre: 'Showroom Quinta Camacho', fecha_inicio: '2026-05-15', fecha_entrega_prometida: '2026-05-20', porcentaje_avance: 100, desperdicios_reportados: [] },
            { id: 'op2', codigo_op: 'OP-260522-8742', producto_id: String(prodData[1]?.id || '2'), producto_nombre: prodData[1]?.name || 'Tote Bag Cognac', producto_ref: prodData[1]?.ref || 'JC-TOTE-02', cantidad_solicitada: 10, cantidad_producida: 4, estado: 'armado', artesano_responsable_id: 'art2', artesano_nombre: 'Mateo Sierra', bodega_destino_id: 'b2', bodega_destino_nombre: 'Showroom Quinta Camacho', fecha_inicio: '2026-05-18', fecha_entrega_prometida: '2026-05-25', porcentaje_avance: 40, desperdicios_reportados: [] },
            { id: 'op3', codigo_op: 'OP-260523-1123', producto_id: String(prodData[2]?.id || '3'), producto_nombre: prodData[2]?.name || 'Billetera Minimalista Onyx', producto_ref: prodData[2]?.ref || 'JC-CARD-03', cantidad_solicitada: 25, cantidad_producida: 0, estado: 'planificada', artesano_responsable_id: 'art3', artesano_nombre: 'Gabriela Vega', bodega_destino_id: 'b1', bodega_destino_nombre: 'Taller de Marroquinería Principal', fecha_inicio: '2026-05-22', fecha_entrega_prometida: '2026-05-28', porcentaje_avance: 0, desperdicios_reportados: [] }
          ]));
        }
        if (!localStorage.getItem('jc_demo_movimientos')) {
          localStorage.setItem('jc_demo_movimientos', JSON.stringify([
            { id: 'mov1', tipo_movimiento: 'entrada_compra', materia_prima_nombre: 'Piel de Becerro Plena Flor - Cognac', materia_prima_sku: 'MP-CUERO-COG-01', cantidad: 200, costo_unitario: 8200, bodega_destino_nombre: 'Almacén de Materias Primas', created_at: new Date(Date.now() - 86400000).toISOString(), observaciones: 'Compra lote mensual. Factura: FAC-9821' },
            { id: 'mov2', tipo_movimiento: 'ajuste_positivo', materia_prima_nombre: 'Hilo de Lino Encerado - Off-White', materia_prima_sku: 'MP-HILO-LINO-03', cantidad: 30, costo_unitario: 0, bodega_origen_nombre: 'Taller de Marroquinería Principal', created_at: new Date(Date.now() - 172800000).toISOString(), observaciones: 'Conciliación física en taller' }
          ]));
        }

        // Leer datos demo de localStorage
        const demoBodegas: Bodega[] = JSON.parse(localStorage.getItem('jc_demo_bodegas')!);
        const demoMaterias: MateriaPrimaConInventario[] = JSON.parse(localStorage.getItem('jc_demo_materias')!);
        // const demoProveedores = JSON.parse(localStorage.getItem('jc_demo_proveedores')!);
        const demoOrdenes: OrdenProduccionConDetalle[] = JSON.parse(localStorage.getItem('jc_demo_ordenes')!);
        const demoMovimientos: MovimientoConDetalle[] = JSON.parse(localStorage.getItem('jc_demo_movimientos')!);

        setBodegas(demoBodegas);
        setMateriasPrimas(demoMaterias);
        // setProveedores(demoProveedores);
        setOrdenesOP(demoOrdenes);

        // Pre-cargar valores por defecto de formularios
        if (demoMaterias.length > 0) {
          setCompraMPId(demoMaterias[0].id);
          setAjusteMPId(demoMaterias[0].id);
          setDesperdicioMPId(demoMaterias[0].id);
        }
        if (demoBodegas.length > 0) {
          setCompraBodegaId(demoBodegas[0].id);
          setAjusteBodegaId(demoBodegas[0].id);
          setOpBodegaDestinoId(demoBodegas[0].id);
        }
        if (prodData.length > 0) {
          setOpProductoId(String(prodData[0].id));
        }

        // Calcular KPIs del Inventario en modo demo
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

        // Calcular KPIs de Producción en modo demo
        const activas = demoOrdenes.filter(o => ['planificada', 'corte', 'armado', 'acabado', 'control_calidad'].includes(o.estado)).length;
        const completadas = demoOrdenes.filter(o => o.estado === 'completada').length;
        const producidas = demoOrdenes.filter(o => o.estado === 'completada').reduce((acc, o) => acc + o.cantidad_producida, 0);

        setKpiProduccion({
          ops_activas: activas,
          ops_completadas_mes: completadas,
          unidades_producidas_mes: producidas,
          eficiencia_desperdicio: 94.2, // Estándar del taller
          ops_por_estado: {
            planificada: demoOrdenes.filter(o => o.estado === 'planificada').length,
            corte: demoOrdenes.filter(o => o.estado === 'corte').length,
            armado: demoOrdenes.filter(o => o.estado === 'armado').length,
            acabado: demoOrdenes.filter(o => o.estado === 'acabado').length,
            control_calidad: demoOrdenes.filter(o => o.estado === 'control_calidad').length,
            completada: completadas,
            cancelada: demoOrdenes.filter(o => o.estado === 'cancelada').length
          },
          artesanos_activos: 3
        });

        // Analítica de canales demo
        setAnaliticaCanal([
          { canal: 'e_commerce', total_ventas: 48, total_unidades: 85, ingresos: 82450000, costo_historico: 35600000, margen_bruto: 46850000, margen_porcentaje: 56.8 },
          { canal: 'showroom', total_ventas: 28, total_unidades: 42, ingresos: 48900000, costo_historico: 21400000, margen_bruto: 27500000, margen_porcentaje: 56.2 },
          { canal: 'mayorista', total_ventas: 8, total_unidades: 35, ingresos: 32000000, costo_historico: 16500000, margen_bruto: 15500000, margen_porcentaje: 48.4 }
        ]);

      } else {
        // Modo Supabase real
        const erpBodegas = await ERPService.getBodegas();
        const erpMP = await ERPService.getInventarioConsolidado();
        // const erpProv = await ERPService.getProveedores();
        const kpiInv = await ERPService.getKPIInventario();
        const analitica = await ERPService.getAnaliticaPorCanal();
        
        const mrpOps = await MRPService.getOrdenes();
        const kpiProd = await MRPService.getKPIProduccion();

        setBodegas(erpBodegas);
        setMateriasPrimas(erpMP);
        // setProveedores(erpProv);
        setKpiInventario(kpiInv);
        setAnaliticaCanal(analitica);
        setOrdenesOP(mrpOps);
        setKpiProduccion(kpiProd);

        // Pre-cargar valores por defecto de formularios
        if (erpMP.length > 0) {
          setCompraMPId(erpMP[0].id);
          setAjusteMPId(erpMP[0].id);
          setDesperdicioMPId(erpMP[0].id);
        }
        if (erpBodegas.length > 0) {
          setCompraBodegaId(erpBodegas[0].id);
          setAjusteBodegaId(erpBodegas[0].id);
          setOpBodegaDestinoId(erpBodegas[0].id);
        }
        if (prodData.length > 0) {
          setOpProductoId(String(prodData[0].id));
        }
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error al cargar los datos empresariales de ERP y MRP.');
    } finally {
      setLoading(false);
    }
  };


  const handleOpenAddModal = () => {
    setEditingProduct(null);
    setName('');
    setPrice(0);
    setCategory('Tote Bags');
    setCategoryId('bolsos');
    setRefCode(`JC-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Date.now().toString().slice(-3)}`);
    setDescription('');
    setStock(10);
    setFeatures(['']);
    setImages([]);
    setFilterUso('Diario');
    setFilterTamano('Mediano');
    setFilterColor('Cognac');
    setError(null);
    setShowModal(true);
  };

  const handleOpenEditModal = (product: Product) => {
    setEditingProduct(product);
    setName(product.name);
    setPrice(product.price);
    setCategory(product.category);
    setCategoryId(product.categoryId);
    setRefCode(product.ref);
    setDescription(product.description);
    setStock(product.stock);
    setFeatures(product.features.length > 0 ? [...product.features] : ['']);
    setImages([...product.images]);
    setFilterUso(product.filters?.uso || 'Diario');
    setFilterTamano(product.filters?.tamano || 'Mediano');
    setFilterColor(product.filters?.color || 'Cognac');
    setError(null);
    setShowModal(true);
  };

  const handleAddFeatureField = () => {
    setFeatures([...features, '']);
  };

  const handleRemoveFeatureField = (index: number) => {
    const newFeatures = features.filter((_, i) => i !== index);
    setFeatures(newFeatures.length === 0 ? [''] : newFeatures);
  };

  const handleFeatureChange = (index: number, value: string) => {
    const newFeatures = [...features];
    newFeatures[index] = value;
    setFeatures(newFeatures);
  };

  // Image Upload Handlers
  const processFiles = async (files: FileList) => {
    setUploadingImages(true);
    setError(null);
    try {
      const newFiles: File[] = [];
      for (let i = 0; i < files.length; i++) {
        newFiles.push(files[i]);
      }
      const uploadedUrls = await ImageService.uploadImages(newFiles);
      setImages([...images, ...uploadedUrls]);
    } catch (err: any) {
      console.error(err);
      setError('Error al subir e integrar imágenes.');
    } finally {
      setUploadingImages(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await processFiles(e.dataTransfer.files);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await processFiles(e.target.files);
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSetPrimaryImage = (index: number) => {
    const newImages = [...images];
    const [primary] = newImages.splice(index, 1);
    newImages.unshift(primary);
    setImages(newImages);
  };

  const handleDeleteProduct = async (id: number | string) => {
    if (window.confirm('¿Estás seguro de que deseas retirar este producto de la colección?')) {
      try {
        await ProductService.deleteProduct(id);
        fetchData();
      } catch (err) {
        console.error(err);
        alert('Error al eliminar producto.');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (images.length === 0) {
      setError('Es necesario cargar al menos una imagen principal para el producto.');
      return;
    }

    const cleanFeatures = features.filter(f => f.trim() !== '');

    const productData = {
      name,
      price: Number(price),
      images,
      category,
      categoryId,
      ref: refCode,
      description,
      features: cleanFeatures,
      stock: Number(stock),
      filters: {
        categoria: categoryId,
        precio: Number(price),
        uso: filterUso,
        tamano: filterTamano,
        color: filterColor
      },
      ownerId: currentUser?.id
    };

    try {
      if (editingProduct) {
        await ProductService.updateProduct(editingProduct.id, productData);
      } else {
        await ProductService.createProduct(productData);
      }
      setShowModal(false);
      fetchData();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error al guardar el producto.');
    }
  };

  // ─── Operaciones de Inventario ERP ───────────────────────────────────────
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
        const costoAnterior = mp.costo_promedio_ponderado;
        const stockNuevo = stockAnterior + compraCantidad;
        
        // Recalcular CPP: Promedio Ponderado
        const cppNuevo = Math.round(((stockAnterior * (costoAnterior ?? 0)) + (compraCantidad * compraCosto)) / stockNuevo);

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
        localStorage.setItem('jc_demo_movimientos', JSON.stringify(demoMovimientos.slice(0, 100)));

        alert('Entrada de compra registrada y costo promedio ponderado recalculado con éxito.');
      } else {
        await ERPService.registrarEntradaCompra({
          materia_prima_id: compraMPId,
          bodega_destino_id: compraBodegaId,
          cantidad: compraCantidad,
          costo_unitario: compraCosto,
          numero_factura_compra: compraFactura,
          observaciones: compraObs,
          usuario_operador_id: currentUser?.id
        });
        alert('Entrada de compra registrada y procesada en Supabase.');
      }

      setShowCompraModal(false);
      // Reset campos
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
        throw new Error('La cantidad del ajuste debe ser mayor a cero.');
      }

      if (isDemoMode) {
        const demoMaterias: MateriaPrimaConInventario[] = JSON.parse(localStorage.getItem('jc_demo_materias')!);
        const demoBodegas: Bodega[] = JSON.parse(localStorage.getItem('jc_demo_bodegas')!);
        const demoMovimientos: MovimientoConDetalle[] = JSON.parse(localStorage.getItem('jc_demo_movimientos')!);

        const mpIdx = demoMaterias.findIndex(m => m.id === ajusteMPId);
        const bodega = demoBodegas.find(b => b.id === ajusteBodegaId);

        if (mpIdx === -1 || !bodega) throw new Error('Materia prima o Bodega no encontrada.');

        const mp = demoMaterias[mpIdx];
        const invIdx = mp.inventario.findIndex(inv => inv.bodega_id === ajusteBodegaId);
        const cantActual = invIdx !== -1 ? mp.inventario[invIdx].cantidad : 0;

        const delta = ajusteTipo === 'ajuste_positivo' ? ajusteCantidad : -ajusteCantidad;
        const nuevaCant = cantActual + delta;

        if (nuevaCant < 0) throw new Error('El stock no puede ser menor a cero.');

        if (invIdx !== -1) {
          mp.inventario[invIdx].cantidad = nuevaCant;
        } else if (ajusteTipo === 'ajuste_positivo') {
          mp.inventario.push({
            bodega_id: ajusteBodegaId,
            bodega_nombre: bodega.nombre,
            bodega_tipo: bodega.tipo as any,
            cantidad: ajusteCantidad
          });
        }

        const stockNuevo = mp.inventario.reduce((acc, i) => acc + i.cantidad, 0);
        mp.stock_total = stockNuevo;

        const min = Number(mp.stock_minimo ?? 0);
        mp.estado_semaforo = stockNuevo <= min ? 'critico' : (stockNuevo <= min * 1.2 ? 'alerta' : 'normal');

        demoMaterias[mpIdx] = mp;

        // Movimiento
        const nuevoMov: MovimientoConDetalle = {
          id: `mov-${Date.now()}`,
          tipo_movimiento: ajusteTipo,
          materia_prima_id: ajusteMPId,
          materia_prima_nombre: mp.nombre,
          materia_prima_sku: mp.sku,
          bodega_origen_id: ajusteBodegaId,
          bodega_origen_nombre: bodega.nombre,
          bodega_destino_id: null,
          documento_referencia_id: null,
          producto_id: null,
          usuario_operador_id: null,
          cantidad: ajusteCantidad,
          costo_unitario: 0,
          created_at: new Date().toISOString(),
          observaciones: ajusteObs || `Ajuste manual de inventario (${ajusteTipo})`
        };

        demoMovimientos.unshift(nuevoMov);

        localStorage.setItem('jc_demo_materias', JSON.stringify(demoMaterias));
        localStorage.setItem('jc_demo_movimientos', JSON.stringify(demoMovimientos.slice(0, 100)));

        alert('Ajuste de inventario aplicado con éxito.');
      } else {
        await ERPService.registrarAjuste({
          materia_prima_id: ajusteMPId,
          bodega_id: ajusteBodegaId,
          cantidad: ajusteCantidad,
          tipo: ajusteTipo,
          observaciones: ajusteObs,
          usuario_operador_id: currentUser?.id
        });
        alert('Ajuste de inventario registrado en Supabase.');
      }

      setShowAjusteModal(false);
      setAjusteCantidad(0);
      setAjusteObs('');
      fetchData();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error al registrar el ajuste.');
    }
  };

  // ─── Operaciones de Producción MRP ───────────────────────────────────────
  const handleCrearOP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      if (opCantidad <= 0) throw new Error('La cantidad solicitada debe ser mayor a cero.');

      if (isDemoMode) {
        const demoOrdenes: OrdenProduccionConDetalle[] = JSON.parse(localStorage.getItem('jc_demo_ordenes')!);
        const demoBodegas: Bodega[] = JSON.parse(localStorage.getItem('jc_demo_bodegas')!);
        
        const p = products.find(prod => String(prod.id) === opProductoId);
        const b = demoBodegas.find(bod => bod.id === opBodegaDestinoId);

        if (!p || !b) throw new Error('Producto o bodega no encontrados.');

        const fechaStr = new Date().toISOString().slice(2, 10).replace(/-/g, '');
        const rand = Math.floor(Math.random() * 9000) + 1000;
        const codigo = `OP-${fechaStr}-${rand}`;

        const artesanosNombres: Record<string, string> = {
          'art1': 'John Callas',
          'art2': 'Mateo Sierra',
          'art3': 'Gabriela Vega'
        };

        const nuevaOP: OrdenProduccionConDetalle = {
          id: `op-${Date.now()}`,
          codigo_op: codigo,
          producto_id: opProductoId,
          producto_nombre: p.name,
          producto_ref: p.ref,
          cantidad_solicitada: opCantidad,
          cantidad_producida: 0,
          estado: 'planificada',
          artesano_responsable_id: opArtesanoId || null,
          artesano_nombre: opArtesanoId ? artesanosNombres[opArtesanoId] || '—' : '—',
          bodega_destino_id: opBodegaDestinoId,
          bodega_destino_nombre: b.nombre,
          fecha_inicio: new Date().toISOString().split('T')[0],
          fecha_entrega_prometida: opFechaEntrega || null,
          porcentaje_avance: 0,
          desperdicios_reportados: [],
          created_at: new Date().toISOString(),
          venta_id: null
        };

        demoOrdenes.unshift(nuevaOP);
        localStorage.setItem('jc_demo_ordenes', JSON.stringify(demoOrdenes));

        alert(`Lote de producción ${codigo} planificado con éxito.`);
      } else {
        await MRPService.crearOrden({
          producto_id: opProductoId,
          cantidad_solicitada: opCantidad,
          bodega_destino_id: opBodegaDestinoId,
          artesano_responsable_id: opArtesanoId || undefined,
          fecha_entrega_prometida: opFechaEntrega || undefined
        });
        alert('Orden de Producción planificada en Supabase.');
      }

      setShowOPModal(false);
      setOpCantidad(1);
      setOpFechaEntrega('');
      fetchData();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error al planificar la OP.');
    }
  };

  const handleAvanzarEstadoOP = async (opId: string, estadoActual: EstadoOP) => {
    const flujo: EstadoOP[] = ['planificada', 'corte', 'armado', 'acabado', 'control_calidad', 'completada'];
    const idx = flujo.indexOf(estadoActual);
    if (idx === -1 || idx === flujo.length - 1) return;

    const siguienteEstado = flujo[idx + 1];
    
    let cantProd: number | undefined = undefined;
    if (siguienteEstado === 'completada') {
      const op = ordenesOP.find(o => o.id === opId);
      const str = window.prompt('¿Cuántas unidades se completaron con control de calidad aprobado?', String(op?.cantidad_solicitada ?? 1));
      if (str === null) return;
      cantProd = parseInt(str, 10);
      if (isNaN(cantProd) || cantProd < 0) {
        alert('Cantidad inválida.');
        return;
      }
    } else {
      if (!window.confirm(`¿Confirmas avanzar esta orden al estado de taller: ${siguienteEstado.toUpperCase()}?`)) {
        return;
      }
    }

    try {
      if (isDemoMode) {
        const demoOrdenes: OrdenProduccionConDetalle[] = JSON.parse(localStorage.getItem('jc_demo_ordenes')!);
        const opIdx = demoOrdenes.findIndex(o => o.id === opId);
        if (opIdx === -1) throw new Error('Orden de producción no encontrada.');

        const op = demoOrdenes[opIdx];
        op.estado = siguienteEstado;
        
        if (siguienteEstado === 'corte') {
          // Descontar insumos automáticamente del taller (Demo)
          const demoMaterias: MateriaPrimaConInventario[] = JSON.parse(localStorage.getItem('jc_demo_materias')!);
          const demoMovimientos: MovimientoConDetalle[] = JSON.parse(localStorage.getItem('jc_demo_movimientos')!);

          // En una OP de 10 bolsos, simulemos que gastamos 30 dm2 de cuero y 10 herrajes
          // MP1 (Cuero Cognac)
          const m1 = demoMaterias.find(m => m.id === 'mp1');
          if (m1 && m1.inventario.length > 0) {
            const gasto = op.cantidad_solicitada * 3; // 3dm2 por pieza
            m1.inventario[0].cantidad = Math.max(0, m1.inventario[0].cantidad - gasto);
            m1.stock_total = m1.inventario.reduce((acc, i) => acc + i.cantidad, 0);
            
            demoMovimientos.unshift({
              id: `mov-${Date.now()}-c1`,
              tipo_movimiento: 'ajuste_negativo',
              materia_prima_id: 'mp1',
              materia_prima_nombre: m1.nombre,
              materia_prima_sku: m1.sku,
              bodega_origen_id: 'b1',
              bodega_origen_nombre: 'Taller de Marroquinería Principal',
              bodega_destino_id: null,
              documento_referencia_id: null,
              producto_id: null,
              usuario_operador_id: null,
              cantidad: gasto,
              costo_unitario: 0,
              created_at: new Date().toISOString(),
              observaciones: `Consumo de material para corte de ${op.codigo_op}`
            });
          }

          localStorage.setItem('jc_demo_materias', JSON.stringify(demoMaterias));
          localStorage.setItem('jc_demo_movimientos', JSON.stringify(demoMovimientos));
        }

        if (siguienteEstado === 'completada' && cantProd !== undefined) {
          op.cantidad_producida = cantProd;
          op.porcentaje_avance = 100;
          
          // Incrementar stock del producto en el catálogo (Demo)
          const demoProducts = JSON.parse(localStorage.getItem('PRODUCTS_STORAGE_KEY') || '[]');
          const prodIdx = demoProducts.findIndex((p: any) => String(p.id) === String(op.producto_id));
          if (prodIdx !== -1) {
            demoProducts[prodIdx].stock += cantProd;
            localStorage.setItem('PRODUCTS_STORAGE_KEY', JSON.stringify(demoProducts));
          }
        } else {
          // Estimar avances parciales
          const avances: Record<EstadoOP, number> = {
            planificada: 0,
            corte: 20,
            armado: 50,
            acabado: 80,
            control_calidad: 95,
            completada: 100,
            cancelada: 0
          };
          op.porcentaje_avance = avances[siguienteEstado] || 0;
        }

        demoOrdenes[opIdx] = op;
        localStorage.setItem('jc_demo_ordenes', JSON.stringify(demoOrdenes));
        alert(`Orden avanzada a ${siguienteEstado.toUpperCase()} con éxito.`);
      } else {
        await MRPService.avanzarEstadoOP({
          op_id: opId,
          nuevo_estado: siguienteEstado,
          cantidad_producida: cantProd
        });
        alert('Estado de Orden de Producción actualizado en Supabase.');
      }
      fetchData();
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Error al actualizar el estado de la OP.');
    }
  };

  const handleReportarDesperdicio = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      if (desperdicioCantidad <= 0) throw new Error('El desperdicio debe ser mayor a cero.');

      if (isDemoMode) {
        const demoOrdenes: OrdenProduccionConDetalle[] = JSON.parse(localStorage.getItem('jc_demo_ordenes')!);
        const demoMaterias: MateriaPrimaConInventario[] = JSON.parse(localStorage.getItem('jc_demo_materias')!);
        const demoMovimientos: MovimientoConDetalle[] = JSON.parse(localStorage.getItem('jc_demo_movimientos')!);

        const opIdx = demoOrdenes.findIndex(o => o.id === desperdicioOPId);
        const mp = demoMaterias.find(m => m.id === desperdicioMPId);

        if (opIdx === -1 || !mp) throw new Error('Orden o insumo no encontrado.');

        const op = demoOrdenes[opIdx];
        
        // Registrar desperdicio en OP
        const nuevoDesperdicio = {
          id: `des-${Date.now()}`,
          orden_produccion_id: desperdicioOPId,
          materia_prima_id: desperdicioMPId,
          cantidad_desperdiciada: desperdicioCantidad,
          motivo: desperdicioMotivo,
          created_at: new Date().toISOString()
        };

        if (!op.desperdicios_reportados) op.desperdicios_reportados = [];
        op.desperdicios_reportados.push(nuevoDesperdicio as any);

        // Descontar material de inventario físico (Taller) por desperdicio real
        if (mp.inventario.length > 0) {
          mp.inventario[0].cantidad = Math.max(0, mp.inventario[0].cantidad - desperdicioCantidad);
          mp.stock_total = mp.inventario.reduce((acc, i) => acc + i.cantidad, 0);
          
          const min = Number(mp.stock_minimo ?? 0);
          mp.estado_semaforo = mp.stock_total <= min ? 'critico' : (mp.stock_total <= min * 1.2 ? 'alerta' : 'normal');

          demoMovimientos.unshift({
            id: `mov-${Date.now()}`,
            tipo_movimiento: 'ajuste_negativo',
            materia_prima_id: desperdicioMPId,
            materia_prima_nombre: mp.nombre,
            materia_prima_sku: mp.sku,
            bodega_origen_id: 'b1',
            bodega_origen_nombre: 'Taller de Marroquinería Principal',
            bodega_destino_id: null,
            documento_referencia_id: null,
            producto_id: null,
            usuario_operador_id: null,
            cantidad: desperdicioCantidad,
            costo_unitario: 0,
            created_at: new Date().toISOString(),
            observaciones: `Desperdicio real reportado en ${op.codigo_op}. Motivo: ${desperdicioMotivo}`
          });
        }

        demoOrdenes[opIdx] = op;
        localStorage.setItem('jc_demo_ordenes', JSON.stringify(demoOrdenes));
        localStorage.setItem('jc_demo_materias', JSON.stringify(demoMaterias));
        localStorage.setItem('jc_demo_movimientos', JSON.stringify(demoMovimientos));

        alert('Desperdicio reportado con éxito y descontado del inventario del taller.');
      } else {
        await MRPService.reportarDesperdicio({
          orden_produccion_id: desperdicioOPId,
          materia_prima_id: desperdicioMPId,
          cantidad_desperdiciada: desperdicioCantidad,
          motivo: desperdicioMotivo
        });
        alert('Desperdicio registrado y procesado en Supabase.');
      }

      setShowDesperdicioModal(false);
      setDesperdicioCantidad(0);
      setDesperdicioMotivo('');
      fetchData();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error al reportar desperdicio.');
    }
  };


  return (
    <div style={{ paddingTop: '2rem', paddingBottom: '6rem', backgroundColor: 'var(--color-off-white)' }} className="animate-fade-in">
      <Helmet>
        <title>Panel de Administración | JohnCallas</title>
      </Helmet>

      <div className="container">
        {/* Banner Indicativo de Demo */}
        {isDemoMode && (
          <div style={{
            backgroundColor: '#FAF5EE',
            border: '1px solid var(--color-leather-beige)',
            padding: '1rem 1.5rem',
            marginBottom: '3rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '0.875rem',
            color: 'var(--color-text-secondary)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Sparkles size={16} color="var(--color-gold-subtle)" />
              <span>Ejecutando en <strong>Modo Demo Local</strong>. Todo cambio se guardará en <strong>localStorage</strong> de forma instantánea.</span>
            </div>
            <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-gold-subtle)' }}>Dev Environment</span>
          </div>
        )}

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '3rem' }}>
          <div>
            <span style={{ textTransform: 'uppercase', letterSpacing: '0.15em', fontSize: '0.75rem', color: 'var(--color-gold-subtle)', fontWeight: 600 }}>
              {activeTab === 'catalogo' ? 'Control del Catálogo' : activeTab === 'inventario' ? 'Cadena de Suministro' : activeTab === 'produccion' ? 'Planificación de Taller' : 'Rendimiento Operativo'}
            </span>
            <h1 className="text-serif" style={{ fontSize: '3rem', marginTop: '0.5rem', marginBottom: 0, color: 'var(--color-black)' }}>
              {activeTab === 'catalogo' ? 'Colección Privada' : activeTab === 'inventario' ? 'Inventario de Insumos' : activeTab === 'produccion' ? 'Órdenes de Producción' : 'Márgenes & Canales'}
            </h1>
          </div>
          
          <div style={{ display: 'flex', gap: '1rem' }}>
            {activeTab === 'catalogo' && (
              <button 
                onClick={handleOpenAddModal}
                className="btn btn-primary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <Plus size={16} /> Nuevo Producto
              </button>
            )}
            {activeTab === 'inventario' && (
              <>
                <button 
                  onClick={() => setShowCompraModal(true)}
                  className="btn btn-primary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  <Truck size={16} /> Registrar Compra
                </button>
                <button 
                  onClick={() => setShowAjusteModal(true)}
                  className="btn btn-outline"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  <Compass size={16} /> Ajustar Insumo
                </button>
              </>
            )}
            {activeTab === 'produccion' && (
              <button 
                onClick={() => setShowOPModal(true)}
                className="btn btn-primary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <Plus size={16} /> Planificar Lote (OP)
              </button>
            )}
          </div>
        </div>

        {/* Pestañas Operativas del Dashboard (Premium Quiet Luxury UI) */}
        <div style={{
          display: 'flex',
          gap: '2.5rem',
          borderBottom: '1px solid var(--color-border)',
          marginBottom: '4rem',
          paddingBottom: '0.1rem'
        }}>
          {[
            { id: 'catalogo', label: 'Catálogo de Productos', icon: <Package size={16} /> },
            { id: 'inventario', label: 'ERP & Inventario MP', icon: <Layers size={16} /> },
            { id: 'produccion', label: 'MRP & Producción (OP)', icon: <Wrench size={16} /> },
            { id: 'analitica', label: 'Analítica Comercial', icon: <BarChart3 size={16} /> }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                padding: '0.85rem 0',
                border: 'none',
                background: 'none',
                fontSize: '0.875rem',
                fontWeight: activeTab === tab.id ? 600 : 500,
                color: activeTab === tab.id ? 'var(--color-black)' : 'var(--color-text-secondary)',
                borderBottom: activeTab === tab.id ? '2px solid var(--color-gold-subtle)' : '2px solid transparent',
                cursor: 'pointer',
                transition: 'all 0.25s ease',
                marginTop: '1px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* ─── VISTA: CATÁLOGO DE PRODUCTOS ───────────────────────────────── */}
        {activeTab === 'catalogo' && (
          <>
            {/* Metrics Grid */}
            <div className="grid grid-cols-4" style={{ gap: '2rem', marginBottom: '5rem' }}>
              {[
                { label: 'Total Piezas', value: products.length, desc: 'Artículos en catálogo' },
                { label: 'Valor en Inventario', value: `$${products.reduce((acc, p) => acc + (p.price * p.stock), 0).toLocaleString()}`, desc: 'Total valor comercial' },
                { label: 'Unidades Disponibles', value: products.reduce((acc, p) => acc + p.stock, 0), desc: 'Stock físico total' },
                { label: 'Categorías Activas', value: new Set(products.map(p => p.categoryId)).size, desc: 'Familias de productos' }
              ].map((metric, i) => (
                <div key={i} style={{
                  backgroundColor: 'var(--color-white)',
                  padding: '2.5rem',
                  border: '1px solid var(--color-border)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  aspectRatio: '1.5/1'
                }}>
                  <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--color-text-secondary)' }}>
                    {metric.label}
                  </span>
                  <span className="text-serif" style={{ fontSize: '2.5rem', margin: '1rem 0 0.5rem 0', color: 'var(--color-black)' }}>
                    {metric.value}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', opacity: 0.8 }}>
                    {metric.desc}
                  </span>
                </div>
              ))}
            </div>

            {/* Products Table */}
            <div style={{ backgroundColor: 'var(--color-white)', border: '1px solid var(--color-border)', overflowX: 'auto' }}>
              {loading ? (
                <div style={{ padding: '6rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                  Cargando catálogo...
                </div>
              ) : products.length > 0 ? (
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--color-border)', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.1em', color: 'var(--color-text-secondary)' }}>
                      <th style={{ padding: '1.5rem 2rem' }}>Pieza</th>
                      <th style={{ padding: '1.5rem' }}>Referencia</th>
                      <th style={{ padding: '1.5rem' }}>Categoría</th>
                      <th style={{ padding: '1.5rem' }}>Filtros</th>
                      <th style={{ padding: '1.5rem' }}>Stock Consolidado</th>
                      <th style={{ padding: '1.5rem' }}>Precio Venta</th>
                      <th style={{ padding: '1.5rem 2rem', textAlign: 'right' }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((product) => (
                      <tr key={product.id} style={{ borderBottom: '1px solid var(--color-border)', transition: 'background-color 0.2s' }} className="admin-table-row">
                        <td style={{ padding: '1.5rem 2rem', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                          <img 
                            src={product.images[0] || 'https://via.placeholder.com/50x60?text=JC'} 
                            alt={product.name} 
                            style={{ width: '50px', height: '60px', objectFit: 'cover', backgroundColor: '#F5F5F5' }} 
                          />
                          <div>
                            <span className="text-serif" style={{ fontSize: '1.125rem', fontWeight: 500, color: 'var(--color-black)', display: 'block' }}>
                              {product.name}
                            </span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', display: 'block', marginTop: '0.25rem' }}>
                              {product.category}
                            </span>
                          </div>
                        </td>
                        <td style={{ padding: '1.5rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)', fontFamily: 'monospace' }}>
                          {product.ref}
                        </td>
                        <td style={{ padding: '1.5rem', fontSize: '0.875rem' }}>
                          <span style={{
                            padding: '0.25rem 0.5rem',
                            backgroundColor: 'var(--color-off-white)',
                            border: '1px solid var(--color-border)',
                            fontSize: '0.75rem',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em'
                          }}>
                            {product.categoryId}
                          </span>
                        </td>
                        <td style={{ padding: '1.5rem', fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                            <span>• Uso: {product.filters?.uso || 'N/A'}</span>
                            <span>• Color: {product.filters?.color || 'N/A'}</span>
                            <span>• Tamaño: {product.filters?.tamano || 'N/A'}</span>
                          </div>
                        </td>
                        <td style={{ padding: '1.5rem', fontSize: '0.875rem' }}>
                          <span style={{ 
                            fontWeight: 600,
                            color: product.stock === 0 ? '#C46A6A' : product.stock <= 3 ? 'var(--color-gold-subtle)' : 'var(--color-black)' 
                          }}>
                            {product.stock} u.
                          </span>
                        </td>
                        <td style={{ padding: '1.5rem', fontSize: '1rem', fontWeight: 500, color: 'var(--color-black)' }}>
                          ${product.price.toLocaleString()}
                        </td>
                        <td style={{ padding: '1.5rem 2rem', textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                            <button 
                              onClick={() => handleOpenEditModal(product)} 
                              aria-label="Editar"
                              style={{ color: 'var(--color-text-secondary)' }}
                              className="action-btn"
                            >
                              <Edit size={16} />
                            </button>
                            <button 
                              onClick={() => handleDeleteProduct(product.id)} 
                              aria-label="Eliminar"
                              style={{ color: '#D98888' }}
                              className="action-btn-danger"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div style={{ padding: '6rem 0', textAlign: 'center' }}>
                  <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1.5rem' }}>No hay piezas en el catálogo.</p>
                  <button onClick={handleOpenAddModal} className="btn btn-outline">Comenzar a Cargar</button>
                </div>
              )}
            </div>
          </>
        )}

        {/* ─── VISTA: ERP & INVENTARIO MP ─────────────────────────────────── */}
        {activeTab === 'inventario' && (
          <>
            {/* KPI ERP Grid */}
            <div className="grid grid-cols-4" style={{ gap: '2rem', marginBottom: '5rem' }}>
              {[
                { label: 'Valorización Almacén', value: formatCOP(kpiInventario?.valor_total_bodega || 0), desc: 'Total invertido en insumos (CPP)' },
                { label: 'Insumos Críticos', value: kpiInventario?.materias_criticas || 0, desc: 'Por debajo del stock mínimo', color: (kpiInventario?.materias_criticas || 0) > 0 ? '#C46A6A' : undefined },
                { label: 'Insumos en Alerta', value: kpiInventario?.materias_en_alerta || 0, desc: 'Cerca del nivel crítico', color: (kpiInventario?.materias_en_alerta || 0) > 0 ? 'var(--color-gold-subtle)' : undefined },
                { label: 'Catálogo de Insumos', value: kpiInventario?.total_materias_primas || 0, desc: 'Tipos de materias primas' }
              ].map((metric, i) => (
                <div key={i} style={{
                  backgroundColor: 'var(--color-white)',
                  padding: '2.5rem',
                  border: '1px solid var(--color-border)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  aspectRatio: '1.5/1'
                }}>
                  <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--color-text-secondary)' }}>
                    {metric.label}
                  </span>
                  <span className="text-serif" style={{ fontSize: '2.3rem', margin: '1rem 0 0.5rem 0', color: metric.color || 'var(--color-black)' }}>
                    {metric.value}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', opacity: 0.8 }}>
                    {metric.desc}
                  </span>
                </div>
              ))}
            </div>

            {/* Semáforo de Stock de Materias Primas */}
            <div style={{ marginBottom: '5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 className="text-serif" style={{ fontSize: '1.5rem', margin: 0, color: 'var(--color-black)' }}>
                  Semáforo de Materias Primas & Puntos de Inventario
                </h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Recalculado con Costo Promedio Ponderado (CPP)
                </span>
              </div>

              <div style={{ backgroundColor: 'var(--color-white)', border: '1px solid var(--color-border)', overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '850px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--color-border)', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.1em', color: 'var(--color-text-secondary)' }}>
                      <th style={{ padding: '1.5rem 2rem' }}>Material</th>
                      <th style={{ padding: '1.5rem' }}>SKU</th>
                      <th style={{ padding: '1.5rem' }}>U. Medida</th>
                      <th style={{ padding: '1.5rem' }}>Costo (CPP)</th>
                      <th style={{ padding: '1.5rem' }}>Stock Mínimo</th>
                      <th style={{ padding: '1.5rem' }}>Stock Total</th>
                      <th style={{ padding: '1.5rem' }}>Estado Semáforo</th>
                      <th style={{ padding: '1.5rem 2rem' }}>Detalle Bodegas</th>
                    </tr>
                  </thead>
                  <tbody>
                    {materiasPrimas.map((mp) => {
                      const semColor = mp.estado_semaforo === 'critico' ? '#C46A6A' : mp.estado_semaforo === 'alerta' ? '#D4AF37' : '#5E8C61';
                      const semBg = mp.estado_semaforo === 'critico' ? '#FAF2F2' : mp.estado_semaforo === 'alerta' ? '#FAF8EE' : '#F2FAF3';
                      return (
                        <tr key={mp.id} style={{ borderBottom: '1px solid var(--color-border)' }} className="admin-table-row">
                          <td style={{ padding: '1.5rem 2rem', fontWeight: 500, color: 'var(--color-black)' }}>
                            {mp.nombre}
                          </td>
                          <td style={{ padding: '1.5rem', fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                            {mp.sku}
                          </td>
                          <td style={{ padding: '1.5rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                            {mp.unidad_medida}
                          </td>
                          <td style={{ padding: '1.5rem', fontSize: '0.9rem', fontWeight: 500 }}>
                            {formatCOP(mp.costo_promedio_ponderado)}
                          </td>
                          <td style={{ padding: '1.5rem', fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>
                            {mp.stock_minimo}
                          </td>
                          <td style={{ padding: '1.5rem', fontSize: '0.95rem', fontWeight: 600 }}>
                            {mp.stock_total}
                          </td>
                          <td style={{ padding: '1.5rem' }}>
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.35rem',
                              padding: '0.25rem 0.65rem',
                              backgroundColor: semBg,
                              border: `1px solid ${semColor}44`,
                              borderRadius: '12px',
                              color: semColor,
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              textTransform: 'uppercase',
                              letterSpacing: '0.05em'
                            }}>
                              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: semColor }} />
                              {mp.estado_semaforo === 'critico' ? 'Crítico' : mp.estado_semaforo === 'alerta' ? 'Alerta' : 'Normal'}
                            </span>
                          </td>
                          <td style={{ padding: '1.5rem 2rem', fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                              {mp.inventario.length > 0 ? (
                                mp.inventario.map((inv, idx) => (
                                  <span key={idx} style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span>• {inv.bodega_nombre || 'Bodega'}:</span>
                                    <strong style={{ marginLeft: '1rem', color: 'var(--color-black)' }}>{inv.cantidad} u.</strong>
                                  </span>
                                ))
                              ) : (
                                <span>Sin stock físico registrado</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Bitácora de Trazabilidad */}
            <div>
              <h3 className="text-serif" style={{ fontSize: '1.5rem', marginBottom: '1.5rem', color: 'var(--color-black)' }}>
                Bitácora Operacional & Trazabilidad de Insumos
              </h3>
              <div style={{ backgroundColor: 'var(--color-white)', border: '1px solid var(--color-border)', overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '850px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--color-border)', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.1em', color: 'var(--color-text-secondary)' }}>
                      <th style={{ padding: '1.25rem 2rem' }}>Fecha</th>
                      <th style={{ padding: '1.25rem' }}>Tipo Movimiento</th>
                      <th style={{ padding: '1.25rem' }}>Insumo</th>
                      <th style={{ padding: '1.25rem' }}>Cantidad</th>
                      <th style={{ padding: '1.25rem' }}>Costo Unitario</th>
                      <th style={{ padding: '1.25rem' }}>Destino / Origen</th>
                      <th style={{ padding: '1.25rem 2rem' }}>Detalle / Observaciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {kpiInventario?.ultimos_movimientos && kpiInventario.ultimos_movimientos.length > 0 ? (
                      kpiInventario.ultimos_movimientos.map((mov) => {
                        const esEntrada = ['entrada_compra', 'ajuste_positivo'].includes(mov.tipo_movimiento);
                        return (
                          <tr key={mov.id} style={{ borderBottom: '1px solid var(--color-border)' }} className="admin-table-row">
                            <td style={{ padding: '1.25rem 2rem', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                              {new Date(mov.created_at ?? '').toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' })}
                            </td>
                            <td style={{ padding: '1.25rem', fontSize: '0.85rem' }}>
                              <span style={{
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em',
                                fontSize: '0.7rem',
                                padding: '0.15rem 0.45rem',
                                border: '1px solid var(--color-border)',
                                color: esEntrada ? '#5E8C61' : '#C46A6A',
                                backgroundColor: esEntrada ? '#F2FAF3' : '#FAF2F2'
                              }}>
                                {mov.tipo_movimiento.replace('_', ' ')}
                              </span>
                            </td>
                            <td style={{ padding: '1.25rem', fontSize: '0.9rem', fontWeight: 500 }}>
                              {mov.materia_prima_nombre} <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', fontFamily: 'monospace' }}>({mov.materia_prima_sku})</span>
                            </td>
                            <td style={{ padding: '1.25rem', fontSize: '0.9rem', fontWeight: 600, color: esEntrada ? '#5E8C61' : '#C46A6A' }}>
                              {esEntrada ? '+' : '-'}{mov.cantidad}
                            </td>
                            <td style={{ padding: '1.25rem', fontSize: '0.875rem' }}>
                              {mov.costo_unitario > 0 ? formatCOP(mov.costo_unitario) : '—'}
                            </td>
                            <td style={{ padding: '1.25rem', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                              {mov.bodega_destino_nombre || mov.bodega_origen_nombre || 'Taller Principal'}
                            </td>
                            <td style={{ padding: '1.25rem 2rem', fontSize: '0.85rem', color: 'var(--color-text-secondary)', fontStyle: 'italic' }}>
                              {mov.observaciones}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={7} style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                          No hay movimientos registrados.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* ─── VISTA: MRP & PRODUCCIÓN (OP) ───────────────────────────────── */}
        {activeTab === 'produccion' && (
          <>
            {/* KPI MRP Grid */}
            <div className="grid grid-cols-4" style={{ gap: '2rem', marginBottom: '5rem' }}>
              {[
                { label: 'Lotes Activos Taller', value: kpiProduccion?.ops_activas || 0, desc: 'Órdenes en corte, armado o acabados' },
                { label: 'Terminados en el Mes', value: kpiProduccion?.unidades_producidas_mes || 0, desc: 'Unidades ingresadas a producto final' },
                { label: 'Eficiencia Desperdicio', value: `${kpiProduccion?.eficiencia_desperdicio || 0}%`, desc: 'Rendimiento real vs estimado estándar' },
                { label: 'Artesanos Asignados', value: kpiProduccion?.artesanos_activos || 0, desc: 'Mano de obra artesanal en producción' }
              ].map((metric, i) => (
                <div key={i} style={{
                  backgroundColor: 'var(--color-white)',
                  padding: '2.5rem',
                  border: '1px solid var(--color-border)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  aspectRatio: '1.5/1'
                }}>
                  <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--color-text-secondary)' }}>
                    {metric.label}
                  </span>
                  <span className="text-serif" style={{ fontSize: '2.3rem', margin: '1rem 0 0.5rem 0', color: 'var(--color-black)' }}>
                    {metric.value}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', opacity: 0.8 }}>
                    {metric.desc}
                  </span>
                </div>
              ))}
            </div>

            {/* Órdenes de Producción Listado */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 className="text-serif" style={{ fontSize: '1.5rem', margin: 0, color: 'var(--color-black)' }}>
                  Plan Maestro de Producción Marroquinera (MRP)
                </h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Flujo Automatizado de Insumos
                </span>
              </div>

              <div style={{ backgroundColor: 'var(--color-white)', border: '1px solid var(--color-border)', overflowX: 'auto', marginBottom: '4rem' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '950px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--color-border)', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.1em', color: 'var(--color-text-secondary)' }}>
                      <th style={{ padding: '1.5rem 2rem' }}>Código OP</th>
                      <th style={{ padding: '1.5rem' }}>Pieza a Fabricar</th>
                      <th style={{ padding: '1.5rem' }}>Lote Solicitado</th>
                      <th style={{ padding: '1.5rem' }}>Avance Taller</th>
                      <th style={{ padding: '1.5rem' }}>Artesano</th>
                      <th style={{ padding: '1.5rem' }}>Estado Actual</th>
                      <th style={{ padding: '1.5rem' }}>Entrega Prometida</th>
                      <th style={{ padding: '1.5rem' }}>Desperdicios</th>
                      <th style={{ padding: '1.5rem 2rem', textAlign: 'right' }}>Gestión de Taller</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ordenesOP.length > 0 ? (
                      ordenesOP.map((op) => {
                        const estadoClases: Record<string, { color: string, bg: string }> = {
                          planificada: { color: 'var(--color-text-secondary)', bg: 'var(--color-off-white)' },
                          corte: { color: 'var(--color-gold-subtle)', bg: 'rgba(217, 200, 184, 0.15)' },
                          armado: { color: '#B89047', bg: '#FAF8EE' },
                          acabado: { color: '#8A5D3E', bg: '#FAF5EE' },
                          control_calidad: { color: '#4A8CBA', bg: '#F2F7FA' },
                          completada: { color: '#5E8C61', bg: '#F2FAF3' },
                          cancelada: { color: '#C46A6A', bg: '#FAF2F2' }
                        };
                        const est = estadoClases[op.estado] || estadoClases.planificada;
                        return (
                          <tr key={op.id} style={{ borderBottom: '1px solid var(--color-border)' }} className="admin-table-row">
                            <td style={{ padding: '1.5rem 2rem', fontFamily: 'monospace', fontWeight: 600, color: 'var(--color-black)' }}>
                              {op.codigo_op}
                            </td>
                            <td style={{ padding: '1.5rem' }}>
                              <span className="text-serif" style={{ fontSize: '1rem', fontWeight: 500, color: 'var(--color-black)', display: 'block' }}>
                                {op.producto_nombre}
                              </span>
                              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', fontFamily: 'monospace' }}>
                                SKU: {op.producto_ref}
                              </span>
                            </td>
                            <td style={{ padding: '1.5rem', fontSize: '0.9rem' }}>
                              {op.cantidad_solicitada} u.
                              {op.estado === 'completada' && (
                                <span style={{ display: 'block', fontSize: '0.75rem', color: '#5E8C61', fontWeight: 500 }}>
                                  ({op.cantidad_producida} aprobadas)
                                </span>
                              )}
                            </td>
                            <td style={{ padding: '1.5rem' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <div style={{ flex: 1, height: '4px', backgroundColor: 'var(--color-border)', minWidth: '60px' }}>
                                  <div style={{ height: '100%', width: `${op.porcentaje_avance}%`, backgroundColor: 'var(--color-gold-subtle)', transition: 'width 0.3s' }} />
                                </div>
                                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                                  {op.porcentaje_avance}%
                                </span>
                              </div>
                            </td>
                            <td style={{ padding: '1.5rem', fontSize: '0.875rem' }}>
                              {op.artesano_nombre}
                            </td>
                            <td style={{ padding: '1.5rem' }}>
                              <span style={{
                                padding: '0.2rem 0.5rem',
                                color: est.color,
                                backgroundColor: est.bg,
                                border: `1px solid ${est.color}33`,
                                fontSize: '0.7rem',
                                textTransform: 'uppercase',
                                fontWeight: 600,
                                letterSpacing: '0.05em'
                              }}>
                                {op.estado.replace('_', ' ')}
                              </span>
                            </td>
                            <td style={{ padding: '1.5rem', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                              {op.fecha_entrega_prometida || '—'}
                              {op.estado !== 'completada' && op.dias_restantes !== undefined && (
                                <span style={{ 
                                  display: 'block', 
                                  fontSize: '0.75rem', 
                                  color: op.dias_restantes <= 2 ? '#C46A6A' : 'var(--color-text-secondary)',
                                  fontWeight: op.dias_restantes <= 2 ? 600 : 'normal'
                                }}>
                                  ({op.dias_restantes} días restantes)
                                </span>
                              )}
                            </td>
                            <td style={{ padding: '1.5rem', fontSize: '0.85rem' }}>
                              {op.desperdicios_reportados && op.desperdicios_reportados.length > 0 ? (
                                <span style={{ color: '#C46A6A', fontWeight: 500 }}>
                                  {op.desperdicios_reportados.reduce((acc, d) => acc + Number(d.cantidad_desperdiciada), 0)} unidades de merma
                                </span>
                              ) : (
                                <span style={{ color: 'var(--color-text-secondary)', opacity: 0.6 }}>0 desperdicios</span>
                              )}
                            </td>
                            <td style={{ padding: '1.5rem 2rem', textAlign: 'right' }}>
                              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                {op.estado !== 'completada' && op.estado !== 'cancelada' && (
                                  <button
                                    onClick={() => handleAvanzarEstadoOP(op.id, op.estado as EstadoOP)}
                                    className="btn btn-outline"
                                    style={{
                                      fontSize: '0.75rem',
                                      padding: '0.35rem 0.65rem',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '0.3rem'
                                    }}
                                  >
                                    <Activity size={12} />
                                    Avanzar Flujo
                                  </button>
                                )}
                                {op.estado !== 'completada' && op.estado !== 'cancelada' && (
                                  <button
                                    onClick={() => {
                                      setDesperdicioOPId(op.id);
                                      setShowDesperdicioModal(true);
                                    }}
                                    className="btn btn-outline"
                                    style={{
                                      fontSize: '0.75rem',
                                      padding: '0.35rem 0.65rem',
                                      borderColor: '#D98888',
                                      color: '#C46A6A'
                                    }}
                                  >
                                    + Merma
                                  </button>
                                )}
                                {op.estado === 'completada' && (
                                  <span style={{ fontSize: '0.75rem', color: '#5E8C61', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                                    <CheckCircle2 size={14} /> Completada
                                  </span>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={9} style={{ padding: '4rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                          No hay órdenes de producción en el taller.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* ─── VISTA: ANALÍTICA COMERCIAL ─────────────────────────────────── */}
        {activeTab === 'analitica' && (
          <>
            {/* KPI Analítica */}
            <div className="grid grid-cols-3" style={{ gap: '2rem', marginBottom: '5rem' }}>
              {[
                { 
                  label: 'Margen Bruto Consolidado', 
                  value: formatCOP(analiticaCanal.reduce((acc, c) => acc + c.margen_bruto, 0)), 
                  desc: 'Rentabilidad real operativa del negocio' 
                },
                { 
                  label: 'Ingresos Totales', 
                  value: formatCOP(analiticaCanal.reduce((acc, c) => acc + c.ingresos, 0)), 
                  desc: 'Ventas brutas acumuladas por canales' 
                },
                { 
                  label: 'Costo Histórico de Ventas', 
                  value: formatCOP(analiticaCanal.reduce((acc, c) => acc + c.costo_historico, 0)), 
                  desc: 'Costo de los insumos y materias primas (BOM)' 
                }
              ].map((metric, i) => (
                <div key={i} style={{
                  backgroundColor: 'var(--color-white)',
                  padding: '2.5rem',
                  border: '1px solid var(--color-border)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  aspectRatio: '1.8/1'
                }}>
                  <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--color-text-secondary)' }}>
                    {metric.label}
                  </span>
                  <span className="text-serif" style={{ fontSize: '2.3rem', margin: '1rem 0 0.5rem 0', color: 'var(--color-black)' }}>
                    {metric.value}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', opacity: 0.8 }}>
                    {metric.desc}
                  </span>
                </div>
              ))}
            </div>

            {/* Gráficos de Canales de Venta */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '3rem', marginBottom: '5rem' }}>
              
              {/* Gráfico Barras Nativas CSS Canales */}
              <div style={{ backgroundColor: 'var(--color-white)', border: '1px solid var(--color-border)', padding: '3rem' }}>
                <h3 className="text-serif" style={{ fontSize: '1.5rem', marginBottom: '2.5rem', color: 'var(--color-black)' }}>
                  Rentabilidad Comparativa por Canal de Venta
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
                  {analiticaCanal.map((canal, idx) => {
                    const canalNombres: Record<string, string> = {
                      e_commerce: 'Tienda en Línea E-Commerce',
                      showroom: 'Showroom de Lujo / Diseño',
                      mayorista: 'Venta Mayorista / Corporativa'
                    };
                    const maxVal = Math.max(...analiticaCanal.map(c => c.ingresos));
                    const ingresosPct = (canal.ingresos / maxVal) * 100;
                    const costoPct = (canal.costo_historico / maxVal) * 100;

                    return (
                      <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--color-black)' }}>
                            {canalNombres[canal.canal] || canal.canal}
                          </span>
                          <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                            {canal.total_ventas} transacciones • {canal.total_unidades} piezas vendidas
                          </span>
                        </div>

                        {/* Barra Ingresos */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          <div style={{ flex: 1, backgroundColor: 'var(--color-off-white)', height: '14px', borderRadius: '2px', overflow: 'hidden', position: 'relative' }}>
                            <div style={{ width: `${ingresosPct}%`, height: '100%', backgroundColor: 'var(--color-gold-subtle)' }} />
                            <div style={{ width: `${costoPct}%`, height: '100%', backgroundColor: 'rgba(26, 26, 26, 0.45)', position: 'absolute', top: 0, left: 0 }} />
                          </div>
                          
                          <div style={{ width: '160px', textAlign: 'right', fontSize: '0.875rem' }}>
                            <span style={{ fontWeight: 600, color: 'var(--color-black)' }}>{formatCOP(canal.ingresos)}</span>
                            <span style={{ display: 'block', fontSize: '0.75rem', color: '#5E8C61', fontWeight: 600 }}>
                              Margen: {canal.margen_porcentaje.toFixed(1)}%
                            </span>
                          </div>
                        </div>
                        
                        <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '0.1rem' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <span style={{ width: '8px', height: '8px', backgroundColor: 'var(--color-gold-subtle)' }} /> Ventas Brutas
                          </span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <span style={{ width: '8px', height: '8px', backgroundColor: 'rgba(26, 26, 26, 0.45)' }} /> Costo Histórico (BOM)
                          </span>
                          <span>Margen Bruto: <strong>{formatCOP(canal.margen_bruto)}</strong></span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Distribución por Puntos de Venta Físicos */}
              <div style={{ backgroundColor: 'var(--color-white)', border: '1px solid var(--color-border)', padding: '3rem' }}>
                <h3 className="text-serif" style={{ fontSize: '1.5rem', marginBottom: '2rem', color: 'var(--color-black)' }}>
                  Bodegas & Puntos
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', lineHeight: '1.5rem', marginBottom: '2rem' }}>
                  Distribución física de las materias primas controladas por el sistema ERP.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  {bodegas.map((bod) => {
                    const mpStock = materiasPrimas.reduce((acc, mp) => {
                      const found = mp.inventario.find(i => i.bodega_id === bod.id);
                      return acc + (found?.cantidad || 0);
                    }, 0);
                    const mpValor = materiasPrimas.reduce((acc, mp) => {
                      const found = mp.inventario.find(i => i.bodega_id === bod.id);
                      return acc + ((found?.cantidad || 0) * (mp.costo_promedio_ponderado ?? 0));
                    }, 0);

                    return (
                      <div key={bod.id} style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: '1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                          <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--color-black)' }}>
                            {bod.nombre}
                          </span>
                          <span style={{
                            fontSize: '0.65rem',
                            padding: '0.15rem 0.35rem',
                            border: '1px solid var(--color-border)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em'
                          }}>
                            {bod.tipo.replace('_', ' ')}
                          </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                          <span>Insumos Totales: <strong>{mpStock} u.</strong></span>
                          <span>Valorización: <strong>{formatCOP(mpValor)}</strong></span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          </>
        )}

      </div>

      {/* Modern High-End Editorial Modal: PRODUCTO */}
      {showModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(26,26,26,0.3)',
          backdropFilter: 'blur(4px)',
          zIndex: 2000,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '2rem'
        }} onClick={() => setShowModal(false)}>
          <div 
            style={{
              backgroundColor: 'var(--color-white)',
              width: '100%',
              maxWidth: '850px',
              maxHeight: '90vh',
              overflowY: 'auto',
              position: 'relative',
              padding: '3.5rem 4rem',
              boxShadow: '0 20px 50px rgba(0,0,0,0.08)'
            }}
            onClick={(e) => e.stopPropagation()}
            className="animate-fade-in"
          >
            {/* Close Button */}
            <button 
              onClick={() => setShowModal(false)}
              style={{ position: 'absolute', top: '2rem', right: '2rem', color: 'var(--color-text-secondary)' }}
            >
              <X size={24} />
            </button>

            <span style={{ textTransform: 'uppercase', letterSpacing: '0.15em', fontSize: '0.75rem', color: 'var(--color-gold-subtle)', fontWeight: 600 }}>
              Formulario de Creación
            </span>
            <h2 className="text-serif" style={{ fontSize: '2.5rem', marginTop: '0.5rem', marginBottom: '2.5rem', color: 'var(--color-black)' }}>
              {editingProduct ? 'Editar Ficha' : 'Nueva Pieza'}
            </h2>

            {error && (
              <div style={{
                backgroundColor: '#FAF5F5',
                borderLeft: '2px solid #D98888',
                color: '#8A3E3E',
                padding: '1rem',
                fontSize: '0.875rem',
                marginBottom: '2rem'
              }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              
              {/* Image Drag & Drop Gallery Section */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-secondary)', fontWeight: 500 }}>
                  Galería de Fotos
                </span>
                
                {/* Drag and Drop Zone */}
                <div 
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    border: dragActive ? '1px dashed var(--color-gold-subtle)' : '1px dashed var(--color-border)',
                    backgroundColor: dragActive ? 'rgba(217, 200, 184, 0.15)' : 'var(--color-off-white)',
                    padding: '3rem 2rem',
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '1rem'
                  }}
                >
                  <input 
                    ref={fileInputRef}
                    type="file" 
                    multiple
                    accept="image/*" 
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                  />
                  <Upload size={32} strokeWidth={1} style={{ color: 'var(--color-gold-subtle)' }} />
                  <div>
                    <p style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-black)' }}>
                      {uploadingImages ? 'Optimizando y cargando archivos...' : 'Arrastra múltiples imágenes o haz clic para buscar'}
                    </p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>
                      Soporta JPG y PNG. Se optimizarán automáticamente en caliente a menos de ~300KB.
                    </p>
                  </div>
                </div>

                {/* Previews and Image Management */}
                {images.length > 0 && (
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(5, 1fr)',
                    gap: '1rem',
                    marginTop: '1rem'
                  }}>
                    {images.map((imgUrl, index) => (
                      <div 
                        key={index} 
                        style={{
                          position: 'relative',
                          aspectRatio: '4/5',
                          border: index === 0 ? '1px solid var(--color-gold-subtle)' : '1px solid var(--color-border)',
                          backgroundColor: '#F5F5F5',
                          overflow: 'hidden'
                        }}
                      >
                        <img 
                          src={imgUrl} 
                          alt={`Product preview ${index + 1}`} 
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                        />
                        
                        {/* Primary Badge */}
                        {index === 0 && (
                          <span style={{
                            position: 'absolute',
                            bottom: '0.25rem',
                            left: '0.25rem',
                            backgroundColor: 'var(--color-gold-subtle)',
                            color: 'var(--color-white)',
                            fontSize: '0.55rem',
                            padding: '0.1rem 0.35rem',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em'
                          }}>
                            Principal
                          </span>
                        )}

                        {/* Dropdown Options or Quick Actions */}
                        <div style={{
                          position: 'absolute',
                          top: '0.25rem',
                          right: '0.25rem',
                          display: 'flex',
                          gap: '0.25rem'
                        }}>
                          {index > 0 && (
                            <button
                              type="button"
                              onClick={() => handleSetPrimaryImage(index)}
                              title="Hacer Principal"
                              style={{
                                width: '20px',
                                height: '20px',
                                borderRadius: '50%',
                                backgroundColor: 'rgba(255,255,255,0.9)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '0.6rem',
                                color: 'var(--color-black)'
                              }}
                            >
                              ★
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(index)}
                            style={{
                              width: '20px',
                              height: '20px',
                              borderRadius: '50%',
                              backgroundColor: 'rgba(255,255,255,0.9)',
                              color: '#D98888',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '0.75rem'
                            }}
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Standard Information */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '2rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label htmlFor="prod-name" style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-secondary)' }}>
                    Nombre del Producto
                  </label>
                  <input
                    id="prod-name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Classic Shoulder Bag"
                    className="modal-input"
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label htmlFor="prod-ref" style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-secondary)' }}>
                    Referencia / SKU
                  </label>
                  <input
                    id="prod-ref"
                    type="text"
                    required
                    value={refCode}
                    onChange={(e) => setRefCode(e.target.value)}
                    placeholder="JC-SADDLE-09"
                    className="modal-input"
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label htmlFor="prod-price" style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-secondary)' }}>
                    Precio Comercial (USD)
                  </label>
                  <input
                    id="prod-price"
                    type="number"
                    required
                    min={0}
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    placeholder="250"
                    className="modal-input"
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label htmlFor="prod-stock" style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-secondary)' }}>
                    Stock / Unidades
                  </label>
                  <input
                    id="prod-stock"
                    type="number"
                    required
                    min={0}
                    value={stock}
                    onChange={(e) => setStock(Number(e.target.value))}
                    placeholder="10"
                    className="modal-input"
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label htmlFor="prod-cat" style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-secondary)' }}>
                    Categoría (Nombre Visual)
                  </label>
                  <input
                    id="prod-cat"
                    type="text"
                    required
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="Tote Bags"
                    className="modal-input"
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label htmlFor="prod-cat-id" style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-secondary)' }}>
                    Identificador de Categoría
                  </label>
                  <select
                    id="prod-cat-id"
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="modal-input"
                    style={{ borderBottom: '1px solid var(--color-border)' }}
                  >
                    <option value="bolsos">Bolsos</option>
                    <option value="billeteras">Billeteras</option>
                    <option value="cosmetiqueras">Cosmetiqueras</option>
                  </select>
                </div>
              </div>

              {/* Description */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label htmlFor="prod-desc" style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-secondary)' }}>
                  Descripción Editorial del Producto
                </label>
                <textarea
                  id="prod-desc"
                  required
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Escribe la historia de esta maravillosa pieza..."
                  className="modal-input"
                  style={{ resize: 'none', border: '1px solid var(--color-border)', padding: '0.75rem', backgroundColor: 'var(--color-off-white)' }}
                />
              </div>

              {/* Quiet Luxury Advanced Filters */}
              <div style={{
                backgroundColor: 'var(--color-off-white)',
                border: '1px solid var(--color-border)',
                padding: '2rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.5rem'
              }}>
                <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, color: 'var(--color-black)' }}>
                  Filtros de Catálogo Avanzados
                </span>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label htmlFor="filter-uso" style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-secondary)' }}>
                      Ocasión / Uso
                    </label>
                    <select
                      id="filter-uso"
                      value={filterUso}
                      onChange={(e) => setFilterUso(e.target.value as any)}
                      className="modal-input"
                      style={{ borderBottom: '1px solid var(--color-border)' }}
                    >
                      <option value="Diario">Diario</option>
                      <option value="Noche">Noche</option>
                      <option value="Viaje">Viaje</option>
                      <option value="Formal">Formal</option>
                    </select>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label htmlFor="filter-tamano" style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-secondary)' }}>
                      Tamaño de Pieza
                    </label>
                    <select
                      id="filter-tamano"
                      value={filterTamano}
                      onChange={(e) => setFilterTamano(e.target.value as any)}
                      className="modal-input"
                      style={{ borderBottom: '1px solid var(--color-border)' }}
                    >
                      <option value="Mini">Mini</option>
                      <option value="Mediano">Mediano</option>
                      <option value="Grande">Grande</option>
                    </select>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label htmlFor="filter-color" style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-secondary)' }}>
                      Color de Piel
                    </label>
                    <select
                      id="filter-color"
                      value={filterColor}
                      onChange={(e) => setFilterColor(e.target.value as any)}
                      className="modal-input"
                      style={{ borderBottom: '1px solid var(--color-border)' }}
                    >
                      <option value="Negro Onyx">Negro Onyx</option>
                      <option value="Cognac">Cognac</option>
                      <option value="Beige">Beige</option>
                      <option value="Off-White">Off-White</option>
                      <option value="Gold">Gold</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Bullet Features List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-secondary)', fontWeight: 500 }}>
                    Características Destacadas
                  </span>
                  <button 
                    type="button" 
                    onClick={handleAddFeatureField}
                    style={{ fontSize: '0.75rem', color: 'var(--color-gold-subtle)', textDecoration: 'underline' }}
                  >
                    + Agregar Fila
                  </button>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {features.map((feature, index) => (
                    <div key={index} style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                      <input
                        type="text"
                        value={feature}
                        onChange={(e) => handleFeatureChange(index, e.target.value)}
                        placeholder="Ej. Cuero de plena flor de origen ético"
                        className="modal-input"
                        style={{ flex: 1 }}
                      />
                      <button 
                        type="button" 
                        onClick={() => handleRemoveFeatureField(index)}
                        style={{ color: '#D98888' }}
                      >
                        Eliminar
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '1.5rem', marginTop: '1.5rem', borderTop: '1px solid var(--color-border)', paddingTop: '2.5rem' }}>
                <button
                  type="submit"
                  disabled={uploadingImages}
                  className="btn btn-primary"
                  style={{ flex: 1 }}
                >
                  {uploadingImages ? 'Cargando...' : editingProduct ? 'Guardar Cambios' : 'Lanzar Pieza'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn btn-outline"
                  style={{ flex: 1 }}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 1: Registrar Entrada Compra (ERP) */}
      {showCompraModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(26,26,26,0.3)',
          backdropFilter: 'blur(4px)',
          zIndex: 2000,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '2rem'
        }} onClick={() => setShowCompraModal(false)}>
          <div 
            style={{
              backgroundColor: 'var(--color-white)',
              width: '100%',
              maxWidth: '550px',
              padding: '3rem 3.5rem',
              boxShadow: '0 20px 50px rgba(0,0,0,0.08)',
              position: 'relative'
            }}
            onClick={(e) => e.stopPropagation()}
            className="animate-fade-in"
          >
            <button 
              onClick={() => setShowCompraModal(false)}
              style={{ position: 'absolute', top: '2rem', right: '2rem', color: 'var(--color-text-secondary)' }}
            >
              <X size={20} />
            </button>
            <span style={{ textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '0.75rem', color: 'var(--color-gold-subtle)', fontWeight: 600 }}>
              Operación ERP
            </span>
            <h2 className="text-serif" style={{ fontSize: '2rem', marginTop: '0.25rem', marginBottom: '2rem', color: 'var(--color-black)' }}>
              Entrada por Compra
            </h2>

            <form onSubmit={handleRegistrarCompra} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-secondary)' }}>
                  Materia Prima / Insumo
                </label>
                <select
                  value={compraMPId}
                  onChange={(e) => setCompraMPId(e.target.value)}
                  className="modal-input"
                  style={{ borderBottom: '1px solid var(--color-border)', width: '100%' }}
                >
                  {materiasPrimas.map(m => (
                    <option key={m.id} value={m.id}>{m.nombre} ({m.sku})</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-secondary)' }}>
                  Bodega Destino
                </label>
                <select
                  value={compraBodegaId}
                  onChange={(e) => setCompraBodegaId(e.target.value)}
                  className="modal-input"
                  style={{ borderBottom: '1px solid var(--color-border)', width: '100%' }}
                >
                  {bodegas.map(b => (
                    <option key={b.id} value={b.id}>{b.nombre} ({b.tipo.replace('_', ' ')})</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-secondary)' }}>
                    Cantidad Recibida
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={compraCantidad === 0 ? '' : compraCantidad}
                    onChange={(e) => setCompraCantidad(Number(e.target.value))}
                    placeholder="Ej. 150"
                    className="modal-input"
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-secondary)' }}>
                    Costo Unitario (COP)
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={compraCosto === 0 ? '' : compraCosto}
                    onChange={(e) => setCompraCosto(Number(e.target.value))}
                    placeholder="Ej. 8500"
                    className="modal-input"
                  />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-secondary)' }}>
                  Número de Factura / Compra
                </label>
                <input
                  type="text"
                  value={compraFactura}
                  onChange={(e) => setCompraFactura(e.target.value)}
                  placeholder="Ej. FACT-9872"
                  className="modal-input"
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-secondary)' }}>
                  Observaciones
                </label>
                <input
                  type="text"
                  value={compraObs}
                  onChange={(e) => setCompraObs(e.target.value)}
                  placeholder="Ej. Piel de becerro Cognac, excelente grano..."
                  className="modal-input"
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  Registrar Entrada (CPP)
                </button>
                <button type="button" onClick={() => setShowCompraModal(false)} className="btn btn-outline" style={{ flex: 1 }}>
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Ajuste de Inventario (ERP) */}
      {showAjusteModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(26,26,26,0.3)',
          backdropFilter: 'blur(4px)',
          zIndex: 2000,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '2rem'
        }} onClick={() => setShowAjusteModal(false)}>
          <div 
            style={{
              backgroundColor: 'var(--color-white)',
              width: '100%',
              maxWidth: '550px',
              padding: '3rem 3.5rem',
              boxShadow: '0 20px 50px rgba(0,0,0,0.08)',
              position: 'relative'
            }}
            onClick={(e) => e.stopPropagation()}
            className="animate-fade-in"
          >
            <button 
              onClick={() => setShowAjusteModal(false)}
              style={{ position: 'absolute', top: '2rem', right: '2rem', color: 'var(--color-text-secondary)' }}
            >
              <X size={20} />
            </button>
            <span style={{ textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '0.75rem', color: 'var(--color-gold-subtle)', fontWeight: 600 }}>
              Operación ERP
            </span>
            <h2 className="text-serif" style={{ fontSize: '2rem', marginTop: '0.25rem', marginBottom: '2rem', color: 'var(--color-black)' }}>
              Ajuste de Stock Manual
            </h2>

            <form onSubmit={handleRegistrarAjuste} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-secondary)' }}>
                  Materia Prima / Insumo
                </label>
                <select
                  value={ajusteMPId}
                  onChange={(e) => setAjusteMPId(e.target.value)}
                  className="modal-input"
                  style={{ borderBottom: '1px solid var(--color-border)', width: '100%' }}
                >
                  {materiasPrimas.map(m => (
                    <option key={m.id} value={m.id}>{m.nombre} ({m.sku})</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-secondary)' }}>
                  Bodega de Afectación
                </label>
                <select
                  value={ajusteBodegaId}
                  onChange={(e) => setAjusteBodegaId(e.target.value)}
                  className="modal-input"
                  style={{ borderBottom: '1px solid var(--color-border)', width: '100%' }}
                >
                  {bodegas.map(b => (
                    <option key={b.id} value={b.id}>{b.nombre} ({b.tipo.replace('_', ' ')})</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '1.5rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-secondary)' }}>
                    Cantidad
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={ajusteCantidad === 0 ? '' : ajusteCantidad}
                    onChange={(e) => setAjusteCantidad(Number(e.target.value))}
                    placeholder="Ej. 20"
                    className="modal-input"
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-secondary)' }}>
                    Tipo de Ajuste
                  </label>
                  <select
                    value={ajusteTipo}
                    onChange={(e) => setAjusteTipo(e.target.value as any)}
                    className="modal-input"
                    style={{ borderBottom: '1px solid var(--color-border)' }}
                  >
                    <option value="ajuste_positivo">Incrementar (+)</option>
                    <option value="ajuste_negativo">Disminuir (-)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-secondary)' }}>
                  Observaciones / Justificación
                </label>
                <input
                  type="text"
                  required
                  value={ajusteObs}
                  onChange={(e) => setAjusteObs(e.target.value)}
                  placeholder="Ej. Cuadre físico semanal de stock..."
                  className="modal-input"
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  Aplicar Ajuste
                </button>
                <button type="button" onClick={() => setShowAjusteModal(false)} className="btn btn-outline" style={{ flex: 1 }}>
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Planificar OP (MRP) */}
      {showOPModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(26,26,26,0.3)',
          backdropFilter: 'blur(4px)',
          zIndex: 2000,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '2rem'
        }} onClick={() => setShowOPModal(false)}>
          <div 
            style={{
              backgroundColor: 'var(--color-white)',
              width: '100%',
              maxWidth: '550px',
              padding: '3rem 3.5rem',
              boxShadow: '0 20px 50px rgba(0,0,0,0.08)',
              position: 'relative'
            }}
            onClick={(e) => e.stopPropagation()}
            className="animate-fade-in"
          >
            <button 
              onClick={() => setShowOPModal(false)}
              style={{ position: 'absolute', top: '2rem', right: '2rem', color: 'var(--color-text-secondary)' }}
            >
              <X size={20} />
            </button>
            <span style={{ textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '0.75rem', color: 'var(--color-gold-subtle)', fontWeight: 600 }}>
              Operación MRP
            </span>
            <h2 className="text-serif" style={{ fontSize: '2rem', marginTop: '0.25rem', marginBottom: '2rem', color: 'var(--color-black)' }}>
              Planificar Producción (OP)
            </h2>

            <form onSubmit={handleCrearOP} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-secondary)' }}>
                  Producto a Fabricar
                </label>
                <select
                  value={opProductoId}
                  onChange={(e) => setOpProductoId(e.target.value)}
                  className="modal-input"
                  style={{ borderBottom: '1px solid var(--color-border)', width: '100%' }}
                >
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} (Ref: {p.ref})</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-secondary)' }}>
                    Cantidad de Lote
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={opCantidad}
                    onChange={(e) => setOpCantidad(Number(e.target.value))}
                    className="modal-input"
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-secondary)' }}>
                    Bodega Destino
                  </label>
                  <select
                    value={opBodegaDestinoId}
                    onChange={(e) => setOpBodegaDestinoId(e.target.value)}
                    className="modal-input"
                    style={{ borderBottom: '1px solid var(--color-border)', width: '100%' }}
                  >
                    {bodegas.filter(b => b.tipo === 'punto_venta_fisico' || b.tipo === 'taller_artesanal').map(b => (
                      <option key={b.id} value={b.id}>{b.nombre}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-secondary)' }}>
                  Artesano Responsable
                </label>
                <select
                  value={opArtesanoId}
                  onChange={(e) => setOpArtesanoId(e.target.value)}
                  className="modal-input"
                  style={{ borderBottom: '1px solid var(--color-border)', width: '100%' }}
                >
                  <option value="">Seleccionar Artesano...</option>
                  <option value="art1">John Callas (Maestro Marroquinero)</option>
                  <option value="art2">Mateo Sierra (Cortador Especialista)</option>
                  <option value="art3">Gabriela Vega (Costurera de Precisión)</option>
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-secondary)' }}>
                  Fecha Entrega Prometida
                </label>
                <input
                  type="date"
                  required
                  value={opFechaEntrega}
                  onChange={(e) => setOpFechaEntrega(e.target.value)}
                  className="modal-input"
                  style={{ borderBottom: '1px solid var(--color-border)' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  Planificar Lote (MRP)
                </button>
                <button type="button" onClick={() => setShowOPModal(false)} className="btn btn-outline" style={{ flex: 1 }}>
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 4: Reportar Desperdicios / Mermas de Producción (MRP) */}
      {showDesperdicioModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(26,26,26,0.3)',
          backdropFilter: 'blur(4px)',
          zIndex: 2000,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '2rem'
        }} onClick={() => setShowDesperdicioModal(false)}>
          <div 
            style={{
              backgroundColor: 'var(--color-white)',
              width: '100%',
              maxWidth: '500px',
              padding: '3rem 3.5rem',
              boxShadow: '0 20px 50px rgba(0,0,0,0.08)',
              position: 'relative'
            }}
            onClick={(e) => e.stopPropagation()}
            className="animate-fade-in"
          >
            <button 
              onClick={() => setShowDesperdicioModal(false)}
              style={{ position: 'absolute', top: '2rem', right: '2rem', color: 'var(--color-text-secondary)' }}
            >
              <X size={20} />
            </button>
            <span style={{ textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '0.75rem', color: '#C46A6A', fontWeight: 600 }}>
              Control de Merma (MRP)
            </span>
            <h2 className="text-serif" style={{ fontSize: '1.8rem', marginTop: '0.25rem', marginBottom: '2rem', color: 'var(--color-black)' }}>
              Reportar Desperdicio Real
            </h2>

            <form onSubmit={handleReportarDesperdicio} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-secondary)' }}>
                  Insumo Afectado
                </label>
                <select
                  value={desperdicioMPId}
                  onChange={(e) => setDesperdicioMPId(e.target.value)}
                  className="modal-input"
                  style={{ borderBottom: '1px solid var(--color-border)', width: '100%' }}
                >
                  {materiasPrimas.map(m => (
                    <option key={m.id} value={m.id}>{m.nombre} ({m.sku})</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-secondary)' }}>
                  Cantidad Desperdiciada (Unidades/Medida)
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  value={desperdicioCantidad === 0 ? '' : desperdicioCantidad}
                  onChange={(e) => setDesperdicioCantidad(Number(e.target.value))}
                  placeholder="Ej. 10"
                  className="modal-input"
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-secondary)' }}>
                  Motivo de Desperdicio (Trazabilidad)
                </label>
                <select
                  value={desperdicioMotivo}
                  onChange={(e) => setDesperdicioMotivo(e.target.value)}
                  required
                  className="modal-input"
                  style={{ borderBottom: '1px solid var(--color-border)', width: '100%' }}
                >
                  <option value="">Seleccionar motivo...</option>
                  <option value="Fallo en corte de piel (Cicatriz o defecto natural)">Defecto natural de piel</option>
                  <option value="Merma en troquelado">Merma en troquelado</option>
                  <option value="Error de costura (Reproceso de pieza)">Error de costura</option>
                  <option value="Herraje rayado (Control Calidad)">Herraje defectuoso</option>
                  <option value="Excedente de lino estándar">Excedente estándar</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, backgroundColor: '#C46A6A', borderColor: '#C46A6A' }}>
                  Confirmar Desperdicio
                </button>
                <button type="button" onClick={() => setShowDesperdicioModal(false)} className="btn btn-outline" style={{ flex: 1 }}>
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Styling */}
      <style>{`
        .modal-input {
          padding: 0.75rem 0;
          border: none;
          border-bottom: 1px solid var(--color-border);
          background-color: transparent;
          outline: none;
          font-size: 1rem;
          font-family: var(--font-sans);
          transition: border-color var(--transition-fast);
        }
        .modal-input:focus {
          border-bottom-color: var(--color-black) !important;
        }
        .admin-table-row:hover {
          background-color: var(--color-off-white);
        }
        .action-btn {
          opacity: 0.6;
          transition: all 0.2s;
        }
        .action-btn:hover {
          opacity: 1;
          color: var(--color-black) !important;
        }
        .action-btn-danger {
          opacity: 0.6;
          transition: all 0.2s;
        }
        .action-btn-danger:hover {
          opacity: 1;
        }
        @media (max-width: 900px) {
          .grid-cols-4 { grid-template-columns: repeat(2, 1fr) !important; }
          .grid-cols-3 { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 600px) {
          .grid-cols-4 { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
};

export default AdminDashboard;

