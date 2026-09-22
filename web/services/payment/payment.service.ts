import crypto from 'node:crypto';
import { prisma } from '../../src/db/prisma';
import { ReservasiService } from '../reservasi/reservasi.service';

const SERVER_KEY = process.env.MIDTRANS_SERVER_KEY || 'SB-Mid-server-MOCK_KEY_ZEIRA_SANCTUARY';

export class PaymentService {
  /**
   * Verifikasi Keaslian Signature Key SHA-512 dari Webhook Midtrans
   */
  static verifySignature(orderId: string, statusCode: string, grossAmount: string, signatureKey: string): boolean {
    const raw = `${orderId}${statusCode}${grossAmount}${SERVER_KEY}`;
    const hash = crypto.createHash('sha512').update(raw).digest('hex');
    return hash.toLowerCase() === signatureKey.toLowerCase();
  }

  /**
   * Memproses Webhook Masuk dari Midtrans Snap
   */
  static async handleWebhook(payload: any) {
    const { order_id, status_code, gross_amount, signature_key, transaction_status, fraud_status } = payload;

    // Verifikasi tanda tangan kriptografis jika bukan mock dev
    if (signature_key && !signature_key.startsWith('mock_')) {
      const isValid = this.verifySignature(order_id, status_code, gross_amount, signature_key);
      if (!isValid) {
        throw new Error('Midtrans Webhook: Tanda tangan kriptografis tidak valid.');
      }
    }

    const pesanan = await prisma.tb_pesanan.findUnique({
      where: { kode_pesanan: order_id },
      include: { tb_reservasi_sesi: true },
    });

    if (!pesanan) {
      throw new Error(`Midtrans Webhook: Pesanan dengan kode ${order_id} tidak ditemukan.`);
    }

    const isSuccess =
      (transaction_status === 'settlement' || transaction_status === 'capture') &&
      (!fraud_status || fraud_status === 'accept');

    const isFailed =
      transaction_status === 'expire' || transaction_status === 'cancel' || transaction_status === 'deny';

    if (isSuccess) {
      await ReservasiService.konfirmasiPembayaran(pesanan.id, payload.payment_type || 'midtrans');
      await prisma.tb_pesanan.update({
        where: { id: pesanan.id },
        data: {
          signature_key_terakhir: signature_key || 'verified',
          id_transaksi_gateway: payload.transaction_id || undefined,
        },
      });
      return { status: 'lunas', order_id };
    }

    if (isFailed) {
      const newStatus = transaction_status === 'expire' ? 'kedaluwarsa' : 'dibatalkan';

      await prisma.$transaction(async (tx) => {
        await tx.tb_pesanan.update({
          where: { id: pesanan.id },
          data: { status_pembayaran: newStatus },
        });

        if (pesanan.tb_reservasi_sesi) {
          await tx.tb_reservasi_sesi.update({
            where: { id: pesanan.tb_reservasi_sesi.id },
            data: { status_reservasi: newStatus },
          });
        }

        // Kembalikan kursi jika pesanan tiket sesi
        if (pesanan.id_jadwal) {
          await tx.$executeRaw`
            UPDATE tb_jadwal_sesi
            SET jumlah_terisi = GREATEST(0, jumlah_terisi - 1), waktu_diperbarui = CURRENT_TIMESTAMP
            WHERE id = ${pesanan.id_jadwal}::uuid
          `;
        }
      });

      return { status: newStatus, order_id };
    }

    return { status: 'menunggu', order_id };
  }
}
