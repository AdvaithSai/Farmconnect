import { auth } from './firebase';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

export interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

// POSTs to the backend as the signed-in user. Throws with the server's message on failure.
async function postAsUser(path: string, body: unknown) {
  const token = await auth.currentUser?.getIdToken();
  if (!token) throw new Error('Please log in again to continue.');
  const res = await fetch(`${BACKEND_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok || !data?.success) throw new Error(data?.error || 'Payment server error');
  return data;
}

// The server works out the amount from the accepted offer; the client only names the offer.
export async function createOrder(offerId: string): Promise<{ id: string; amount: number; currency: string }> {
  return (await postAsUser('/create-order', { offerId })).order;
}

// The server checks Razorpay's signature, then marks the transaction completed and the crop sold.
export async function verifyPayment(response: RazorpayResponse): Promise<void> {
  await postAsUser('/verify-payment', response);
}
