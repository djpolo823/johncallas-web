-- Habilitar extensión UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =========================================================================
-- 1. ESTRUCTURA DE SEGURIDAD Y ROLES
-- =========================================================================

CREATE TABLE IF NOT EXISTS public.roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    codigo VARCHAR(50) UNIQUE NOT NULL, -- 'admin', 'artesano', 'inventario', 'vendedor', 'cliente'
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    nombre VARCHAR(255),
    avatar_url TEXT,
    role_id UUID REFERENCES public.roles(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Asegurar compatibilidad si la tabla profiles ya existía en el sandbox de Supabase
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role_id UUID REFERENCES public.roles(id) ON DELETE RESTRICT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS nombre VARCHAR(255);


-- =========================================================================
-- 2. CADENA DE SUMINISTROS (ERP/MRP BÁSICO)
-- =========================================================================

CREATE TABLE IF NOT EXISTS public.proveedores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(255) NOT NULL,
    nit_rut VARCHAR(50) UNIQUE NOT NULL,
    contacto_nombre VARCHAR(155),
    telefono VARCHAR(50),
    email VARCHAR(255),
    direccion TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.bodegas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(155) NOT NULL,
    ubicacion TEXT,
    tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('central', 'taller', 'satelite', 'showroom')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.materia_prima (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sku VARCHAR(100) UNIQUE NOT NULL,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    unidad_medida VARCHAR(20) NOT NULL, -- 'dm2', 'unidad', 'metros', 'litros'
    stock_minimo NUMERIC(12,4) DEFAULT 0.0000,
    costo_promedio_ponderado NUMERIC(12,2) DEFAULT 0.00,
    proveedor_preferido_id UUID REFERENCES public.proveedores(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.inventario_materia_prima (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    materia_prima_id UUID NOT NULL REFERENCES public.materia_prima(id) ON DELETE CASCADE,
    bodega_id UUID NOT NULL REFERENCES public.bodegas(id) ON DELETE CASCADE,
    cantidad NUMERIC(12,4) NOT NULL DEFAULT 0.0000,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(materia_prima_id, bodega_id)
);

-- =========================================================================
-- 3. INGENIERÍA DE PRODUCTO (BOM) & COMERCIALIZACIÓN
-- =========================================================================

CREATE TABLE IF NOT EXISTS public.productos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ref_sku VARCHAR(100) UNIQUE NOT NULL,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    categoria VARCHAR(100) NOT NULL, -- 'Bolsos', 'Billeteras', 'Accesorios'
    categoria_id VARCHAR(100) NOT NULL, -- 'bolsos', 'billeteras', 'accesorios'
    costo_calculado_bom NUMERIC(12,2) DEFAULT 0.00,
    costo_mano_obra NUMERIC(12,2) DEFAULT 0.00,
    margen_deseado NUMERIC(5,4) DEFAULT 0.7000, -- Margen (ej. 70% = 0.7000)
    precio_venta NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    precio_mayoreo NUMERIC(12,2) DEFAULT 0.00,
    imagenes TEXT[] NOT NULL, -- URLs
    filtros JSONB NOT NULL DEFAULT '{}'::jsonb, -- Quiet Luxury details
    bajo_pedido BOOLEAN DEFAULT false, -- Made to Order
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.inventario_productos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    producto_id UUID NOT NULL REFERENCES public.productos(id) ON DELETE CASCADE,
    bodega_id UUID NOT NULL REFERENCES public.bodegas(id) ON DELETE CASCADE,
    cantidad_disponible INT NOT NULL DEFAULT 0,
    cantidad_reservada INT NOT NULL DEFAULT 0,
    UNIQUE(producto_id, bodega_id)
);

CREATE TABLE IF NOT EXISTS public.ficha_tecnica_bom (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    producto_id UUID NOT NULL REFERENCES public.productos(id) ON DELETE CASCADE,
    materia_prima_id UUID NOT NULL REFERENCES public.materia_prima(id) ON DELETE RESTRICT,
    cantidad_requerida NUMERIC(12,4) NOT NULL,
    porcentaje_desperdicio_estandar NUMERIC(5,4) DEFAULT 0.1500, -- 15% desperdicio estándar
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(producto_id, materia_prima_id)
);

-- =========================================================================
-- 4. VENTAS E HISTORIALES
-- =========================================================================

CREATE TABLE IF NOT EXISTS public.ventas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cliente_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    numero_factura VARCHAR(100) UNIQUE NOT NULL,
    fecha_venta TIMESTAMPTZ DEFAULT NOW(),
    canal_venta VARCHAR(50) NOT NULL CHECK (canal_venta IN ('e_commerce', 'showroom', 'mayorista')),
    subtotal NUMERIC(12,2) NOT NULL,
    descuento NUMERIC(12,2) DEFAULT 0.00,
    impuestos NUMERIC(12,2) DEFAULT 0.00,
    total NUMERIC(12,2) NOT NULL,
    costo_historico_total NUMERIC(12,2) NOT NULL,
    estado VARCHAR(50) NOT NULL DEFAULT 'procesando' CHECK (estado IN ('pendiente', 'procesando', 'en_produccion', 'enviado', 'entregado', 'cancelado')),
    metodo_pago VARCHAR(100),
    transaccion_id VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.detalle_venta (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    venta_id UUID NOT NULL REFERENCES public.ventas(id) ON DELETE CASCADE,
    producto_id UUID NOT NULL REFERENCES public.productos(id) ON DELETE RESTRICT,
    cantidad INT NOT NULL CHECK (cantidad > 0),
    precio_unitario NUMERIC(12,2) NOT NULL,
    costo_unitario_historico NUMERIC(12,2) NOT NULL,
    subtotal NUMERIC(12,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================================================
-- 5. PRODUCCIÓN Y CONTROL DE CALIDAD (TALLER)
-- =========================================================================

CREATE TABLE IF NOT EXISTS public.ordenes_produccion (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    codigo_op VARCHAR(100) UNIQUE NOT NULL,
    venta_id UUID REFERENCES public.ventas(id) ON DELETE SET NULL,
    producto_id UUID NOT NULL REFERENCES public.productos(id) ON DELETE RESTRICT,
    cantidad_solicitada INT NOT NULL,
    cantidad_producida INT NOT NULL DEFAULT 0,
    artesano_responsable_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    estado VARCHAR(50) NOT NULL DEFAULT 'planificada' CHECK (estado IN ('planificada', 'corte', 'armado', 'acabado', 'control_calidad', 'completada', 'cancelada')),
    bodega_destino_id UUID REFERENCES public.bodegas(id) ON DELETE RESTRICT,
    fecha_inicio DATE,
    fecha_entrega_prometida DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.movimientos_inventario (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tipo_movimiento VARCHAR(50) NOT NULL CHECK (tipo_movimiento IN (
        'entrada_compra', 'entrada_produccion', 'salida_produccion', 
        'salida_venta', 'reserva_venta', 'liberacion_reserva',
        'ajuste_positivo', 'ajuste_negativo', 'desperdicio_corte'
    )),
    materia_prima_id UUID REFERENCES public.materia_prima(id) ON DELETE CASCADE,
    producto_id UUID REFERENCES public.productos(id) ON DELETE CASCADE,
    bodega_origen_id UUID REFERENCES public.bodegas(id) ON DELETE CASCADE,
    bodega_destino_id UUID REFERENCES public.bodegas(id) ON DELETE CASCADE,
    cantidad NUMERIC(12,4) NOT NULL,
    costo_unitario NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    documento_referencia_id UUID,
    usuario_operador_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    observaciones TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.desperdicios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    orden_produccion_id UUID NOT NULL REFERENCES public.ordenes_produccion(id) ON DELETE CASCADE,
    materia_prima_id UUID NOT NULL REFERENCES public.materia_prima(id) ON DELETE RESTRICT,
    cantidad_desperdiciada NUMERIC(12,4) NOT NULL,
    motivo VARCHAR(255) NOT NULL,
    reportado_por UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.costos_historicos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    materia_prima_id UUID REFERENCES public.materia_prima(id) ON DELETE CASCADE,
    tipo_costo VARCHAR(50) NOT NULL DEFAULT 'compra' CHECK (tipo_costo IN ('compra', 'bom_calculado')),
    valor NUMERIC(12,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================================================
-- 6. ÍNDICES DE RENDIMIENTO
-- =========================================================================

CREATE INDEX IF NOT EXISTS idx_materia_prima_sku ON public.materia_prima (sku);
CREATE INDEX IF NOT EXISTS idx_productos_ref ON public.productos (ref_sku);
CREATE INDEX IF NOT EXISTS idx_movimientos_inv_materia ON public.movimientos_inventario (materia_prima_id);
CREATE INDEX IF NOT EXISTS idx_movimientos_inv_producto ON public.movimientos_inventario (producto_id);
CREATE INDEX IF NOT EXISTS idx_bom_producto ON public.ficha_tecnica_bom (producto_id);
CREATE INDEX IF NOT EXISTS idx_ordenes_prod_estado ON public.ordenes_produccion (estado);
CREATE INDEX IF NOT EXISTS idx_ventas_cliente ON public.ventas (cliente_id);

-- =========================================================================
-- 7. POLÍTICAS DE SEGURIDAD (RLS)
-- =========================================================================

ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proveedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bodegas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materia_prima ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventario_materia_prima ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventario_productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ficha_tecnica_bom ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ventas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.detalle_venta ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ordenes_produccion ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movimientos_inventario ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.desperdicios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.costos_historicos ENABLE ROW LEVEL SECURITY;

-- Políticas Simples y Robustas de Lectura y Escritura por Rol

-- A. Acceso Público / Cliente
CREATE POLICY "Lectura pública de productos" ON public.productos 
    FOR SELECT USING (true);

-- B. Acceso Perfiles
CREATE POLICY "Lectura de perfiles propios y autorizados" ON public.profiles
    FOR SELECT USING (true);

CREATE POLICY "Modificación de perfil propio" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- C. Políticas Generales para Personal de Operación (Admin, Vendedor, Inventario, Artesano)
CREATE POLICY "Gestión completa para Administradores" ON public.productos
    FOR ALL TO authenticated USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            JOIN public.roles r ON p.role_id = r.id
            WHERE p.id = auth.uid() AND r.codigo = 'admin'
        )
    );

CREATE POLICY "Gestión de insumos para Inventario y Admin" ON public.materia_prima
    FOR ALL TO authenticated USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            JOIN public.roles r ON p.role_id = r.id
            WHERE p.id = auth.uid() AND r.codigo IN ('admin', 'inventario')
        )
    );

CREATE POLICY "Lectura de insumos para Artesanos" ON public.materia_prima
    FOR SELECT TO authenticated USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            JOIN public.roles r ON p.role_id = r.id
            WHERE p.id = auth.uid() AND r.codigo = 'artesano'
        )
    );

CREATE POLICY "Gestión de OPs para Artesanos y Admin" ON public.ordenes_produccion
    FOR ALL TO authenticated USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            JOIN public.roles r ON p.role_id = r.id
            WHERE p.id = auth.uid() AND r.codigo IN ('admin', 'artesano')
        )
    );

CREATE POLICY "Lectura de OPs para Ventas" ON public.ordenes_produccion
    FOR SELECT TO authenticated USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            JOIN public.roles r ON p.role_id = r.id
            WHERE p.id = auth.uid() AND r.codigo = 'vendedor'
        )
    );
