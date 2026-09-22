import { defineMiddleware } from 'astro:middleware';
import { AuthService } from '../services/auth/auth.service';
import { ReservasiService } from '../services/reservasi/reservasi.service';

export const onRequest = defineMiddleware(async (context, next) => {
  const cookie = context.cookies.get('zeira_session');
  let user = null;

  if (cookie?.value) {
    const verified = AuthService.verifySessionToken(cookie.value);
    if (verified?.uid) {
      user = await AuthService.getUserSession(verified.uid);
    }
  }

  context.locals.user = user;

  // Background clean-up lazy trigger untuk melepaskan kursi kedaluwarsa 15 menit
  // Dijalankan secara non-blocking
  ReservasiService.lepaskanKursiKedaluwarsa().catch(() => {});

  const pathname = context.url.pathname;

  // 1. Proteksi Rute Admin
  if (pathname.startsWith('/admin')) {
    if (!user) {
      return context.redirect(`/login?redirect=${encodeURIComponent(pathname)}`);
    }
    if (user.peran !== 'admin') {
      return new Response('403 Forbidden: Akses khusus Administrator Sanctuary.', {
        status: 403,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      });
    }
  }

  // 2. Proteksi Rute Pelatih
  if (pathname.startsWith('/pelatih')) {
    if (!user) {
      return context.redirect(`/login?redirect=${encodeURIComponent(pathname)}`);
    }
    if (user.peran !== 'pelatih' && user.peran !== 'admin') {
      return new Response('403 Forbidden: Akses khusus Pelatih / Master Instructor.', {
        status: 403,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      });
    }
  }

  // 3. Proteksi Rute Pelanggan Terdaftar (Riwayat & Reservasi Checkout)
  if (pathname.startsWith('/riwayat') || pathname.startsWith('/reservasi')) {
    if (!user) {
      return context.redirect(`/login?redirect=${encodeURIComponent(pathname)}`);
    }
  }

  return next();
});
