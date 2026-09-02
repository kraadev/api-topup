import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { formatRupiah } from '../utils/formatters';
import { IconCalculator, IconSparkles, IconArrowRight, IconGamepad } from '../components/Icons';

export const CalculatorPage = () => {
  const [activeTab, setActiveTab] = useState('magicwheel');

  // Magic Wheel State
  const [currentPoints, setCurrentPoints] = useState(100);
  const targetPoints = 200;
  const remainingPoints = Math.max(0, targetPoints - currentPoints);
  // Asumsi: 5 draw = 270 diamonds (mendapatkan rata-rata 5 points) -> ~54 diamonds per point
  const estimatedDiamondsMW = remainingPoints * 54;
  const estimatedPriceMW = Math.round((estimatedDiamondsMW / 86) * 20000);

  // Zodiac Summon State
  const [currentZodiac, setCurrentZodiac] = useState(50);
  const targetZodiac = 100;
  const remainingZodiac = Math.max(0, targetZodiac - currentZodiac);
  // Asumsi: 1 draw = 20 diamonds (mendapatkan 1 point) -> ~20 diamonds per point
  const estimatedDiamondsZodiac = remainingZodiac * 20;
  const estimatedPriceZodiac = Math.round((estimatedDiamondsZodiac / 86) * 20000);

  // Win Rate Calculator State
  const [totalMatch, setTotalMatch] = useState(500);
  const [currentWR, setCurrentWR] = useState(55);
  const [targetWR, setTargetWR] = useState(65);

  const calculateRequiredWins = () => {
    const tMatch = Number(totalMatch) || 0;
    const cWR = Number(currentWR) || 0;
    const tWR = Number(targetWR) || 0;

    if (tWR <= cWR || tWR >= 100 || tMatch <= 0) return 0;
    const currentWins = (tMatch * cWR) / 100;
    const requiredWins = Math.ceil((tWR * tMatch - 100 * currentWins) / (100 - tWR));
    return requiredWins > 0 ? requiredWins : 0;
  };

  return (
    <div className="calculator-page">
      <div className="page-header text-center">
        <div className="status-icon-box success" style={{ margin: '0 auto 1rem' }}>
          <IconCalculator size={32} />
        </div>
        <h1 className="page-title">Kalkulator Gaming & Estimator</h1>
        <p className="page-desc" style={{ maxWidth: '600px', margin: '0.4rem auto 0' }}>
          Hitung estimasi diamond yang dibutuhkan untuk Magic Wheel, Zodiac Summon, dan target Win Rate game kamu secara akurat.
        </p>
      </div>

      {/* Tool Tabs */}
      <div className="calc-tabs-row">
        <button
          type="button"
          className={`calc-tab-btn ${activeTab === 'magicwheel' ? 'active' : ''}`}
          onClick={() => setActiveTab('magicwheel')}
        >
          <IconSparkles size={16} />
          <span>Magic Wheel MLBB</span>
        </button>

        <button
          type="button"
          className={`calc-tab-btn ${activeTab === 'zodiac' ? 'active' : ''}`}
          onClick={() => setActiveTab('zodiac')}
        >
          <IconGamepad size={16} />
          <span>Zodiac Summon</span>
        </button>

        <button
          type="button"
          className={`calc-tab-btn ${activeTab === 'winrate' ? 'active' : ''}`}
          onClick={() => setActiveTab('winrate')}
        >
          <IconCalculator size={16} />
          <span>Win Rate Estimator</span>
        </button>
      </div>

      {/* Calculator Container */}
      <div className="calc-card">
        {/* TAB 1: MAGIC WHEEL */}
        {activeTab === 'magicwheel' && (
          <div className="calc-content-block">
            <div className="calc-header-info">
              <h3 className="calc-sub-title">Kalkulator Magic Wheel (Legend Skin)</h3>
              <p className="calc-sub-desc">
                Masukkan jumlah Magic Point yang kamu miliki saat ini untuk menghitung sisa diamond yang dibutuhkan hingga mencapai 200 Magic Core.
              </p>
            </div>

            <div className="calc-form-grid">
              <div className="calc-input-col">
                <label className="field-label">Magic Point Saat Ini (0 - 199)</label>
                <div className="slider-wrapper">
                  <input
                    type="range"
                    min="0"
                    max="199"
                    value={currentPoints}
                    onChange={(e) => setCurrentPoints(Number(e.target.value))}
                    className="range-slider"
                  />
                  <div className="slider-val-box">
                    <input
                      type="number"
                      min="0"
                      max="199"
                      value={currentPoints}
                      onChange={(e) => setCurrentPoints(Math.min(199, Math.max(0, Number(e.target.value))))}
                      className="text-input text-center"
                      style={{ maxWidth: '100px' }}
                    />
                    <span className="unit-label">/ 200 Poin</span>
                  </div>
                </div>
              </div>

              <div className="calc-result-box">
                <div className="result-metric">
                  <span className="metric-label">Sisa Magic Point:</span>
                  <span className="metric-val text-cyan">{remainingPoints} Poin</span>
                </div>

                <div className="result-metric">
                  <span className="metric-label">Estimasi Kebutuhan Diamond:</span>
                  <span className="metric-val text-amber">{estimatedDiamondsMW.toLocaleString('id-ID')} Diamonds</span>
                </div>

                <div className="result-divider" />

                <div className="result-metric total">
                  <span className="metric-label">Estimasi Total Biaya Top-Up:</span>
                  <span className="metric-val total-price">{formatRupiah(estimatedPriceMW)}</span>
                </div>

                <Link to="/game/mobile-legends" className="btn-solid calc-cta-btn">
                  <span>Top Up Diamond MLBB Sekarang</span>
                  <IconArrowRight size={16} />
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: ZODIAC */}
        {activeTab === 'zodiac' && (
          <div className="calc-content-block">
            <div className="calc-header-info">
              <h3 className="calc-sub-title">Kalkulator Zodiac Summon (Zodiac Skin)</h3>
              <p className="calc-sub-desc">
                Hitung sisa diamond yang dibutuhkan untuk mendapatkan Skin Zodiac (target 100 Star Power).
              </p>
            </div>

            <div className="calc-form-grid">
              <div className="calc-input-col">
                <label className="field-label">Star Power Saat Ini (0 - 99)</label>
                <div className="slider-wrapper">
                  <input
                    type="range"
                    min="0"
                    max="99"
                    value={currentZodiac}
                    onChange={(e) => setCurrentZodiac(Number(e.target.value))}
                    className="range-slider"
                  />
                  <div className="slider-val-box">
                    <input
                      type="number"
                      min="0"
                      max="99"
                      value={currentZodiac}
                      onChange={(e) => setCurrentZodiac(Math.min(99, Math.max(0, Number(e.target.value))))}
                      className="text-input text-center"
                      style={{ maxWidth: '100px' }}
                    />
                    <span className="unit-label">/ 100 Power</span>
                  </div>
                </div>
              </div>

              <div className="calc-result-box">
                <div className="result-metric">
                  <span className="metric-label">Sisa Star Power:</span>
                  <span className="metric-val text-cyan">{remainingZodiac} Power</span>
                </div>

                <div className="result-metric">
                  <span className="metric-label">Estimasi Kebutuhan Diamond:</span>
                  <span className="metric-val text-amber">{estimatedDiamondsZodiac.toLocaleString('id-ID')} Diamonds</span>
                </div>

                <div className="result-divider" />

                <div className="result-metric total">
                  <span className="metric-label">Estimasi Total Biaya Top-Up:</span>
                  <span className="metric-val total-price">{formatRupiah(estimatedPriceZodiac)}</span>
                </div>

                <Link to="/game/mobile-legends" className="btn-solid calc-cta-btn">
                  <span>Top Up Diamond MLBB Sekarang</span>
                  <IconArrowRight size={16} />
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: WIN RATE */}
        {activeTab === 'winrate' && (
          <div className="calc-content-block">
            <div className="calc-header-info">
              <h3 className="calc-sub-title">Kalkulator Win Rate Game</h3>
              <p className="calc-sub-desc">
                Hitung berapa kali kemenangan beruntun (Win Streak) tanpa kalah yang dibutuhkan untuk mencapai target Win Rate idamanmu.
              </p>
            </div>

            <div className="calc-form-grid">
              <div className="calc-input-col">
                <div className="input-field-group" style={{ marginBottom: '1rem' }}>
                  <label className="field-label">Total Match Saat Ini</label>
                  <input
                    type="number"
                    className="text-input"
                    value={totalMatch}
                    onChange={(e) => setTotalMatch(e.target.value)}
                    min="1"
                  />
                </div>

                <div className="input-field-group" style={{ marginBottom: '1rem' }}>
                  <label className="field-label">Win Rate Saat Ini (%)</label>
                  <input
                    type="number"
                    className="text-input"
                    value={currentWR}
                    onChange={(e) => setCurrentWR(e.target.value)}
                    min="0"
                    max="99"
                    step="0.1"
                  />
                </div>

                <div className="input-field-group">
                  <label className="field-label">Target Win Rate yang Diinginkan (%)</label>
                  <input
                    type="number"
                    className="text-input"
                    value={targetWR}
                    onChange={(e) => setTargetWR(e.target.value)}
                    min="0"
                    max="99"
                    step="0.1"
                  />
                </div>
              </div>

              <div className="calc-result-box">
                <div className="result-metric">
                  <span className="metric-label">Target Kemenangan Beruntun (Win Streak):</span>
                  <span className="metric-val total-price" style={{ fontSize: '2rem' }}>
                    {calculateRequiredWins()} Kemenangan
                  </span>
                </div>
                <p className="field-hint" style={{ marginTop: '0.5rem', lineHeight: '1.4' }}>
                  Kamu butuh memenangkan <strong>{calculateRequiredWins()} match</strong> secara berturut-turut tanpa kekalahan untuk menaikkan Win Rate dari <strong>{currentWR}%</strong> menjadi <strong>{targetWR}%</strong>.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
