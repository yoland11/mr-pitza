import type {
  Banner,
  Category,
  Coupon,
  Product,
  RestaurantSettings,
} from '@/lib/types';

/**
 * بيانات معاينة للتطوير فقط — تُعرض عند عدم ضبط Supabase.
 * في الإنتاج كل البيانات تأتي من قاعدة البيانات (انظر supabase/schema.sql للبذور الحقيقية).
 * Preview-only data shown when Supabase is not configured.
 */

const img = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=900&q=80`;

export const seedSettings: RestaurantSettings = {
  id: 'seed-settings',
  name: 'مستر بيتزا',
  phone: '07700000000',
  whatsapp: '9647700000000',
  address: 'الشارع الرئيسي، قرب الجسر الكبير',
  city: 'بغداد',
  delivery_zones: ['الكرادة', 'المنصور', 'الجادرية', 'زيونة', 'الكاظمية', 'الأعظمية'],
  working_hours: 'يومياً من 11:00 صباحاً حتى 12:00 منتصف الليل',
  delivery_fee: 3000,
  min_order: 5000,
  is_open: true,
  closed_message: 'عذراً، المطعم مغلق حالياً. نعود قريباً!',
  map_url: 'https://www.google.com/maps?q=33.3152,44.3661',
  qr_payment_image_url: null,
  sound_alerts: true,
  latitude: 33.3152,
  longitude: 44.3661,
  facebook_url: 'https://facebook.com',
  instagram_url: 'https://instagram.com',
  tiktok_url: 'https://tiktok.com',
};

export const seedCategories: Category[] = [
  { id: 'cat-pizza', name: 'بيتزا', slug: 'pizza', description: 'بيتزا إيطالية بعجينة طازجة', image_url: img('photo-1513104890138-7c749659a591'), sort_order: 1, is_active: true },
  { id: 'cat-burger', name: 'برغر', slug: 'burger', description: 'برغر لحم ودجاج مشوي', image_url: img('photo-1568901346375-23c9450c58cd'), sort_order: 2, is_active: true },
  { id: 'cat-sandwich', name: 'سندويش', slug: 'sandwich', description: 'سندويشات ساخنة وشهية', image_url: img('photo-1539252554453-80ab65ce3586'), sort_order: 3, is_active: true },
  { id: 'cat-sides', name: 'مقبلات', slug: 'sides', description: 'بطاطا وأجنحة ومقرمشات', image_url: img('photo-1573080496219-bb080dd4f877'), sort_order: 4, is_active: true },
  { id: 'cat-drinks', name: 'مشروبات', slug: 'drinks', description: 'مشروبات غازية وعصائر', image_url: img('photo-1581636625402-29b2a704ef13'), sort_order: 5, is_active: true },
  { id: 'cat-offers', name: 'عروض', slug: 'offers', description: 'عروض اليوم بأسعار مميزة', image_url: img('photo-1594007654729-407eedc4be65'), sort_order: 6, is_active: true },
  { id: 'cat-family', name: 'وجبات عائلية', slug: 'family', description: 'وجبات تكفي العائلة', image_url: img('photo-1565299624946-b28f40a0ae38'), sort_order: 7, is_active: true },
];

const sizes = (productId: string) => [
  { id: `${productId}-s`, product_id: productId, name: 'صغير', price_delta: 0, is_default: true, sort_order: 1 },
  { id: `${productId}-m`, product_id: productId, name: 'وسط', price_delta: 3000, is_default: false, sort_order: 2 },
  { id: `${productId}-l`, product_id: productId, name: 'كبير', price_delta: 6000, is_default: false, sort_order: 3 },
];

const pizzaAddons = (productId: string) => [
  { id: `${productId}-a1`, product_id: productId, name: 'جبن إضافي', price: 1500, is_active: true },
  { id: `${productId}-a2`, product_id: productId, name: 'صوص خاص', price: 1000, is_active: true },
  { id: `${productId}-a3`, product_id: productId, name: 'زيتون', price: 1000, is_active: true },
  { id: `${productId}-a4`, product_id: productId, name: 'فطر', price: 1500, is_active: true },
  { id: `${productId}-a5`, product_id: productId, name: 'بيبروني', price: 2000, is_active: true },
];

function make(
  id: string,
  category_id: string,
  name: string,
  description: string,
  base_price: number,
  image: string,
  opts: { discount_price?: number; is_featured?: boolean; withSizes?: boolean; withAddons?: boolean } = {},
): Product {
  return {
    id,
    category_id,
    name,
    slug: id,
    description,
    image_url: img(image),
    base_price,
    discount_price: opts.discount_price ?? null,
    is_available: true,
    is_featured: opts.is_featured ?? false,
    sort_order: 1,
    created_at: new Date().toISOString(),
    sizes: opts.withSizes ? sizes(id) : [],
    addons: opts.withAddons ? pizzaAddons(id) : [],
  };
}

export const seedProducts: Product[] = [
  make('p-margherita', 'cat-pizza', 'بيتزا مارغريتا', 'صلصة طماطم، موزاريلا، ريحان طازج', 9000, 'photo-1574071318508-1cdbab80d002', { is_featured: true, withSizes: true, withAddons: true }),
  make('p-pepperoni', 'cat-pizza', 'بيتزا بيبروني', 'بيبروني حار، جبنة موزاريلا، صلصة خاصة', 11000, 'photo-1628840042765-356cda07504e', { discount_price: 9000, is_featured: true, withSizes: true, withAddons: true }),
  make('p-mixed', 'cat-pizza', 'بيتزا مشكلة', 'خضار، دجاج، لحم، جبنة وفير', 13000, 'photo-1565299624946-b28f40a0ae38', { is_featured: true, withSizes: true, withAddons: true }),
  make('p-chicken-pizza', 'cat-pizza', 'بيتزا دجاج باربكيو', 'دجاج مشوي بصوص الباربكيو والذرة', 12000, 'photo-1593560708920-61dd98c46a4e', { withSizes: true, withAddons: true }),
  make('p-cheese-burger', 'cat-burger', 'تشيز برغر', 'لحم بقري مشوي، جبنة شيدر، خس وطماطم', 7000, 'photo-1568901346375-23c9450c58cd', { is_featured: true, withSizes: true }),
  make('p-double-burger', 'cat-burger', 'دبل برغر', 'قطعتا لحم، جبنة مزدوجة، صوص خاص', 10000, 'photo-1550547660-d9450f859349', { discount_price: 8500, withSizes: true }),
  make('p-chicken-burger', 'cat-burger', 'برغر دجاج كرسبي', 'دجاج مقرمش، مايونيز، خس', 6500, 'photo-1606755962773-d324e0a13086', { withSizes: true }),
  make('p-shawarma', 'cat-sandwich', 'سندويش شاورما', 'شاورما دجاج، ثوم، مخلل', 4000, 'photo-1529006557810-274b9b2fc783', { is_featured: true }),
  make('p-philly', 'cat-sandwich', 'سندويش فيلي ستيك', 'لحم ستيك، فلفل، بصل، جبنة', 6000, 'photo-1539252554453-80ab65ce3586', {}),
  make('p-fries', 'cat-sides', 'بطاطا مقلية', 'بطاطا ذهبية مقرمشة', 3000, 'photo-1573080496219-bb080dd4f877', { withSizes: true }),
  make('p-wings', 'cat-sides', 'أجنحة دجاج حارة', '٨ قطع أجنحة بالصوص الحار', 6000, 'photo-1608039755401-742074f0548d', { is_featured: true }),
  make('p-mozzarella', 'cat-sides', 'أصابع موزاريلا', 'جبنة مقلية مع صوص', 5000, 'photo-1531749668029-2db88e4276c7', {}),
  make('p-cola', 'cat-drinks', 'كولا', 'مشروب غازي بارد ٣٣٠مل', 1500, 'photo-1581636625402-29b2a704ef13', {}),
  make('p-fresh-juice', 'cat-drinks', 'عصير برتقال طازج', 'عصير طبيعي ١٠٠٪', 3000, 'photo-1613478223719-2ab802602423', {}),
  make('p-water', 'cat-drinks', 'ماء', 'قنينة ماء ٥٠٠مل', 500, 'photo-1560023907-5f339617ea30', {}),
  make('p-family-combo', 'cat-family', 'وجبة عائلية كبرى', 'بيتزا كبيرة + برغرين + بطاطا + ٤ مشروبات', 28000, 'photo-1594007654729-407eedc4be65', { discount_price: 24000, is_featured: true }),
  make('p-duo', 'cat-offers', 'عرض الثنائي', 'بيتزا وسط + مشروبين', 13000, 'photo-1601924994987-69e26d50dc26', { discount_price: 10000, is_featured: true }),
];

// إرفاق صور معاينة لكل منتج (صورة رئيسية + صور إضافية للبيتزا) — للمعاينة فقط
const extraShots = [
  img('photo-1604382354936-07c5d9983bd3'),
  img('photo-1571997478779-2adcbbe9ab2f'),
];
seedProducts.forEach((p) => {
  const images = [
    { id: `${p.id}-img0`, product_id: p.id, url: p.image_url ?? '', is_primary: true, sort_order: 0 },
  ];
  if (p.category_id === 'cat-pizza') {
    extraShots.forEach((u, i) =>
      images.push({ id: `${p.id}-img${i + 1}`, product_id: p.id, url: u, is_primary: false, sort_order: i + 1 }),
    );
  }
  p.images = images;
});

export const seedCoupons: Coupon[] = [
  { id: 'coupon-welcome', code: 'WELCOME', description: 'خصم ترحيبي ١٠٪', discount_percent: 10, max_discount: 5000, min_order: 10000, expires_at: null, is_active: true, created_at: new Date().toISOString() },
  { id: 'coupon-pizza20', code: 'PIZZA20', description: 'خصم ٢٠٪ على الطلبات فوق ٢٠ ألف', discount_percent: 20, max_discount: 8000, min_order: 20000, expires_at: null, is_active: true, created_at: new Date().toISOString() },
];

export const seedBanners: Banner[] = [
  { id: 'banner-1', title: 'عرض الثنائي', subtitle: 'بيتزا وسط + مشروبين بـ ١٠ آلاف فقط', image_url: img('photo-1513104890138-7c749659a591'), link_url: '/offers', sort_order: 1, is_active: true },
  { id: 'banner-2', title: 'وجبة عائلية كبرى', subtitle: 'تكفي ٤ أشخاص — وفّر ٤ آلاف', image_url: img('photo-1594007654729-407eedc4be65'), link_url: '/offers', sort_order: 2, is_active: true },
];

export const seedReviews = [
  { id: 'r1', name: 'أحمد الجبوري', rating: 5, text: 'أطيب بيتزا بالمدينة! التوصيل سريع والطعم خيالي.', city: 'بغداد' },
  { id: 'r2', name: 'سارة محمد', rating: 5, text: 'العجينة طازجة والجبن وفير، صار مطعمنا المفضل.', city: 'بغداد' },
  { id: 'r3', name: 'مصطفى علي', rating: 4, text: 'برغر لذيذ وأسعار معقولة، أنصح فيه بقوة.', city: 'بغداد' },
  { id: 'r4', name: 'نور حسن', rating: 5, text: 'خدمة ممتازة والطلب وصل ساخن وسريع. شكراً مستر بيتزا.', city: 'بغداد' },
];
