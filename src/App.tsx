import { BrowserRouter as Router, Routes, Route, Link, NavLink } from 'react-router-dom';
import Home from './pages/Home';
import ProfileInput from './pages/ProfileInput';
import Needs from './pages/Needs';
import Recommendation from './pages/Recommendation';
import Targets from './pages/Targets';
import Education from './pages/Education';
import RouteMeta from './components/RouteMeta';
import './index.css';

const navClass = ({ isActive }: { isActive: boolean }) => `nav-link${isActive ? ' active' : ''}`;

function App() {
  return (
    <Router>
      <RouteMeta />
      <header className="site-header">
        <div className="container header-inner">
          <Link to="/" className="brand">
            <img src="/logo.svg" alt="" />
            Mochi
          </Link>
          <nav className="main-nav" aria-label="Utama">
            <NavLink to="/edukasi" className={navClass}>
              Edukasi
            </NavLink>
            <NavLink to="/targets" className={(s) => `${navClass(s)} hide-sm`}>
              Target saya
            </NavLink>
            <Link to="/profile" className="btn btn-primary btn-small nav-cta">
              Hitung gizi
            </Link>
          </nav>
        </div>
      </header>

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/profile" element={<ProfileInput />} />
        <Route path="/needs" element={<Needs />} />
        <Route path="/recommendation" element={<Recommendation />} />
        <Route path="/targets" element={<Targets />} />
        <Route path="/edukasi" element={<Education />} />
      </Routes>

      <footer className="site-footer">
        <div className="container">
          <div className="footer-grid">
            <div className="footer-brand">
              <Link to="/" className="brand">
                <img src="/logo.svg" alt="" />
                Mochi
              </Link>
              <p>
                Kebutuhan gizi dan menu harian untuk ibu hamil di Indonesia. Bukan pengganti pemeriksaan bidan atau
                dokter.
              </p>
            </div>
            <div className="footer-refs">
              <h3>Dasar perhitungan</h3>
              <ol>
                <li>NASEM. Dietary Reference Intakes for Energy, 2023.</li>
                <li>Permenkes RI No. 28/2019 tentang Angka Kecukupan Gizi.</li>
                <li>IOM. Weight Gain During Pregnancy, 2009.</li>
                <li>Kemenkes RI. Tabel Komposisi Pangan Indonesia 2017.</li>
              </ol>
            </div>
          </div>
        </div>
      </footer>
    </Router>
  );
}

export default App;
