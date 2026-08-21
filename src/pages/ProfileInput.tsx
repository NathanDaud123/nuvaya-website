import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { UserProfile } from '../models/types';
import { NutritionCalculator } from '../services/NutritionCalculator';

const ProfileInput: React.FC = () => {
  const navigate = useNavigate();

  const [profile, setProfile] = useState<UserProfile>({
    age: 25,
    gender: 'female',
    height: 160,
    weight: 55,
    stressLevel: 3,
    activityLevel: 'medium',
  });

  useEffect(() => {
    const saved = localStorage.getItem('nuvaya_profile');
    if (saved) {
      setProfile(JSON.parse(saved));
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setProfile(prev => ({
      ...prev,
      [name]: name === 'gender' || name === 'activityLevel' ? value : Number(value)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('nuvaya_profile', JSON.stringify(profile));
    const needs = NutritionCalculator.calculate(profile);
    localStorage.setItem('nuvaya_needs', JSON.stringify(needs));
    navigate('/recommendation');
  };

  return (
    <div className="container" style={{ padding: '4rem 1rem', maxWidth: '800px' }}>
      <div className="highlight-panel" style={{ background: 'var(--glass-bg)', border: '1px solid var(--border)', backdropFilter: 'blur(10px)' }}>
        <h2 style={{ marginBottom: '1rem', color: 'var(--primary)' }}>Profil Anda</h2>
        <p style={{ marginBottom: '2rem', color: 'var(--text-light)' }}>
          Masukkan data diri Anda untuk menghitung kebutuhan gizi harian yang tepat.
        </p>

        <form onSubmit={handleSubmit} className="profile-form">
          <div className="form-grid">
            <div className="form-group">
              <label>Umur (tahun)</label>
              <input type="number" name="age" value={profile.age} onChange={handleChange} required min="1" max="120" />
            </div>

            <div className="form-group">
              <label>Jenis Kelamin</label>
              <select name="gender" value={profile.gender} onChange={handleChange}>
                <option value="female">Perempuan</option>
                <option value="male">Laki-laki</option>
              </select>
            </div>

            <div className="form-group">
              <label>Tinggi Badan (cm)</label>
              <input type="number" name="height" value={profile.height} onChange={handleChange} required min="50" max="250" />
            </div>

            <div className="form-group">
              <label>Berat Badan (kg)</label>
              <input type="number" name="weight" value={profile.weight} onChange={handleChange} required min="20" max="300" />
            </div>

            <div className="form-group">
              <label>Tingkat Stres (1-5)</label>
              <input type="range" name="stressLevel" value={profile.stressLevel} onChange={handleChange} min="1" max="5" />
              <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-light)'}}>
                <span>Rendah</span>
                <span>Tinggi</span>
              </div>
            </div>

            <div className="form-group">
              <label>Tingkat Aktivitas</label>
              <select name="activityLevel" value={profile.activityLevel} onChange={handleChange}>
                <option value="low">Rendah (Jarang olahraga)</option>
                <option value="medium">Sedang (Olahraga 3-5 hari/minggu)</option>
                <option value="high">Tinggi (Olahraga berat setiap hari)</option>
              </select>
            </div>
          </div>

          <button type="submit" className="btn-primary" style={{ marginTop: '2rem', width: '100%' }}>
            Kalkulasi Kebutuhan Gizi
          </button>
        </form>
      </div>
    </div>
  );
};

export default ProfileInput;
