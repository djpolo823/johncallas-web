// Re-exportar todos los tipos del proyecto desde un único punto de entrada
export * from './database.types';
export * from './erp';
export * from './mrp';

// Mantener compatibilidad con tipos legacy del módulo principal
export type { Product, UserAccount, OrderItem, Order, ProductFilters } from '../types';
