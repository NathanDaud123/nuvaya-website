import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import heroMain from '../assets/hero-main.png';
import heroSecondary from '../assets/hero-secondary.png';
import { ClipboardCheck, Leaf, Clock } from 'lucide-react';

const Home: React.FC = () => {
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
            <h2>Keunggulan Nuvaya</h2>
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
              <p>Dihitung secara akurat berdasarkan umur, berat, tinggi, gaya hidup, dan tingkat stres Anda.</p>
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
        </section>
      </main>
    </>
  );
};

export default Home;
