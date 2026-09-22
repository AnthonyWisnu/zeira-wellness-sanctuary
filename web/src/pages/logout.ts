import type { APIRoute } from 'astro';

/**
 * Endpoint Logout Terpadu: Menghapus cookie sesi zeira_session
 * dan mengarahkan kembali ke halaman /login secara instan.
 * Mendukung metode GET maupun POST.
 */
export const ALL: APIRoute = async ({ cookies, redirect }) => {
  cookies.delete('zeira_session', { path: '/' });
  return redirect('/login', 302);
};
