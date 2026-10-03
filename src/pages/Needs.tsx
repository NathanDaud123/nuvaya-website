import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { MochiCalculationResult } from '../models/types';
import { StatList, StatRow } from '../components/StatList';
import { STORAGE_KEYS, loadStored } from '../services/storage';

const Needs: React.FC = () => {
  const navigate = useNavigate();
  const [mochi, setMochi] = useState<MochiCalculationResult | null>(null);

  useEffect(() => {
    const saved = loadStored(STORAGE_KEYS.result);
    if (!saved) {
      navigate('/profile');
      return;
    }
    try {
      setMochi(JSON.parse(saved) as MochiCalculationResult);
    } catch {
      navigate('/profile');
    }
  }, [navigate]);

  if (!mochi) {
    return (
      <div className="container" style={{ padding: '5rem 1rem', textAlign: 'center' }}>
        <h2>Memuat kebutuhan gizi...</h2>
        <div className="loader"></div>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '4rem 1rem' }}>
      <div className="section-header">
        <h2>Kebutuhan dan Target Gizi Saya</h2>
        <p>Hasil perhitungan kebutuhan gizi personal Anda.</p>
      </div>

      <div className="focus-row-3" style={{ marginBottom: '1rem' }}>
        <div className="focus-item bordered-panel">
          <h3>Profil &amp; Status Gizi</h3>
          <StatList>
            <StatRow label="Trimester">{mochi.trimester} (AKG {mochi.akgAgeGroup} th)</StatRow>
            <StatRow label="IMT pra-hamil">{mochi.prepregnancyBmi} - {mochi.bmiCategory}</StatRow>
            <StatRow label="GWG aktual">{mochi.gwgActualKg} kg (target IOM: {mochi.gwgTargetMinKg}–{mochi.gwgTargetMaxKg} kg)</StatRow>
            <StatRow label="EER personal">{mochi.eerKcalDay} kcal/hari</StatRow>
          </StatList>
        </div>
        <div className="focus-item bordered-panel">
          <h3>Target Harian Anda</h3>
          <StatList labelWidth="6.5rem">
            <StatRow label="Kalori">{mochi.gaTarget.calories} kcal</StatRow>
            <StatRow label="Protein">{mochi.gaTarget.protein} g</StatRow>
            <StatRow label="Karbohidrat">{mochi.gaTarget.carbs} g</StatRow>
            <StatRow label="Lemak">{mochi.gaTarget.fat} g</StatRow>
          </StatList>
        </div>
        <div className="focus-item bordered-panel">
          <h3>Target Zat Gizi Prioritas</h3>
          <StatList labelWidth="4.5rem">
            <StatRow label="Protein">{mochi.targets.protein} g/hari</StatRow>
            <StatRow label="Fe">{mochi.targets.iron_mg} mg/hari</StatRow>
            <StatRow label="Ca">{mochi.targets.calcium_mg} mg/hari</StatRow>
            <StatRow label="Folat">{mochi.targets.folate_mcg} mcg/hari</StatRow>
            <StatRow label="Air">{mochi.targets.waterMl} ml/hari</StatRow>
          </StatList>
        </div>
      </div>

      <div style={{ textAlign: 'center', marginTop: '2rem', display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
        <button onClick={() => navigate('/recommendation')} className="btn-primary">
          Generate Menu Rekomendasi
        </button>
        <button onClick={() => navigate('/edukasi')} className="btn-outline">
          Baca Edukasi Gizi
        </button>
      </div>
    </div>
  );
};

export default Needs;
