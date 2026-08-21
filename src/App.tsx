import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Home from './pages/Home';
import ProfileInput from './pages/ProfileInput';
import Recommendation from './pages/Recommendation';
import './index.css';

function App() {
  return (
    <Router>
      <header className="site-header">
        <div className="container header-inner">
          <Link to="/" className="brand" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <img src="/logo.svg" alt="Nuvaya Logo" style={{ width: '32px', height: '32px' }} />
            Nuvaya
          </Link>
          <nav className="main-nav">
            <Link to="/">Beranda</Link>
            <Link to="/profile" className="btn-primary">
              Kalkulasi Gizi
            </Link>
          </nav>
        </div>
      </header>

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/profile" element={<ProfileInput />} />
        <Route path="/recommendation" element={<Recommendation />} />
      </Routes>

      <footer className="site-footer">
        <div className="container footer-inner">
          <div className="footer-brand">
            <h3>Nuvaya</h3>
            <p>Sistem Rekomendasi Diet Personal Berbasis Web untuk Nutrisi Optimal.</p>
          </div>
          <div className="footer-links">
            <a href="#">Kebijakan Privasi</a>
            <a href="#">Syarat dan Ketentuan</a>
            <a href="#">Kontak Peneliti</a>
          </div>
        </div>
      </footer>
    </Router>
  );
}

export default App;
