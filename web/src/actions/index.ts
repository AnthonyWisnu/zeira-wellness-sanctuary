import { defineAction, ActionError } from 'astro:actions';
import { z } from 'astro:schema';
import { AuthService } from '../../services/auth/auth.service';
import { ReservasiService } from '../../services/reservasi/reservasi.service';
import { MembershipService } from '../../services/membership/membership.service';
import { PelatihService } from '../../services/pelatih/pelatih.service';
import { AdminService } from '../../services/admin/admin.service';

export const server = {
  // ==========================================
  // AUTENTIKASI ACTIONS
  // ==========================================
  login: defineAction({
    accept: 'form',
    input: z.object({
      email: z.string().email('Format email tidak valid'),
      kataSandi: z.string().min(1, 'Kata sandi wajib diisi'),
    }),
    handler: async (input, context) => {
      try {
        const { token, session } = await AuthService.login(input.email, input.kataSandi);
        context.cookies.set('zeira_session', token, {
          path: '/',
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 * 7, // 7 hari
        });
        return { success: true, user: session };
      } catch (err: any) {
        throw new ActionError({
          code: 'UNAUTHORIZED',
          message: err.message || 'Email atau kata sandi tidak valid.',
        });
      }
    },
  }),

  register: defineAction({
    accept: 'form',
    input: z.object({
      namaLengkap: z.string().min(2, 'Nama minimal 2 karakter').max(150),
      email: z.string().email('Format email tidak valid'),
      kataSandi: z.string().min(6, 'Kata sandi minimal 6 karakter'),
      nomorTelepon: z.string().optional(),
    }),
    handler: async (input, context) => {
      try {
        const { token, session } = await AuthService.register(
          input.namaLengkap,
          input.email,
          input.kataSandi,
          input.nomorTelepon
        );
        context.cookies.set('zeira_session', token, {
          path: '/',
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 * 7,
        });
        return { success: true, user: session };
      } catch (err: any) {
        throw new ActionError({
          code: 'BAD_REQUEST',
          message: err.message || 'Gagal mendaftarkan akun.',
        });
      }
    },
  }),

  logout: defineAction({
    accept: 'form',
    handler: async (_, context) => {
      context.cookies.delete('zeira_session', { path: '/' });
      return { success: true };
    },
  }),

  // ==========================================
  // RESERVASI SESI ACTIONS
  // ==========================================
  pesanSesi: defineAction({
    accept: 'form',
    input: z.object({
      jadwalId: z.string().uuid('ID Jadwal tidak valid'),
    }),
    handler: async (input, context) => {
      const user = context.locals.user;
      if (!user) {
        throw new Error('Anda harus masuk terlebih dahulu untuk melakukan reservasi.');
      }

      try {
        const result = await ReservasiService.pesanKursi(user.id, input.jadwalId, user.isMemberAktif);
        return { success: true, ...result };
      } catch (err: any) {
        throw new Error(err.message || 'Terjadi kesalahan saat memesan kursi.');
      }
    },
  }),

  konfirmasiBayar: defineAction({
    accept: 'form',
    input: z.object({
      pesananId: z.string().uuid('ID Pesanan tidak valid'),
      metode: z.string().default('qris'),
    }),
    handler: async (input) => {
      try {
        const pesanan = await ReservasiService.konfirmasiPembayaran(input.pesananId, input.metode);
        return { success: true, pesanan };
      } catch (err: any) {
        throw new Error(err.message || 'Gagal memproses konfirmasi pembayaran.');
      }
    },
  }),

  batalkanReservasi: defineAction({
    accept: 'form',
    input: z.object({
      reservasiId: z.string().uuid('ID Reservasi tidak valid'),
    }),
    handler: async (input, context) => {
      const user = context.locals.user;
      if (!user) {
        throw new Error('Akses ditolak: Silakan masuk terlebih dahulu.');
      }

      try {
        const result = await ReservasiService.batalkanReservasiMandiri(user.id, input.reservasiId);
        return result;
      } catch (err: any) {
        throw new Error(err.message || 'Gagal membatalkan reservasi.');
      }
    },
  }),

  // ==========================================
  // MEMBERSHIP ACTIONS
  // ==========================================
  pesanMembership: defineAction({
    accept: 'form',
    input: z.object({
      paketId: z.string().uuid('ID Paket tidak valid'),
      lokerId: z.string().uuid().optional().or(z.literal('')),
    }),
    handler: async (input, context) => {
      const user = context.locals.user;
      if (!user) {
        throw new Error('Silakan masuk terlebih dahulu untuk mendaftar paket membership.');
      }

      try {
        const result = await MembershipService.pesanMembership(
          user.id,
          input.paketId,
          input.lokerId ? input.lokerId : undefined
        );
        return { success: true, ...result };
      } catch (err: any) {
        throw new Error(err.message || 'Gagal memproses pendaftaran paket membership.');
      }
    },
  }),

  aktivasiMembership: defineAction({
    accept: 'form',
    input: z.object({
      paketId: z.string().uuid(),
      lokerId: z.string().uuid().optional().or(z.literal('')),
    }),
    handler: async (input, context) => {
      const user = context.locals.user;
      if (!user) throw new Error('Akses ditolak.');

      try {
        const result = await MembershipService.aktivasiMembership(
          user.id,
          input.paketId,
          input.lokerId ? input.lokerId : undefined
        );
        return { success: true, keanggotaan: result };
      } catch (err: any) {
        throw new Error(err.message || 'Gagal mengaktifkan membership.');
      }
    },
  }),

  // ==========================================
  // PELATIH ACTIONS
  // ==========================================
  verifikasiKehadiran: defineAction({
    accept: 'form',
    input: z.object({
      reservasiId: z.string().uuid('ID Tiket tidak valid'),
      status: z.enum(['hadir', 'tidak_hadir']),
    }),
    handler: async (input, context) => {
      const user = context.locals.user;
      if (!user || (user.peran !== 'pelatih' && user.peran !== 'admin')) {
        throw new Error('Akses ditolak: Hanya pelatih terverifikasi yang dapat mencatat absensi.');
      }

      try {
        const result = await PelatihService.verifikasiKehadiran(user.id, input.reservasiId, input.status);
        return { success: true, result };
      } catch (err: any) {
        throw new Error(err.message || 'Gagal memverifikasi kehadiran peserta.');
      }
    },
  }),

  selesaikanSesi: defineAction({
    accept: 'form',
    input: z.object({
      jadwalId: z.string().uuid('ID Jadwal tidak valid'),
    }),
    handler: async (input, context) => {
      const user = context.locals.user;
      if (!user || (user.peran !== 'pelatih' && user.peran !== 'admin')) {
        throw new Error('Akses ditolak.');
      }

      try {
        const result = await PelatihService.selesaikanSesi(user.id, input.jadwalId);
        return { success: true, result };
      } catch (err: any) {
        throw new Error(err.message || 'Gagal menandai sesi selesai.');
      }
    },
  }),

  // ==========================================
  // ADMIN ACTIONS
  // ==========================================
  createJadwal: defineAction({
    accept: 'form',
    input: z.object({
      judulSesi: z.string().min(3),
      idKategori: z.string().uuid(),
      idPelatih: z.string().uuid(),
      idRuangan: z.string().uuid(),
      waktuMulai: z.string(),
      waktuSelesai: z.string(),
      kapasitasMaksimal: z.coerce.number().min(1),
      hargaNonMember: z.coerce.number().min(0),
      hargaMember: z.coerce.number().min(0),
      batasBatalJam: z.coerce.number().min(0).default(24),
    }),
    handler: async (input, context) => {
      const user = context.locals.user;
      if (!user || user.peran !== 'admin') {
        throw new Error('Akses ditolak: Hanya admin yang dapat membuat jadwal kelas.');
      }

      try {
        const jadwal = await AdminService.createJadwal({
          judul_sesi: input.judulSesi,
          id_kategori: input.idKategori,
          id_pelatih: input.idPelatih,
          id_ruangan: input.idRuangan,
          waktu_mulai: new Date(input.waktuMulai),
          waktu_selesai: new Date(input.waktuSelesai),
          kapasitas_maksimal: input.kapasitasMaksimal,
          harga_non_member: input.hargaNonMember,
          harga_member: input.hargaMember,
          batas_batal_jam: input.batasBatalJam,
        });
        return { success: true, jadwal };
      } catch (err: any) {
        throw new Error(err.message || 'Gagal membuat jadwal sesi baru.');
      }
    },
  }),

  updateStatusLoker: defineAction({
    accept: 'form',
    input: z.object({
      lokerId: z.string().uuid(),
      status: z.enum(['tersedia', 'digunakan', 'perawatan']),
    }),
    handler: async (input, context) => {
      const user = context.locals.user;
      if (!user || user.peran !== 'admin') {
        throw new Error('Akses ditolak.');
      }

      try {
        const loker = await AdminService.updateStatusLoker(input.lokerId, input.status);
        return { success: true, loker };
      } catch (err: any) {
        throw new Error(err.message || 'Gagal memperbarui status loker.');
      }
    },
  }),
};
