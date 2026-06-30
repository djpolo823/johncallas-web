import { supabase, isSupabaseConfigured } from './supabase';
import type { Product } from '../types';

const PRODUCTS_STORAGE_KEY = 'jc_products';

// Seeding standard high-quality products with Quiet Luxury metadata and multi-image galleries
const SEED_PRODUCTS: Product[] = [
  {
    id: 1,
    name: 'The Classic Tote',
    price: 280,
    images: [
      'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?q=80&w=2069&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1591561954557-26941169b49e?q=80&w=1974&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1584916201218-f4242ceb4809?q=80&w=1915&auto=format&fit=crop'
    ],
    category: 'Tote Bags',
    categoryId: 'bolsos',
    ref: 'JC-TOTE-01',
    description: 'Un icono reimaginado. Diseñado para la mujer contemporánea que necesita llevar su mundo consigo sin sacrificar la elegancia. Elaborado en cuero de plena flor que desarrollará una pátina única con el tiempo.',
    features: [
      'Cuero de plena flor de origen ético',
      'Herrajes en tono dorado muy sutil',
      'Compartimento acolchado para laptop de 13 pulgadas',
      'Hecho a mano por artesanos expertos'
    ],
    stock: 12,
    filters: {
      categoria: 'bolsos',
      precio: 280,
      uso: 'Diario',
      tamano: 'Grande',
      color: 'Negro Onyx'
    }
  },
  {
    id: 2,
    name: 'Minimalist Crossbody',
    price: 195,
    images: [
      'https://images.unsplash.com/photo-1594223274512-ad4803739b7c?q=80&w=1957&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1600857062241-98e5dba7f214?q=80&w=1998&auto=format&fit=crop'
    ],
    category: 'Bandoleras',
    categoryId: 'bolsos',
    ref: 'JC-CROSS-02',
    description: 'La esencia de la simplicidad. Diseñada para mantener tus manos libres mientras llevas lo esencial con la máxima discreción y estilo.',
    features: [
      'Cuero suave premium curtido al vegetal',
      'Correa ajustable de hombro',
      'Forro interno de gamuza suave',
      'Cierre magnético oculto'
    ],
    stock: 8,
    filters: {
      categoria: 'bolsos',
      precio: 195,
      uso: 'Diario',
      tamano: 'Mediano',
      color: 'Cognac'
    }
  },
  {
    id: 3,
    name: 'Structured Shoulder',
    price: 240,
    images: [
      'https://images.unsplash.com/photo-1591561954557-26941169b49e?q=80&w=1974&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?q=80&w=2069&auto=format&fit=crop'
    ],
    category: 'Bolsos de Hombro',
    categoryId: 'bolsos',
    ref: 'JC-SHOUL-03',
    description: 'Líneas limpias y presencia escultural. Un bolso elegante que eleva instantáneamente cualquier atuendo formal o de negocios.',
    features: [
      'Estructura semi-rígida duradera',
      'Cuero texturizado resistente a rayaduras',
      'Detalles dorados pulidos a mano',
      'Bolsillo interno con cremallera YKK'
    ],
    stock: 6,
    filters: {
      categoria: 'bolsos',
      precio: 240,
      uso: 'Formal',
      tamano: 'Mediano',
      color: 'Beige'
    }
  },
  {
    id: 4,
    name: 'Evening Clutch',
    price: 150,
    images: [
      'https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?q=80&w=2071&auto=format&fit=crop'
    ],
    category: 'Accesorios',
    categoryId: 'billeteras',
    ref: 'JC-CLUTCH-04',
    description: 'Sofisticación para la noche. Una silueta delgada que se adapta perfectamente a la mano, ideal para guardar tu teléfono, tarjetas y labial.',
    features: [
      'Cuero con acabado brillante satinado',
      'Cierre con broche de presión metálico invisible',
      'Espacio dedicado para 4 tarjetas de crédito',
      'Cadena de hombro desmontable muy delicada'
    ],
    stock: 15,
    filters: {
      categoria: 'billeteras',
      precio: 150,
      uso: 'Noche',
      tamano: 'Mini',
      color: 'Gold'
    }
  },
  {
    id: 5,
    name: 'Everyday Shopper',
    price: 220,
    images: [
      'https://images.unsplash.com/photo-1584916201218-f4242ceb4809?q=80&w=1915&auto=format&fit=crop'
    ],
    category: 'Tote Bags',
    categoryId: 'bolsos',
    ref: 'JC-SHOP-05',
    description: 'Tu compañero incansable. Un bolso amplio y de estructura relajada, perfecto para un día de compras, viajes o para el uso diario diario.',
    features: [
      'Cuero flexible ultra suave',
      'Interior amplio sin divisiones para máxima versatilidad',
      'Doble asa reforzada',
      'Incluye cosmetiquera interior extraíble'
    ],
    stock: 20,
    filters: {
      categoria: 'bolsos',
      precio: 220,
      uso: 'Diario',
      tamano: 'Grande',
      color: 'Off-White'
    }
  },
  {
    id: 6,
    name: 'Saddle Bag',
    price: 210,
    images: [
      'https://images.unsplash.com/photo-1600857062241-98e5dba7f214?q=80&w=1998&auto=format&fit=crop'
    ],
    category: 'Bandoleras',
    categoryId: 'bolsos',
    ref: 'JC-SADDLE-06',
    description: 'Estética clásica con un toque contemporáneo. Su icónica silueta curvada rinde homenaje al diseño ecuestre tradicional.',
    features: [
      'Costuras hechas a mano con hilo encerado',
      'Solapa frontal completa con hebilla decorativa',
      'Cierre magnético rápido debajo de la correa',
      'Bolsillo exterior trasero de fácil acceso'
    ],
    stock: 5,
    filters: {
      categoria: 'bolsos',
      precio: 210,
      uso: 'Viaje',
      tamano: 'Mediano',
      color: 'Cognac'
    }
  },
  {
    id: 7,
    name: 'Travel Cosmetic Case',
    price: 95,
    images: [
      'https://images.unsplash.com/photo-1599305090598-fe179d501227?q=80&w=2000&auto=format&fit=crop'
    ],
    category: 'Cosmetiqueras',
    categoryId: 'cosmetiqueras',
    ref: 'JC-COSM-07',
    description: 'El lujo viaja contigo. Un neceser espacioso diseñado para organizar tus cosméticos y productos de cuidado personal con total elegancia.',
    features: [
      'Cuero resistente al agua y manchas',
      'Forro interno impermeable de fácil limpieza',
      'Apertura amplia con cremallera perimetral',
      'Divisiones elásticas interiores'
    ],
    stock: 25,
    filters: {
      categoria: 'cosmetiqueras',
      precio: 95,
      uso: 'Viaje',
      tamano: 'Mini',
      color: 'Beige'
    }
  },
  {
    id: 8,
    name: 'Slim Leather Wallet',
    price: 85,
    images: [
      'https://images.unsplash.com/photo-1628149462194-4b52b2fbd8db?q=80&w=2000&auto=format&fit=crop'
    ],
    category: 'Billeteras',
    categoryId: 'billeteras',
    ref: 'JC-WALL-08',
    description: 'Minimalismo en tu bolsillo. Diseñada para eliminar el volumen innecesario llevando tus tarjetas esenciales y efectivo doblado.',
    features: [
      'Perfil ultra delgado de tan solo 0.5 cm',
      'Ranuras de acceso rápido para 6 tarjetas',
      'Compartimento central superior para billetes',
      'Protección RFID integrada'
    ],
    stock: 30,
    filters: {
      categoria: 'billeteras',
      precio: 85,
      uso: 'Diario',
      tamano: 'Mini',
      color: 'Negro Onyx'
    }
  }
];

const initLocalProducts = () => {
  if (!localStorage.getItem(PRODUCTS_STORAGE_KEY)) {
    localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(SEED_PRODUCTS));
  }
};

/** Convierte una fila de la tabla 'productos' (ERP) al tipo Product del frontend */
const mapProductoDBToProduct = (
  p: Record<string, unknown>,
  stockDisponible = 0
): Product => ({
  id: String(p.id),
  name: String(p.nombre ?? ''),
  price: Number(p.precio_venta ?? 0),
  images: Array.isArray(p.imagenes) ? (p.imagenes as string[]) : [],
  category: String(p.categoria ?? ''),
  categoryId: String(p.categoria_id ?? ''),
  ref: String(p.ref_sku ?? ''),
  description: String(p.descripcion ?? ''),
  features: Array.isArray((p.filtros as Record<string, unknown>)?.features)
    ? ((p.filtros as Record<string, unknown>).features as string[])
    : [],
  stock: stockDisponible,
  filters: {
    categoria: String(p.categoria_id ?? ''),
    precio: Number(p.precio_venta ?? 0),
    uso: ((p.filtros as Record<string, unknown>)?.uso as Product['filters']['uso']) ?? 'Diario',
    tamano: ((p.filtros as Record<string, unknown>)?.tamano as Product['filters']['tamano']) ?? 'Mediano',
    color: ((p.filtros as Record<string, unknown>)?.color as Product['filters']['color']) ?? 'Negro Onyx',
  },
  createdAt: String(p.created_at ?? ''),
});

export const ProductService = {
  getProducts: async (): Promise<Product[]> => {
    if (!isSupabaseConfigured) {
      initLocalProducts();
      return JSON.parse(localStorage.getItem(PRODUCTS_STORAGE_KEY) || '[]');
    }

    // Intentar primero la nueva tabla 'productos' del esquema ERP
    const { data: erpData, error: erpError } = await supabase
      .from('productos')
      .select('*')
      .order('nombre');

    if (!erpError && erpData && erpData.length > 0) {
      // Obtener stock consolidado de todas las bodegas
      const { data: stocks } = await supabase
        .from('inventario_productos')
        .select('producto_id, cantidad_disponible');

      const stockMap = ((stocks ?? []) as Array<{ producto_id: string; cantidad_disponible: number }>)
        .reduce<Record<string, number>>((acc, s) => {
          acc[s.producto_id] = (acc[s.producto_id] ?? 0) + s.cantidad_disponible;
          return acc;
        }, {});

      return (erpData as Record<string, unknown>[]).map((p) =>
        mapProductoDBToProduct(p, stockMap[String(p.id)] ?? 0)
      );
    }

    // Fallback: tabla legacy 'products' (si existe)
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(p => ({
      id: p.id,
      name: p.name,
      price: p.price,
      images: p.images || [],
      category: p.category,
      categoryId: p.category_id,
      ref: p.ref,
      description: p.description,
      features: p.features || [],
      stock: p.stock,
      filters: p.filters || { categoria: p.category_id, precio: p.price, uso: 'Diario', tamano: 'Mediano', color: 'Negro Onyx' },
      ownerId: p.owner_id,
      createdAt: p.created_at
    }));
  },

  getProductById: async (id: number | string): Promise<Product | null> => {
    if (!isSupabaseConfigured) {
      initLocalProducts();
      const products: Product[] = JSON.parse(localStorage.getItem(PRODUCTS_STORAGE_KEY) || '[]');
      const targetId = typeof id === 'string' ? parseInt(id, 10) : id;
      return products.find(p => p.id === targetId || p.id === id) || null;
    }

    // Buscar en tabla ERP 'productos'
    const { data: erpData, error: erpError } = await supabase
      .from('productos')
      .select('*')
      .eq('id', String(id))
      .maybeSingle();

    if (!erpError && erpData) {
      const { data: stocks } = await supabase
        .from('inventario_productos')
        .select('cantidad_disponible')
        .eq('producto_id', String(id));
      const stock = ((stocks ?? []) as Array<{ cantidad_disponible: number }>)
        .reduce((a, s) => a + s.cantidad_disponible, 0);
      return mapProductoDBToProduct(erpData as Record<string, unknown>, stock);
    }

    // Fallback a tabla legacy
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();
    if (error) return null;
    return {
      id: data.id, name: data.name, price: data.price, images: data.images || [],
      category: data.category, categoryId: data.category_id, ref: data.ref,
      description: data.description, features: data.features || [], stock: data.stock,
      filters: data.filters || { categoria: data.category_id, precio: data.price, uso: 'Diario', tamano: 'Mediano', color: 'Negro Onyx' },
      ownerId: data.owner_id, createdAt: data.created_at
    };
  },

  createProduct: async (product: Omit<Product, 'id' | 'createdAt'>): Promise<Product> => {
    if (!isSupabaseConfigured) {
      initLocalProducts();
      const products: Product[] = JSON.parse(localStorage.getItem(PRODUCTS_STORAGE_KEY) || '[]');
      const newProduct: Product = {
        ...product,
        id: Date.now(),
        createdAt: new Date().toISOString()
      };
      products.unshift(newProduct);
      localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(products));
      return newProduct;
    }

    // Prepare structure for Supabase Table
    const dbProduct = {
      name: product.name,
      price: product.price,
      images: product.images,
      category: product.category,
      category_id: product.categoryId,
      ref: product.ref,
      description: product.description,
      features: product.features,
      stock: product.stock,
      filters: product.filters,
      owner_id: product.ownerId
    };

    const { data, error } = await supabase
      .from('products')
      .insert(dbProduct)
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      name: data.name,
      price: data.price,
      images: data.images || [],
      category: data.category,
      categoryId: data.category_id,
      ref: data.ref,
      description: data.description,
      features: data.features || [],
      stock: data.stock,
      filters: data.filters || product.filters,
      ownerId: data.owner_id,
      createdAt: data.created_at
    };
  },

  updateProduct: async (id: number | string, product: Partial<Omit<Product, 'id' | 'createdAt'>>): Promise<Product> => {
    if (!isSupabaseConfigured) {
      initLocalProducts();
      const products: Product[] = JSON.parse(localStorage.getItem(PRODUCTS_STORAGE_KEY) || '[]');
      const index = products.findIndex(p => p.id === id || p.id.toString() === id.toString());
      if (index === -1) throw new Error('Producto no encontrado.');

      const updatedProduct = {
        ...products[index],
        ...product,
      };

      products[index] = updatedProduct;
      localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(products));
      return updatedProduct;
    }

    // Map to Supabase table column names
    const dbUpdate: any = {};
    if (product.name !== undefined) dbUpdate.name = product.name;
    if (product.price !== undefined) dbUpdate.price = product.price;
    if (product.images !== undefined) dbUpdate.images = product.images;
    if (product.category !== undefined) dbUpdate.category = product.category;
    if (product.categoryId !== undefined) dbUpdate.category_id = product.categoryId;
    if (product.ref !== undefined) dbUpdate.ref = product.ref;
    if (product.description !== undefined) dbUpdate.description = product.description;
    if (product.features !== undefined) dbUpdate.features = product.features;
    if (product.stock !== undefined) dbUpdate.stock = product.stock;
    if (product.filters !== undefined) dbUpdate.filters = product.filters;

    const { data, error } = await supabase
      .from('products')
      .update(dbUpdate)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      name: data.name,
      price: data.price,
      images: data.images || [],
      category: data.category,
      categoryId: data.category_id,
      ref: data.ref,
      description: data.description,
      features: data.features || [],
      stock: data.stock,
      filters: data.filters || product.filters!,
      ownerId: data.owner_id,
      createdAt: data.created_at
    };
  },

  deleteProduct: async (id: number | string): Promise<boolean> => {
    if (!isSupabaseConfigured) {
      initLocalProducts();
      const products: Product[] = JSON.parse(localStorage.getItem(PRODUCTS_STORAGE_KEY) || '[]');
      const filtered = products.filter(p => p.id !== id && p.id.toString() !== id.toString());
      
      if (products.length === filtered.length) return false;
      
      localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(filtered));
      return true;
    }

    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  }
};
