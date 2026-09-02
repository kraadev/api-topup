import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { GAME_PRODUCTS } from '../data/products';
import { IconSearch, IconClose, IconArrowRight, IconGamepad } from './Icons';
import { formatRupiah } from '../utils/formatters';

export const SearchModal = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Filter games based on search query
  const results = query.trim()
    ? GAME_PRODUCTS.filter(
        (g) =>
          g.name.toLowerCase().includes(query.toLowerCase()) ||
          g.code.toLowerCase().includes(query.toLowerCase()) ||
          g.publisher.toLowerCase().includes(query.toLowerCase()) ||
          g.category.toLowerCase().includes(query.toLowerCase())
      )
    : GAME_PRODUCTS.slice(0, 5); // Show popular games if query is empty

  const handleSelectGame = (slug) => {
    navigate(`/game/${slug}`);
    onClose();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % results.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + results.length) % results.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (results[selectedIndex]) {
        handleSelectGame(results[selectedIndex].slug);
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="search-palette-card"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        <div className="search-palette-header">
          <IconSearch size={20} className="search-icon-muted" />
          <input
            ref={inputRef}
            type="text"
            className="search-palette-input"
            placeholder="Cari game favoritmu (Mobile Legends, Free Fire, Valorant, dll)..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
          />
          <button type="button" onClick={onClose} className="search-close-btn" title="Tutup">
            <IconClose size={18} />
          </button>
        </div>

        <div className="search-palette-body">
          <div className="search-results-label">
            {query.trim() ? `Hasil Pencarian (${results.length})` : 'Rekomendasi Game Populer'}
          </div>

          {results.length === 0 ? (
            <div className="search-empty-state">
              <IconGamepad size={36} className="text-muted" />
              <p className="empty-title">Game tidak ditemukan</p>
              <p className="empty-desc">Coba gunakan kata kunci lain seperti "MLBB", "Free Fire", atau "Steam".</p>
            </div>
          ) : (
            <div className="search-items-list">
              {results.map((game, idx) => {
                const isSelected = idx === selectedIndex;
                const lowestPrice = game.items?.length
                  ? Math.min(...game.items.map((i) => i.price))
                  : 0;

                return (
                  <div
                    key={game.id}
                    className={`search-item-row ${isSelected ? 'active' : ''}`}
                    onClick={() => handleSelectGame(game.slug)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                  >
                    <div className="search-item-left">
                      <div
                        className="search-game-thumb"
                        style={{ background: game.bannerGradient }}
                      >
                        <span>{game.code}</span>
                      </div>
                      <div className="search-game-info">
                        <div className="search-game-title">
                          <span>{game.name}</span>
                          {game.badge && <span className="search-badge">{game.badge}</span>}
                        </div>
                        <span className="search-game-publisher">{game.publisher} &bull; {game.categoryLabel}</span>
                      </div>
                    </div>

                    <div className="search-item-right">
                      <span className="search-price-label">Mulai dari</span>
                      <span className="search-price-val">{formatRupiah(lowestPrice)}</span>
                      <IconArrowRight size={14} className="search-arrow" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="search-palette-footer">
          <span>Tekan <kbd>↑</kbd> <kbd>↓</kbd> untuk memilih</span>
          <span><kbd>Enter</kbd> untuk membuka</span>
          <span><kbd>ESC</kbd> untuk keluar</span>
        </div>
      </div>
    </div>
  );
};
