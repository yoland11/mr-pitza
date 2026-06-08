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
  offer_starts_at: string | null;
  offer_ends_at: string | null;
  created_at: string;
  // علاقات اختيارية
  category?: Category;
  sizes?: ProductSize[];
  addons?: ProductAddon[];
  images?: ProductImage[];
}

export type CouponType = 'percent' | 'fixed';

export interface Coupon {
  id: UUID;
  code: string;
  description: string | null;
  type: CouponType; // نسبة مئوية أو مبلغ ثابت
  discount_percent: number; // نسبة الخصم % (عند type=percent)
  amount: number; // مبلغ ثابت (عند type=fixed)
  max_discount: number | null;
  min_order: number;
  usage_limit: number | null; // حد الاستخدام الكلي
  per_user_limit: number | null; // حد لكل مستخدم
  used_count: number;
  starts_at: string | null;
  expires_at: string | null;
  first_order_only: boolean; // أول طلب فقط
  customers_only: boolean; // للعملاء المسجّلين فقط
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
  user_id: string | null;
  driver_id: string | null;
  branch_id: string | null;
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

export type UserRole = 'owner' | 'manager' | 'admin' | 'cashier' | 'kitchen' | 'driver' | 'employee' | 'staff';

export const ROLE_LABELS: Record<UserRole, string> = {
  owner: 'المالك',
  manager: 'مدير',
  admin: 'مشرف',
  cashier: 'كاشير',
  kitchen: 'المطبخ',
  driver: 'سائق توصيل',
  employee: 'موظف',
  staff: 'طاقم',
};

/** الأدوار التي تملك صلاحية لوحة الإدارة الخلفية */
export const ADMIN_ROLES: UserRole[] = ['owner', 'manager', 'admin', 'cashier', 'staff'];

export interface StaffUser {
  id: UUID;
  email: string;
  full_name: string | null;
  role: UserRole;
  created_at: string;
}

export type DriverStatus = 'available' | 'busy' | 'offline';

export interface Driver {
  id: UUID;
  user_id: UUID | null;
  name: string;
  phone: string;
  vehicle: string | null;
  code: string;
  status: DriverStatus;
  is_active: boolean;
  latitude: number | null;
  longitude: number | null;
  location_updated_at: string | null;
  branch_id: UUID | null;
  created_at: string;
}

export interface Branch {
  id: UUID;
  name: string;
  phone: string | null;
  address: string | null;
  city: string | null;
  is_active: boolean;
  is_main: boolean;
  created_at: string;
}

export const DRIVER_STATUS_LABELS: Record<DriverStatus, string> = {
  available: 'متاح',
  busy: 'مشغول',
  offline: 'غير متصل',
};

/* ===== الإدارة الخلفية (المرحلة 3) ===== */
export interface Expense {
  id: UUID;
  category: string;
  description: string | null;
  amount: number;
  vendor: string | null;
  spent_at: string;
  created_at: string;
}

export interface Revenue {
  id: UUID;
  source: string;
  description: string | null;
  amount: number;
  order_id: UUID | null;
  received_at: string;
  created_at: string;
}

export type CashDirection = 'in' | 'out';
export interface CashboxTransaction {
  id: UUID;
  direction: CashDirection;
  amount: number;
  reason: string | null;
  created_at: string;
}

export type DebtKind = 'receivable' | 'payable';
export interface Debt {
  id: UUID;
  party: string;
  kind: DebtKind;
  amount: number;
  description: string | null;
  due_date: string | null;
  is_settled: boolean;
  created_at: string;
}

export interface Supplier {
  id: UUID;
  name: string;
  phone: string | null;
  contact_name: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
}

export interface InventoryItem {
  id: UUID;
  name: string;
  unit: string;
  quantity: number;
  min_quantity: number;
  cost: number;
  supplier_id: UUID | null;
  is_active: boolean;
  created_at: string;
}

export type StockDirection = 'in' | 'out' | 'adjust';
export interface StockMovement {
  id: UUID;
  item_id: UUID;
  direction: StockDirection;
  quantity: number;
  reason: string | null;
  created_at: string;
}

export type PurchaseStatus = 'draft' | 'ordered' | 'received' | 'cancelled';
export interface PurchaseOrderItemRow {
  id: UUID;
  po_id: UUID;
  item_id: UUID | null;
  name: string;
  quantity: number;
  unit_cost: number;
  line_total: number;
}
export interface PurchaseOrder {
  id: UUID;
  supplier_id: UUID | null;
  status: PurchaseStatus;
  total: number;
  notes: string | null;
  created_at: string;
  received_at: string | null;
  items?: PurchaseOrderItemRow[];
}

export const PURCHASE_STATUS_LABELS: Record<PurchaseStatus, string> = {
  draft: 'مسودّة',
  ordered: 'تم الطلب',
  received: 'تم الاستلام',
  cancelled: 'ملغي',
};

export interface Profile {
  id: UUID;
  full_name: string | null;
  phone: string | null;
  email: string | null;
  birthday: string | null;
  points: number;
  created_at: string;
}

export interface CustomerAddress {
  id: UUID;
  user_id: UUID;
  label: string | null;
  city: string;
  address: string;
  landmark: string | null;
  latitude: number | null;
  longitude: number | null;
  is_default: boolean;
  created_at: string;
}

export interface Favorite {
  id: UUID;
  user_id: UUID;
  product_id: UUID;
  created_at: string;
}

export interface PointTransaction {
  id: UUID;
  user_id: UUID;
  order_id: UUID | null;
  delta: number;
  reason: string | null;
  created_at: string;
}

/* إعدادات برنامج الولاء */
export const LOYALTY = {
  DINARS_PER_POINT: 10000, // كل 10,000 دينار = نقطة
  POINTS_PER_REWARD: 10, // كل 10 نقاط
  REWARD_VALUE: 5000, // = خصم 5,000 دينار
};

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
