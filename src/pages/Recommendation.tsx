import React, { useEffect, useState } from 'react';
import Papa from 'papaparse';
import type { FoodLibrary, RecommendedMenu } from '../services/GeneticAlgorithm';
import { GeneticAlgorithm } from '../services/GeneticAlgorithm';
import type { FoodItem, NutritionalNeeds } from '../models/types';
import { useNavigate } from 'react-router-dom';

const Recommendation: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [needs, setNeeds] = useState<NutritionalNeeds | null>(null);
  const [menu, setMenu] = useState<RecommendedMenu | null>(null);
  const [totals, setTotals] = useState<NutritionalNeeds | null>(null);
  const [totalPrice, setTotalPrice] = useState(0);

  useEffect(() => {
    const savedNeeds = localStorage.getItem('nuvaya_needs');
    if (!savedNeeds) {
      navigate('/profile');
      return;
    }
    
    const parsedNeeds = JSON.parse(savedNeeds) as NutritionalNeeds;
    setNeeds(parsedNeeds);

    loadDatasetsAndRunGA(parsedNeeds);
  }, [navigate]);

  const loadDatasetsAndRunGA = async (targetNeeds: NutritionalNeeds) => {
    try {
      const loadCsv = (filename: string): Promise<FoodItem[]> => {
        return new Promise((resolve) => {
          Papa.parse(`/datasets/${filename}.csv`, {
            download: true,
            header: true,
            dynamicTyping: true,
            complete: (results) => {
              const items = results.data
                .filter((row: any) => row.menu) // remove empty rows
                .map((row: any) => ({
                  no: row.no,
                  menu: row.menu,
                  energy: row.energy || 0,
                  carbo: row.carbo || 0,
                  protein: row.protein || 0,
                  fat: row.fat || 0,
                  price: row.price || 0
                }));
              resolve(items as FoodItem[]);
            }
          });
        });
      };

      const [staple, plant, animal, vegetable, side] = await Promise.all([
        loadCsv('rec_source_staple'),
        loadCsv('rec_source_plant'),
        loadCsv('rec_source_animal'),
        loadCsv('rec_source_vegetable'),
        loadCsv('rec_source_side')
      ]);

      const library: FoodLibrary = {
        mp: staple,
        sn: plant,
        sh: animal,
        sy: vegetable,
        plk: side
      };

      // Run GA
      const recommended = GeneticAlgorithm.run(library, targetNeeds);
      if (recommended) {
        setMenu(recommended);
        
        // calculate totals
        const allItems = [...recommended.breakfast, ...recommended.lunch, ...recommended.dinner];
        const cal = allItems.reduce((acc, item) => acc + item.energy, 0);
        const pro = allItems.reduce((acc, item) => acc + item.protein, 0);
        const carb = allItems.reduce((acc, item) => acc + item.carbo, 0);
        const fat = allItems.reduce((acc, item) => acc + item.fat, 0);
        const price = allItems.reduce((acc, item) => acc + item.price, 0);
        
        setTotals({ calories: Math.round(cal), protein: Math.round(pro), carbs: Math.round(carb), fat: Math.round(fat), fiber: 0 });
        setTotalPrice(price);
      }
      setLoading(false);
    } catch (error) {
      console.error("Error loading datasets", error);
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="container" style={{ padding: '5rem 1rem', textAlign: 'center' }}><h2>Memproses Rekomendasi GA...</h2><div className="loader"></div></div>;
  }

  return (
    <div className="container" style={{ padding: '4rem 1rem' }}>
      <div className="section-header">
        <h2>Rekomendasi Menu Anda</h2>
        <p>Menu ini disusun menggunakan AI Canggih untuk mendekati target gizi harian Anda.</p>
      </div>

      {needs && totals && (
        <div className="focus-row" style={{ marginBottom: '3rem' }}>
          <div className="focus-item bordered-panel">
            <h3>Target Harian Anda</h3>
            <ul className="clean-list" style={{ marginTop: '0.75rem' }}>
              <li><strong>Kalori:</strong> {needs.calories} kcal</li>
              <li><strong>Protein:</strong> {needs.protein} g</li>
              <li><strong>Karbohidrat:</strong> {needs.carbs} g</li>
              <li><strong>Lemak:</strong> {needs.fat} g</li>
            </ul>
          </div>
          <div className="focus-item highlight-panel" style={{ padding: '1.25rem' }}>
            <h3>Total Menu Rekomendasi</h3>
            <ul className="clean-list" style={{ marginTop: '0.75rem' }}>
              <li><strong>Kalori:</strong> {totals.calories} kcal</li>
              <li><strong>Protein:</strong> {totals.protein} g</li>
              <li><strong>Karbohidrat:</strong> {totals.carbs} g</li>
              <li><strong>Lemak:</strong> {totals.fat} g</li>
              <li style={{ marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border)' }}>
                <strong>Estimasi Harga:</strong> Rp {totalPrice.toLocaleString('id-ID')}
              </li>
            </ul>
          </div>
        </div>
      )}

      {menu && (
        <div className="menu-grid">
          {Object.entries(menu).map(([time, items]) => (
            <div key={time} className="focus-item bordered-panel menu-card">
              <h3 style={{ textTransform: 'capitalize', color: 'var(--primary)' }}>
                {time === 'breakfast' ? 'Sarapan' : time === 'lunch' ? 'Makan Siang' : 'Makan Malam'}
              </h3>
              <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {items.map((item, idx) => (
                  <div key={idx} className="menu-item">
                    <strong>{item.menu}</strong>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-light)', marginTop: '0.1rem' }}>
                      {item.energy} kcal • P:{item.protein}g • K:{item.carbo}g • L:{item.fat}g
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
      
      <div style={{ textAlign: 'center', marginTop: '2rem' }}>
        <button onClick={() => { setLoading(true); if(needs) loadDatasetsAndRunGA(needs); }} className="btn-primary">
          Generate Ulang Menu
        </button>
      </div>
    </div>
  );
};

export default Recommendation;
