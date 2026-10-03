/** Modul edukasi terkurasi (EDU-*) - konten disetujui, bukan generated. */
export interface EducationModule {
  id: string;
  title: string;
  nutrient: string;
  body: string[];
}

export const EDUCATION_MODULES: EducationModule[] = [
  {
    id: 'EDU-IRON',
    title: 'Makanan sumber zat besi untuk ibu hamil',
    nutrient: 'Zat besi (Fe)',
    body: [
      'Kebutuhan zat besi naik terutama pada trimester 2 dan 3 (target +9 mg/hari dari AKG dasar).',
      'Sumber hewani (daging, ikan, hati) zat besinya lebih mudah diserap tubuh dibanding sumber nabati.',
      'Sumber nabati (tempe, kacang hijau, bayam) tetap baik - padukan dengan buah bervitamin C agar penyerapannya naik.',
      'Hindari minum teh atau kopi bersamaan dengan makan karena menghambat penyerapan zat besi.',
    ],
  },
  {
    id: 'EDU-IFA',
    title: 'Patuh minum tablet tambah darah (TTD)',
    nutrient: 'Fe + Folat',
    body: [
      'Minum 1 tablet tambah darah setiap hari sesuai anjuran tenaga kesehatan.',
      'Minum dengan air putih atau jus buah - jangan bersamaan dengan teh, kopi, atau susu.',
      'Jika mual, coba minum malam hari sebelum tidur atau setelah makan kecil.',
      'Jangan mengubah dosis sendiri; ceritakan efek samping kepada bidan/dokter saat kontrol.',
    ],
  },
  {
    id: 'EDU-DIVERSITY',
    title: 'Isi piringku: makan beragam setiap hari',
    nutrient: 'Keragaman pangan',
    body: [
      'Usahakan tiap makan ada 4 unsur: makanan pokok, lauk hewani/nabati, sayur, dan buah.',
      'Ganti-ganti jenis lauk dalam seminggu agar vitamin dan mineral yang masuk beragam.',
      'Buah dan sayur berbeda warna memberi vitamin yang berbeda - campur warnanya.',
    ],
  },
  {
    id: 'EDU-PROTEIN',
    title: 'Cukupi protein untuk tumbuh kembang janin',
    nutrient: 'Protein',
    body: [
      'Tambahan protein naik per trimester: +1 g (T1), +10 g (T2), +30 g (T3) dari kebutuhan dasar.',
      'Sumber terjangkau: telur, tempe, tahu, ikan segar pasar, kacang-kacangan.',
      'Bagi rata protein ke sarapan, makan siang, dan makan malam agar terserap optimal.',
    ],
  },
  {
    id: 'EDU-CALCIUM-FOLATE',
    title: 'Kalsium dan folat jangan terlewat',
    nutrient: 'Ca + Folat',
    body: [
      'Kalsium (+200 mg/hari): susu, yoghurt, ikan teri, tahu, sayuran hijau.',
      'Folat (+200 mcg/hari): sayuran hijau tua, kacang-kacangan, alpukat, jeruk.',
      'Keduanya penting sejak awal kehamilan untuk tulang janin dan mencegah cacat tabung saraf.',
    ],
  },
];
