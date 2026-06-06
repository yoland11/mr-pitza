/**
 * أنواع البيانات المركزية لمستر بيتزا
 * Central domain types — mirror the Supabase schema.
 */

export type UUID = string;

export type OrderStatus =
  | 'received' // تم استلام الطلب
  | 'preparing' // قيد التحضير
  | 'in_oven' // في الفرن
  | 'ready' // جاهز
  | 'on_the_way' // في الطريق
  | 'delivered' // تم التسليم
  | 'cancelled'; // ملغي

export type DeliveryMethod = 'delivery' | 'pickup';
export type PaymentMethod = 'cash' | 'card';
export type PaymentStatus = 'unpaid' | 'awaiting_confirmation' | 'paid';

export interface Category {
  id: UUID;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  sort_order: number;
  is_active: boolean;
}

export interface ProductSize {
  id: UUID;
  product_id: UUID;
  name: string; // صغير / وسط / كبير
  price_delta: number; // يُضاف إلى السعر الأساسي
  is_default: boolean;
  sort_order: number;
}

export interface ProductAddon {
  id: UUID;
  product_id: UUID;
  name: string; // جبن / صوص / زيتون / فطر / بيبروني
  price: number;
  is_active: boolean;
}

export interface ProductImage {
  id: UUID;
  product_id: UUID;
  url: string;
  is_primary: boolean;
  sort_order: number;
}

export interface Product {
  id: UUID;
  category_id: UUID;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  base_price: number;
  discount_price: number | null; // سعر بعد الخصم (إن وُجد)
  is_available: boolean;
  is_featured: boolean;
  sort_order: number;
  created_at: string;
  // علاقات اختيارية
  category?: Category;
  sizes?: ProductSize[];
  addons?: ProductAddon[];
  images?: ProductImage[];
}

export interface Coupon {
  id: UUID;
  code: string;
  description: string | null;
  discount_percent: number; // نسبة الخصم %
  max_discount: number | null;
  min_order: number;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Banner {
  id: UUID;
  title: string | null;
  subtitle: string | null;
  image_url: string;
  link_url: string | null;
  sort_order: number;
  is_active: boolean;
}

export interface RestaurantSettings {
  id: UUID;
  name: string;
  phone: string;
  whatsapp: string;
  address: string;
  city: string; // المدينة / القضاء
  delivery_zones: string[]; // المناطق المسموح التوصيل إليها داخل المدينة / القضاء
  working_hours: string;
  delivery_fee: number;
  min_order: number;
  is_open: boolean;
  closed_message: string | null; // رسالة تظهر للزبون عند الإغلاق
  map_url: string | null; // رابط الخريطة
  qr_payment_image_url: string | null; // صورة QR للدفع بالبطاقة
  sound_alerts: boolean; // تفعيل صوت الطلبات الجديدة في لوحة الإدارة
  latitude: number | null;
  longitude: number | null;
  facebook_url: string | null;
  instagram_url: string | null;
  tiktok_url: string | null;
}

export interface OrderItem {
  id: UUID;
  order_id: UUID;
  product_id: UUID | null;
  product_name: string;
  size_name: string | null;
  addons: { name: string; price: number }[];
  unit_price: number; // سعر الوحدة بعد الحجم والإضافات
  quantity: number;
  line_total: number;
  notes: string | null;
}

export interface Order {
  id: UUID;
  code: string; // كود الطلب القصير للتتبع
  customer_name: string;
  customer_phone: string;
  city: string; // المدينة / القضاء فقط
  address: string | null;
  landmark: string | null; // أقرب نقطة دالة
  latitude: number | null;
  longitude: number | null;
  delivery_method: DeliveryMethod;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  status: OrderStatus;
  notes: string | null;
  subtotal: number;
  discount: number;
  delivery_fee: number;
  total: number;
  coupon_code: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
  items?: OrderItem[];
}

export interface Review {
  id: UUID;
  order_id: UUID;
  customer_name: string | null;
  rating: number; // 1..5
  comment: string | null;
  is_approved: boolean;
  created_at: string;
}

/* ===== أنواع جانب العميل (السلة) ===== */
export interface CartAddon {
  id: UUID;
  name: string;
  price: number;
}

export interface CartItem {
  key: string; // معرّف فريد للسطر (يشمل الحجم والإضافات)
  productId: UUID;
  name: string;
  image_url: string | null;
  basePrice: number; // السعر بعد الخصم للوحدة (بدون حجم/إضافات)
  size: { id: UUID; name: string; priceDelta: number } | null;
  addons: CartAddon[];
  quantity: number;
  notes: string;
  unitPrice: number; // basePrice + size + addons
  lineTotal: number; // unitPrice * quantity
}

export const ORDER_STATUS_FLOW: OrderStatus[] = [
  'received',
  'preparing',
  'in_oven',
  'ready',
  'on_the_way',
  'delivered',
];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  received: 'تم استلام الطلب',
  preparing: 'قيد التحضير',
  in_oven: 'في الفرن',
  ready: 'جاهز',
  on_the_way: 'في الطريق',
  delivered: 'تم التسليم',
  cancelled: 'ملغي',
};

export const DELIVERY_METHOD_LABELS: Record<DeliveryMethod, string> = {
  delivery: 'توصيل داخل المدينة / القضاء',
  pickup: 'استلام من المطعم',
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: 'كاش عند الاستلام',
  card: 'بطاقة / ماستر كارد',
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  unpaid: 'غير مدفوع',
  awaiting_confirmation: 'بانتظار تأكيد الدفع',
  paid: 'مدفوع',
};
