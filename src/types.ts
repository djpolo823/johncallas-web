export const Role = {
  CLIENT: 'Cliente',
  VENDOR: 'Vendedor',
  ADMIN: 'Administrador',
  ARTESANO: 'Artesano',
  INVENTARIO: 'Inventario'
} as const;

export type Role = typeof Role[keyof typeof Role];

export interface UserAccount {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: Role;
  createdAt?: string;
}

export interface ProductFilters {
  categoria: string;      // e.g. 'bolsos', 'billeteras', 'cosmetiqueras'
  precio: number;         // e.g. 280
  uso: 'Diario' | 'Noche' | 'Viaje' | 'Formal';
  tamano: 'Mini' | 'Mediano' | 'Grande';
  color: 'Negro Onyx' | 'Cognac' | 'Beige' | 'Off-White' | 'Gold';
}

export interface Product {
  id: number | string;
  name: string;
  price: number;
  images: string[];       // Array of URLs/Base64, where index 0 is primary image
  category: string;       // e.g. 'Tote Bags', 'Bandoleras', 'Cosmetiqueras'
  categoryId: string;     // e.g. 'bolsos', 'billeteras', 'cosmetiqueras'
  ref: string;            // Product Reference/SKU
  description: string;
  features: string[];     // Bullet points of features
  stock: number;
  filters: ProductFilters;
  ownerId?: string;       // ID of vendor who created it
  createdAt?: string;
}

export interface OrderItem {
  id: number | string;
  name: string;
  price: number;
  quantity: number;
  color: string;
  image: string;
}

export interface Order {
  id: string;
  date: string;
  total: number;
  status: 'Procesando' | 'Enviado' | 'Entregado' | 'Cancelado';
  items: OrderItem[];
  userId: string;
  userName: string;
  userEmail: string;
}
