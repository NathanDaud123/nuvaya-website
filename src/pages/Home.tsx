import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import heroMain from '../assets/hero-main.png';
import heroSecondary from '../assets/hero-secondary.png';
import { ClipboardCheck, Leaf, Clock } from 'lucide-react';
import { StatList, StatRow } from '../components/StatList';

const FAQS = [
  {
    q: 'Dari mana data gizi Mochi berasal?',
    a: 'Perhitungan energi memakai persamaan DRI 2023 khusus kehamilan, target zat gizi memakai AKG Indonesia 2019, target kenaikan berat badan memakai panduan IOM 2009, dan komposisi pangan memakai TKPI 2017.',
  },
  {
    q: 'Apakah hasil Mochi pengganti saran dokter atau bidan?',
    a: 'Bukan. Mochi membantu perencanaan menu harian, tetapi keluhan klinis, tanda bahaya kehamilan, dan keputusan medis tetap harus dikonsultasikan ke tenaga kesehatan.',
  },
  {
    q: 'Bisakah makanannya diganti bila tidak cocok?',
    a: 'Bisa. Setiap baris menu ada tombol Ganti untuk alternatif se-kategori, dan makanan yang tidak disukai atau alergi otomatis dikecualikan sejak awal.',
  },
];

const Home: React.FC = () => {
  const [faqOpen, setFaqOpen] = useState<number | null>(0);

  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: '0px',
      threshold: 0.1,
    };

    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          (entry.target as HTMLElement).style.opacity = '1';
          (entry.target as HTMLElement).style.transform = 'translateY(0)';
          obs.unobserve(entry.target);
        }
      });
    }, observerOptions);

    const sections = document.querySelectorAll('section');
    sections.forEach((section) => {
      (section as HTMLElement).style.opacity = '0';
      (section as HTMLElement).style.transform = 'translateY(10px)';
      (section as HTMLElement).style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
      observer.observe(section);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <>
      <main>
        <section className="hero container">
          <div className="hero-content">
            <span className="eyebrow">Personalized Nutrition</span>
            <h1 className="hero-title">
              Rekomendasi Gizi <em>Disesuaikan</em> untuk Anda.
            </h1>
            <p className="hero-desc">
              Ketahui kebutuhan gizi harian Anda dan dapatkan rekomendasi menu makanan personal dengan teknologi cerdas berbasis profil unik Anda.
            </p>
            <div className="hero-actions">
              <Link to="/profile" className="btn-primary">
                Mulai Kalkulasi Gizi
              </Link>
              <a href="#fitur" className="btn-outline">
                Lihat Fitur
              </a>
            </div>
          </div>
          <div className="hero-visual">
            <div className="img-wrapper main-img">
              <img src={heroMain} alt="Healthy lifestyle" />
            </div>
            <div className="img-wrapper secondary-img">
              <img src={heroSecondary} alt="Healthy food bowl" />
            </div>
          </div>
        </section>

        <section id="fitur" className="features-section container">
          <div className="section-header">
            <h2>Keunggulan Mochi</h2>
            <p style={{ color: 'var(--text-light)', maxWidth: '600px', margin: '0 auto' }}>
              Dapatkan pengalaman merencanakan nutrisi yang cerdas, cepat, dan 100% disesuaikan dengan Anda.
            </p>
          </div>
          <div className="feature-grid">
            <div className="feature-card">
              <div className="feature-icon">
                <ClipboardCheck size={32} strokeWidth={1.5} />
              </div>
              <h3>Akurat & Personal</h3>
              <p>Dihitung secara akurat berdasarkan usia, usia kehamilan, berat badan, dan aktivitas Anda.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <Leaf size={32} strokeWidth={1.5} />
              </div>
              <h3>Beragam Pilihan</h3>
              <p>Mengkombinasikan ratusan bahan pangan lokal secara cerdas untuk menu yang tidak membosankan.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <Clock size={32} strokeWidth={1.5} />
              </div>
              <h3>Cepat & Mudah</h3>
              <p>Dapatkan hasil analisis nutrisi dan rekomendasi menu instan langsung di layar Anda.</p>
            </div>
          </div>
          <div className="stats-strip">
            <div className="stat-strip-item">
              <strong>787+</strong>
              <span>Bahan pangan TKPI</span>
            </div>
            <div className="stat-strip-item">
              <strong>15</strong>
              <span>Zat gizi dihitung personal</span>
            </div>
            <div className="stat-strip-item">
              <strong>3</strong>
              <span>Waktu makan per hari</span>
            </div>
            <div className="stat-strip-item">
              <strong>100%</strong>
              <span>Disesuaikan preferensi ibu</span>
            </div>
          </div>
        </section>

        <section className="band">
          <div className="container landing-block">
          <div className="section-header">
            <span className="eyebrow">Alur</span>
            <h2>Cara Kerja Mochi</h2>
            <p style={{ color: 'var(--text-light)', maxWidth: '600px', margin: '0 auto' }}>
              Tiga langkah mudah dari profil hingga menu harian.
            </p>
          </div>
          <div className="feature-grid">
            <div className="feature-card">
              <div className="feature-icon">
                <span className="step-number">1</span>
              </div>
              <h3>Isi Profil Ibu</h3>
              <p>Usia, usia kehamilan, berat badan, aktivitas, plus makanan yang disukai dan dihindari.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <span className="step-number">2</span>
              </div>
              <h3>Lihat Kebutuhan Gizi</h3>
              <p>Energi (DRI 2023), target zat gizi (AKG 2019), dan status IMT serta GWG Anda.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <span className="step-number">3</span>
              </div>
              <h3>Generate Menu Harian</h3>
              <p>Menu sarapan, makan siang, dan makan malam yang mendekati target gizi harian.</p>
            </div>
          </div>
          </div>
        </section>

        <section className="container landing-block">
          <div className="section-header">
            <span className="eyebrow">Kebutuhan tiap tahap</span>
            <h2>Berbeda Trimester, Berbeda Kebutuhan</h2>
            <p style={{ color: 'var(--text-light)', maxWidth: '600px', margin: '0 auto' }}>
              Tambahan gizi dari AKG dasar menurut trimester kehamilan.
            </p>
          </div>
          <div className="feature-grid">
            <div className="feature-card">
              <div className="feature-icon">
                <span className="step-number">T1</span>
              </div>
              <h3>Trimester 1</h3>
              <p>Minggu 1–13</p>
              <StatList>
                <StatRow label="Energi">+180 kcal</StatRow>
                <StatRow label="Protein">+1 g</StatRow>
                <StatRow label="Zat besi">+0 mg</StatRow>
                <StatRow label="Folat">+200 mcg</StatRow>
              </StatList>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <span className="step-number">T2</span>
              </div>
              <h3>Trimester 2</h3>
              <p>Minggu 14–27</p>
              <StatList>
                <StatRow label="Energi">+300 kcal</StatRow>
                <StatRow label="Protein">+10 g</StatRow>
                <StatRow label="Zat besi">+9 mg</StatRow>
                <StatRow label="Folat">+200 mcg</StatRow>
              </StatList>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <span className="step-number">T3</span>
              </div>
              <h3>Trimester 3</h3>
              <p>Minggu 28+</p>
              <StatList>
                <StatRow label="Energi">+300 kcal</StatRow>
                <StatRow label="Protein">+30 g</StatRow>
                <StatRow label="Zat besi">+9 mg</StatRow>
                <StatRow label="Folat">+200 mcg</StatRow>
              </StatList>
            </div>
          </div>
        </section>

        <section className="band-green">
          <div className="container landing-block">
          <div className="section-header">
            <span className="eyebrow">Pratinjau</span>
            <h2>Contoh Hasil Menu</h2>
            <p style={{ color: 'var(--text-light)', maxWidth: '600px', margin: '0 auto' }}>
              Seperti ini tampilan rekomendasi yang Anda terima.
            </p>
          </div>
          <div className="bordered-panel" style={{ overflowX: 'auto' }}>
            <table className="day-table">
              <thead>
                <tr>
                  <th>Waktu</th>
                  <th>Menu</th>
                  <th>Berat</th>
                  <th>Kalori</th>
                  <th>Protein</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td rowSpan={2} className="meal-cell">Sarapan</td>
                  <td>Nasi Putih</td>
                  <td className="num">200 gram</td>
                  <td className="num">360 kcal</td>
                  <td className="num">6 gram</td>
                </tr>
                <tr>
                  <td>Tempe Goreng</td>
                  <td className="num">50 gram</td>
                  <td className="num">168 kcal</td>
                  <td className="num">10 gram</td>
                </tr>
                <tr>
                  <td rowSpan={2} className="meal-cell">Makan Siang</td>
                  <td>Nasi Beras Merah</td>
                  <td className="num">200 gram</td>
                  <td className="num">298 kcal</td>
                  <td className="num">5,6 gram</td>
                </tr>
                <tr>
                  <td>Ikan Mas Pepes</td>
                  <td className="num">80 gram</td>
                  <td className="num">167 kcal</td>
                  <td className="num">12,2 gram</td>
                </tr>
              </tbody>
            </table>
          </div>
          </div>
        </section>

        <section className="container landing-block">
          <div className="section-header">
            <span className="eyebrow">Sering ditanyakan</span>
            <h2>Pertanyaan Umum</h2>
          </div>
          <div className="faq-list">
            {FAQS.map((f, i) => {
              const open = faqOpen === i;
              return (
                <div key={i} className="bordered-panel">
                  <button
                    type="button"
                    onClick={() => setFaqOpen(open ? null : i)}
                    aria-expanded={open}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '1rem',
                      width: '100%',
                      border: 'none',
                      background: 'none',
                      cursor: 'pointer',
                      textAlign: 'left',
                      padding: 0,
                      font: 'inherit',
                      color: 'inherit',
                    }}
                  >
                    <strong style={{ fontSize: '1.02rem' }}>{f.q}</strong>
                    <span style={{ color: 'var(--primary)', fontSize: '1.25rem' }}>{open ? '−' : '+'}</span>
                  </button>
                  {open && <p style={{ marginTop: '0.75rem', color: 'var(--text-light)', lineHeight: 1.6 }}>{f.a}</p>}
                </div>
              );
            })}
          </div>
        </section>

        <section className="container landing-block">
          <div className="highlight-panel cta-banner">
            <h2>Siap mengetahui kebutuhan gizimu?</h2>
            <p>Isi profil ibu dalam 2 menit dan dapatkan menu harian personal hari ini juga.</p>
            <Link to="/profile" className="btn-primary">
              Mulai Kalkulasi Gizi
            </Link>
          </div>
        </section>
      </main>
    </>
  );
};

export default Home;
