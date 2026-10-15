import React from 'react';
import { Link } from 'react-router-dom';
import { NutritionCalculator } from '../services/NutritionCalculator';
import { PREGNANCY_INCREMENT, TRIMESTER_BOUNDARIES } from '../data/mochiConfig';
import type { MaternalProfile, Trimester } from '../models/types';

/** Contoh hitung dari spesifikasi MOCHI (bagian 13) — dihitung langsung oleh mesin, bukan angka tempelan. */
const EXAMPLE_PROFILE: MaternalProfile = {
  maternalAgeYears: 27,
  heightCm: 158,
  prepregnancyWeightKg: 52,
  currentWeightKg: 59,
  gestationalAgeWeeks: 24,
  physicalActivityCategory: 'low_active',
};
const example = NutritionCalculator.calculateMochi(EXAMPLE_PROFILE);

const fmt = (n: number) => n.toLocaleString('id-ID', { maximumFractionDigits: 1 });

const TRIMESTER_ROWS: Array<{ label: string; key: 'energyKcal' | 'proteinG' | 'iron_mg' | 'calcium_mg' | 'folate_mcg' }> = [
  { label: 'Energi (kkal)*', key: 'energyKcal' },
  { label: 'Protein (g)', key: 'proteinG' },
  { label: 'Zat besi (mg)', key: 'iron_mg' },
  { label: 'Kalsium (mg)', key: 'calcium_mg' },
  { label: 'Folat (mcg)', key: 'folate_mcg' },
];

const TRIMESTER_COLS: Array<{ t: Trimester; weeks: string }> = [
  { t: 1, weeks: `minggu 1–${TRIMESTER_BOUNDARIES.t1MaxWeeks}` },
  { t: 2, weeks: `minggu ${TRIMESTER_BOUNDARIES.t1MaxWeeks + 1}–${TRIMESTER_BOUNDARIES.t2MaxWeeks}` },
  { t: 3, weeks: `minggu ${TRIMESTER_BOUNDARIES.t2MaxWeeks + 1}–40` },
];

const FAQS = [
  {
    q: 'Apakah Mochi pengganti bidan atau dokter?',
    a: 'Bukan. Mochi membantu merencanakan makan sehari-hari. Keluhan, tanda bahaya kehamilan, dan keputusan soal obat atau tablet tambah darah tetap dibicarakan dengan tenaga kesehatan.',
  },
  {
    q: 'Kenapa kebutuhan energi saya beda dengan angka AKG?',
    a: 'AKG memberi satu angka untuk semua perempuan seusia. Mochi memakai persamaan DRI 2023 yang ikut memperhitungkan tinggi, berat, minggu kehamilan, dan aktivitas Ibu, jadi hasilnya bisa sedikit di atas atau di bawah AKG.',
  },
  {
    q: 'Bagaimana kalau ada makanan yang tidak saya suka atau bikin alergi?',
    a: 'Tulis di profil. Makanan itu tidak dimasukkan ke menu. Kalau satu menu tetap tidak cocok, tekan Ganti untuk pilihan lain dari kelompok yang sama.',
  },
  {
    q: 'Data saya dikirim ke mana?',
    a: 'Tidak ke mana-mana. Semua isian tersimpan di browser perangkat Ibu sendiri, dan bisa dihapus kapan saja dari halaman profil.',
  },
];

const Home: React.FC = () => {
  return (
    <main>
      <section className="container hero">
        <div>
          <span className="kicker">Untuk ibu hamil, trimester 1 sampai 3</span>
          <h1 className="hero-title">
            Makan untuk dua, <span className="hl">tanpa menghitung sendiri.</span>
          </h1>
          <p className="lede">
            Isi usia kehamilan, tinggi, dan berat badan Ibu. Mochi menghitung kebutuhan energi dan zat gizi
            harian, lalu menyusun menu dari makanan rumahan: nasi, tempe, sayur asem, pepes ikan.
          </p>
          <div className="hero-actions">
            <Link to="/profile" className="btn btn-primary">
              Mulai hitung
            </Link>
            <a href="#cara-kerja" className="link-arrow">
              Lihat cara kerjanya
            </a>
          </div>
          <p className="hero-fine">Sekitar 2 menit. Tanpa daftar akun — data tersimpan di HP Ibu sendiri.</p>
        </div>

        <div className="note-stack" aria-label="Contoh hasil perhitungan">
          <div className="note-card back" aria-hidden="true" />
          <div className="note-card">
            <div className="note-head">
              <span>Contoh: Ibu R., {EXAMPLE_PROFILE.maternalAgeYears} th</span>
              <span>Minggu ke-{EXAMPLE_PROFILE.gestationalAgeWeeks}</span>
            </div>
            <p className="note-energy">
              {fmt(example.eerKcalDay)}
              <small>kkal/hari</small>
            </p>
            <ul className="note-rows">
              <li>
                <span>Protein</span>
                <span>{fmt(example.targets.protein)} g</span>
              </li>
              <li>
                <span>Zat besi</span>
                <span>{fmt(example.targets.iron_mg)} mg</span>
              </li>
              <li>
                <span>Kalsium</span>
                <span>{fmt(example.targets.calcium_mg)} mg</span>
              </li>
              <li>
                <span>Folat</span>
                <span>{fmt(example.targets.folate_mcg)} mcg</span>
              </li>
            </ul>
            <p className="note-foot">
              TB {EXAMPLE_PROFILE.heightCm} cm, BB {EXAMPLE_PROFILE.prepregnancyWeightKg} → {EXAMPLE_PROFILE.currentWeightKg} kg,
              aktivitas sedikit aktif. Dihitung oleh mesin yang sama dengan yang Ibu pakai.
            </p>
          </div>
        </div>
      </section>

      <section className="container section section-flush">
        <div className="section-head">
          <h2>Angkanya dari mana?</h2>
          <p>Setiap target mengikuti pedoman yang juga dipakai tenaga gizi. Tidak ada angka karangan.</p>
        </div>
        <dl className="refs">
          <div className="ref">
            <dt>Kebutuhan energi</dt>
            <dd>
              DRI 2023
              <small>Persamaan khusus kehamilan: usia, tinggi, berat, minggu kehamilan, aktivitas.</small>
            </dd>
          </div>
          <div className="ref">
            <dt>Target zat gizi</dt>
            <dd>
              AKG 2019
              <small>Kebutuhan perempuan seusia Ibu, ditambah sesuai trimester.</small>
            </dd>
          </div>
          <div className="ref">
            <dt>Kenaikan berat badan</dt>
            <dd>
              IOM 2009
              <small>Rentang yang wajar menurut IMT sebelum hamil, dihitung sampai minggu ini.</small>
            </dd>
          </div>
          <div className="ref">
            <dt>Kandungan gizi menu</dt>
            <dd>
              TKPI 2017
              <small>Tabel Komposisi Pangan Indonesia dari Kemenkes, untuk setiap masakan di menu.</small>
            </dd>
          </div>
        </dl>
      </section>

      <section id="cara-kerja" className="section section-band">
        <div className="container">
          <div className="section-head">
            <h2>Empat langkah, sekali duduk</h2>
          </div>
          <ol className="steps">
            <li className="step">
              <h3>Isi profil</h3>
              <p>Usia, tinggi, berat sebelum hamil dan sekarang, minggu kehamilan, dan seberapa aktif Ibu sehari-hari.</p>
            </li>
            <li className="step">
              <h3>Lihat kebutuhan</h3>
              <p>Energi dan zat gizi harian, plus kenaikan berat badan Ibu dibanding rentang IOM untuk minggu ini.</p>
            </li>
            <li className="step">
              <h3>Dapat menu</h3>
              <p>Tiga kali makan dan dua kali selingan. Ada yang tidak cocok? Tekan Ganti.</p>
            </li>
            <li className="step">
              <h3>Pasang target</h3>
              <p>Pilih satu-dua kebiasaan kecil untuk minggu ini, lalu centang kalau sudah jalan.</p>
            </li>
          </ol>
        </div>
      </section>

      <section className="container section">
        <div className="section-head">
          <h2>Tiap trimester, tambahannya beda</h2>
          <p>
            Tambahan dari AKG 2019 di atas kebutuhan perempuan yang tidak hamil. Yang paling terasa: protein
            naik {PREGNANCY_INCREMENT[3].proteinG} gram di trimester 3.
          </p>
        </div>
        <div className="tri-wrap">
          <table className="tri-table">
            <thead>
              <tr>
                <th scope="col">Tambahan per hari</th>
                {TRIMESTER_COLS.map((c) => (
                  <th key={c.t} scope="col">
                    Trimester {c.t}
                    <span>{c.weeks}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {TRIMESTER_ROWS.map((row) => (
                <tr key={row.key}>
                  <td>{row.label}</td>
                  {TRIMESTER_COLS.map((c) => {
                    const v = PREGNANCY_INCREMENT[c.t][row.key] ?? 0;
                    return (
                      <td key={c.t} className={v === 0 ? 'zero' : undefined}>
                        +{fmt(v)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="note" style={{ marginTop: '0.75rem' }}>
          *Energi AKG hanya pembanding. Target energi pribadi Ibu dihitung dengan persamaan DRI 2023.
        </p>
      </section>

      <section className="container section section-flush">
        <div className="section-head">
          <h2>Yang sering ditanyakan</h2>
        </div>
        <div className="faq">
          {FAQS.map((f, i) => (
            <details key={f.q} open={i === 0}>
              <summary>{f.q}</summary>
              <p>{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="container">
        <div className="closing">
          <div>
            <h2>Mulai dari minggu kehamilan Ibu sekarang.</h2>
            <p>Siapkan berat badan sebelum hamil — biasanya bisa dilihat di Buku KIA.</p>
          </div>
          <Link to="/profile" className="btn btn-primary">
            Mulai hitung
          </Link>
        </div>
      </section>
    </main>
  );
};

export default Home;
