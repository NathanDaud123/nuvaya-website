/**
 * Metadata SEO per halaman. Dipakai dua kali:
 * - saat build (vite.config.ts) untuk menulis HTML statis per halaman, agar GitHub Pages
 *   melayani /edukasi/ dll. dengan status 200 (bukan lewat 404.html);
 * - saat runtime (RouteMeta) untuk memperbarui <head> ketika pindah halaman.
 * Jangan memakai API DOM di sini — file ini juga dijalankan di Node.
 */

export const SITE_URL = 'https://mochi.i2olab.com';
export const SITE_NAME = 'Mochi';
export const OG_IMAGE = `${SITE_URL}/og-image.png`;

export interface RouteMeta {
  title: string;
  description: string;
  /** false → noindex: halaman yang isinya bergantung pada data di perangkat ibu */
  index: boolean;
}

export const ROUTE_META: Record<string, RouteMeta> = {
  '/': {
    title: 'Mochi — Kebutuhan Gizi & Menu Harian Ibu Hamil',
    description:
      'Hitung kebutuhan gizi selama hamil dan dapatkan menu harian dari makanan rumahan Indonesia. Mengacu pada AKG 2019 dan Tabel Komposisi Pangan Indonesia.',
    index: true,
  },
  '/edukasi': {
    title: 'Edukasi Gizi Ibu Hamil | Mochi',
    description:
      'Bacaan singkat tentang zat besi, tablet tambah darah, protein, kalsium, folat, dan makan beragam selama kehamilan.',
    index: true,
  },
  '/profile': {
    title: 'Hitung Kebutuhan Gizi Ibu Hamil | Mochi',
    description:
      'Isi usia kehamilan, tinggi, dan berat badan untuk mengetahui kebutuhan energi dan zat gizi harian selama hamil.',
    index: true,
  },
  '/needs': {
    title: 'Kebutuhan Gizi Harian | Mochi',
    description: 'Kebutuhan energi dan zat gizi harian Ibu selama hamil.',
    index: false,
  },
  '/recommendation': {
    title: 'Menu Hari Ini | Mochi',
    description: 'Menu harian dari makanan rumahan yang disusun mendekati kebutuhan gizi Ibu.',
    index: false,
  },
  '/targets': {
    title: 'Target Minggu Ini | Mochi',
    description: 'Kebiasaan makan kecil yang ingin Ibu coba minggu ini.',
    index: false,
  },
};

/** "/edukasi/" dan "/edukasi" dianggap sama. */
export function normalizePath(pathname: string): string {
  const p = pathname.replace(/\/+$/, '');
  return p === '' ? '/' : p;
}

export function metaFor(pathname: string): RouteMeta {
  return ROUTE_META[normalizePath(pathname)] ?? ROUTE_META['/'];
}

/** GitHub Pages melayani halaman statis di URL bergaris miring akhir, mis. /edukasi/. */
export function canonicalFor(pathname: string): string {
  const p = normalizePath(pathname);
  return p === '/' ? `${SITE_URL}/` : `${SITE_URL}${p}/`;
}
