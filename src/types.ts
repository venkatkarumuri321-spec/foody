/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Language = 'english' | 'hindi' | 'telugu';

export type Category = 'starters' | 'main' | 'drinks' | 'desserts';

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: Category;
  image: string;
  isVeg: boolean;
  isAvailable: boolean;
  moodTag?: 'happy' | 'spicy' | 'peaceful' | 'comfort' | 'all';
  rating?: number;
  prepTime?: string;
  chefSpecial?: boolean;
}

export interface CartItem {
  menuItem: MenuItem;
  quantity: number;
}

export interface TableInfo {
  tableNumber: string;
  restaurantId: string;
  sessionId: string;
}

export type OrderStatus = 'pending' | 'preparing' | 'cooking' | 'ready' | 'delivered';

export interface Order {
  id: string;
  tableNumber: string;
  items: CartItem[];
  status: OrderStatus;
  totalAmount: number;
  paymentMethod?: 'cash' | 'online';
  paymentOnlineProvider?: 'googlepay' | 'phonepe' | 'upi';
  paymentStatus: 'pending' | 'completed' | 'failed';
  createdAt: string;
  notes?: string;
}

export interface WaiterRequest {
  id: string;
  tableNumber: string;
  status: 'pending' | 'completed';
  createdAt: string;
}

export interface TransactionRecord {
  id: string;
  orderId: string;
  method: string;
  amount: number;
  status: 'success' | 'failed';
  timestamp: string;
}

export interface RatingRecord {
  id: string;
  stars: number;
  feedback: string;
  tableNumber: string;
  createdAt: string;
}

export interface AppState {
  language: Language;
  tableInfo: TableInfo | null;
  cart: CartItem[];
  needWaiter: boolean | null;
  activeOrder: Order | null;
  transactions: TransactionRecord[];
  ratings: RatingRecord[];
}
