import webpush from 'web-push';

const PUBLIC = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? '';
const PRIVATE = process.env.VAPID_PRIVATE_KEY ?? '';
const SUBJECT = process.env.VAPID_SUBJECT || 'mailto:admin@mrpizza.app';

export const isWebPushConfigured = PUBLIC.length > 20 && PRIVATE.length > 20;

let ready = false;
function ensure() {
  if (ready || !isWebPushConfigured) return;
  webpush.setVapidDetails(SUBJECT, PUBLIC, PRIVATE);
  ready = true;
}

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
}

/** إرسال إشعار Web Push واحد. يُرجع false بهدوء إن لم يُضبط VAPID أو فشل. */
export async function sendPush(subscription: unknown, payload: PushPayload): Promise<boolean> {
  if (!isWebPushConfigured) return false;
  ensure();
  try {
    await webpush.sendNotification(
      subscription as webpush.PushSubscription,
      JSON.stringify(payload),
    );
    return true;
  } catch {
    return false;
  }
}
