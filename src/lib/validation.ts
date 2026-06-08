import { z } from 'zod';

/** أرقام الهاتف العراقية: تبدأ بـ 07 وتتكوّن من 11 رقماً */
const iraqiPhone = z
  .string()
  .trim()
  .regex(/^07\d{9}$/u, 'رقم الهاتف غير صحيح. مثال: 07XXXXXXXXX');

/** عنصر طلب قادم من السلة */
export const orderItemSchema = z.object({
  productId: z.string().min(1),
  name: z.string().min(1),
  sizeName: z.string().nullable(),
  addons: z.array(z.object({ name: z.string(), price: z.number().nonnegative() })),
  unitPrice: z.number().nonnegative(),
  quantity: z.number().int().min(1).max(50),
  notes: z.string().max(300).optional().default(''),
});

/** مخطط إنشاء الطلب — يُستخدم في الواجهة وفي API Route */
export const createOrderSchema = z
  .object({
    customerName: z.string().trim().min(2, 'الاسم مطلوب').max(80),
    customerPhone: iraqiPhone,
    deliveryMethod: z.enum(['delivery', 'pickup']),
    city: z.string().trim().min(2, 'المدينة / القضاء مطلوب').max(60),
    address: z.string().trim().max(200).optional().default(''),
    landmark: z.string().trim().max(120).optional().default(''),
    latitude: z.number().nullable().optional(),
    longitude: z.number().nullable().optional(),
    paymentMethod: z.enum(['cash', 'card']),
    notes: z.string().trim().max(400).optional().default(''),
    couponCode: z.string().trim().max(40).optional().nullable(),
    userId: z.string().uuid().optional().nullable(),
    items: z.array(orderItemSchema).min(1, 'السلة فارغة'),
  })
  .superRefine((data, ctx) => {
    // عند التوصيل يجب توفّر العنوان داخل المدينة
    if (data.deliveryMethod === 'delivery' && (!data.address || data.address.length < 4)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['address'],
        message: 'العنوان الكامل مطلوب للتوصيل',
      });
    }
  });

export type CreateOrderInput = z.infer<typeof createOrderSchema>;

/** مخطط حقول نموذج الدفع (بدون عناصر السلة — تُضاف عند الإرسال) */
export const checkoutFormSchema = z
  .object({
    customerName: z.string().trim().min(2, 'الاسم مطلوب').max(80),
    customerPhone: iraqiPhone,
    deliveryMethod: z.enum(['delivery', 'pickup']),
    city: z.string().trim().min(2, 'المدينة / القضاء مطلوب').max(60),
    address: z.string().trim().max(200).optional().default(''),
    landmark: z.string().trim().max(120).optional().default(''),
    paymentMethod: z.enum(['cash', 'card']),
    notes: z.string().trim().max(400).optional().default(''),
  })
  .superRefine((data, ctx) => {
    if (data.deliveryMethod === 'delivery' && (!data.address || data.address.length < 4)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['address'],
        message: 'العنوان الكامل مطلوب للتوصيل',
      });
    }
  });

export type CheckoutFormInput = z.infer<typeof checkoutFormSchema>;

/** مخطط التتبع */
export const trackSchema = z
  .object({
    phone: z.string().trim().optional().default(''),
    code: z.string().trim().optional().default(''),
  })
  .refine((d) => d.phone.length >= 3 || d.code.length >= 3, {
    message: 'أدخل رقم الهاتف أو كود الطلب',
    path: ['code'],
  });

/** مخطط تطبيق الكوبون */
export const couponSchema = z.object({
  code: z.string().trim().min(2).max(40),
  subtotal: z.number().nonnegative(),
  userId: z.string().uuid().optional().nullable(),
});

/** مخطط تقييم الطلب بعد التسليم */
export const reviewSchema = z.object({
  code: z.string().trim().min(3, 'كود الطلب مطلوب').max(40),
  rating: z.number().int().min(1, 'اختر تقييماً').max(5),
  comment: z.string().trim().max(400).optional().default(''),
  name: z.string().trim().max(80).optional().default(''),
});

/** مخطط حفظ اشتراك الإشعارات */
export const pushSubscriptionSchema = z.object({
  code: z.string().trim().max(40).optional().default(''),
  endpoint: z.string().url().max(500),
  subscription: z.unknown(),
});
