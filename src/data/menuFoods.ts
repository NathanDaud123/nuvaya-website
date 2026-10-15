/**
 * Tipe & pemetaan untuk daftar makanan menu MOCHI.
 *
 * Daftar makanannya sendiri ada di lima CSV: public/datasets/tkpi_{staple,animal,plant,vegetable,side}.csv
 * (kode TKPI, porsi rumah tangga, berat porsi, alergen + seluruh kolom gizi TKPI 2017 per 100 g BDD).
 * Kolom gizi diisi oleh scripts/build_menu_csv.py dari TKPI — jangan diketik manual.
 *
 * TODO (NUTRITION REVIEW): berat porsi di CSV = perkiraan awal mengikuti Daftar Bahan Makanan
 * Penukar (±1 satuan penukar). Untuk bahan yang di TKPI hanya ada bentuk segar/mentah,
 * berat porsi = berat mentah bagian yang dapat dimakan, dimasak tanpa tambahan minyak.
 */

export type MenuCategory = 'pokok' | 'hewani' | 'nabati' | 'sayur' | 'buah' | 'selingan';

/** Kelompok alergen umum — alergi pada satu makanan ikut menyingkirkan makanan lain se-alergen. */
export type Allergen = 'telur' | 'susu' | 'ikan' | 'udang' | 'kacang_tanah' | 'kedelai' | 'gandum';

/**
 * Kunci makanan dari dataset CSV lama (sebelum TKPI) → kunci baru, agar alergi/pantangan
 * yang sudah tersimpan di perangkat ibu tidak hilang diam-diam. Satu kunci lama bisa
 * dipetakan ke beberapa makanan baru (mis. semua olahan bandeng).
 */
export const LEGACY_FOOD_KEY_MAP: Record<string, string[]> = {
  'mp:Nasi Putih': ['AP001'],
  'mp:Kentang rebus': ['BR013'],
  'mp:Biskuit': ['AP029'],
  'sn:Tahu Goreng': ['CP062'],
  'sn:Tempe Goreng': ['CP076'],
  'sn:Kacang Kedelai Rebus': ['CP007'],
  'sn:Kacang Hijau Rebus': ['CP005'],
  'sn:Kacang Tanah Rebus': ['CP013'],
  'sn:Oncom': ['CP051', 'CP054'],
  'sh:Ayam Goreng': ['FP024', 'FP029'],
  'sh:Empal Goreng': ['FP046'],
  'sh:Bandeng Goreng': ['GP005'],
  'sh:Tumis Bandeng': ['GP005'],
  'sh:Ikan Mas Pepes': ['GP019'],
  'sh:Mujair Acar Kuning': ['GP020', 'GP021'],
  'sh:Sop Daging Sapi': ['FR025'],
  'sy:Sayur asem': ['DP047'],
  'sy:Sayur Sop': ['DP053'],
  'sy:Sayur Bunga Pepaya': ['DP048'],
  'sy:Cap cai': ['DP030'],
  'sy:Pelecing Kangkung': ['DP044'],
  'sy:Tumis Bayam Bersantan': ['DP059'],
  'plk:Yoghurt': ['JP011'],
  'plk:Alpukat': ['ER001'],
  'plk:Apel': ['ER004'],
  'plk:Duku': ['ER022'],
  'plk:Jambu biji': ['ER031'],
  'plk:Jeruk Manis': ['ER039'],
  'plk:Mangga': ['ER058'],
};
