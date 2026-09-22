import type { APIRoute } from 'astro';
import { PaymentService } from '../../../../services/payment/payment.service';

export const POST: APIRoute = async ({ request }) => {
  try {
    const payload = await request.json();
    const result = await PaymentService.handleWebhook(payload);

    return new Response(JSON.stringify({ success: true, ...result }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error('Webhook error:', err.message);
    return new Response(
      JSON.stringify({ success: false, message: err.message || 'Webhook processing failed' }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
