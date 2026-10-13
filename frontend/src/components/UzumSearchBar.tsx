import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

interface PopularItem {
  id: string;
  title: string;
  price: string;
  badge: string;
  tag: string;
  img: string;
  query: string;
}

const DEFAULT_HISTORY = [
  "UZI apparati",
  "IVL apparati",
  "Bemor monitori",
  "Shifoxona kravati"
];

const POPULAR_ITEMS: PopularItem[] = [
  {
    id: "pop-1",
    title: "Mindray DP-50 Portativ UZI skaneri",
    price: "38 500 000 so'm",
    badge: "Do'konda bor",
    tag: "UZI diagnostika",
    img: "/uploads/products/medical-diag.jpg",
    query: "UZI"
  },
  {
    id: "pop-2",
    title: "Hamilton-C1 Reanimatsiya IVL ventilyatori",
    price: "65 000 000 so'm",
    badge: "Kafolatli",
    tag: "Reanimatsiya",
    img: "/uploads/products/medical-icu.jpg",
    query: "IVL"
  },
  {
    id: "pop-3",
    title: "Ko'p funksiyali elektr tibbiy kravat",
    price: "12 400 000 so'm",
    badge: "Olib ketishga tayyor",
    tag: "Tibbiy mebel",
    img: "/uploads/products/medical-bed.jpg",
    query: "kravat"
  }
];

export function UzumSearchBar() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [history, setHistory] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("medax_search_history");
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return DEFAULT_HISTORY;
  });

  const wrapperRef = useRef<HTMLDivElement>(null);

  // Close dropdown on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const saveAndSearch = (term: string) => {
    const trimmed = term.trim();
    if (!trimmed) {
      setIsOpen(false);
      navigate("/catalog");
      return;
    }

    const updated = [trimmed, ...history.filter((h) => h.toLowerCase() !== trimmed.toLowerCase())].slice(0, 6);
    setHistory(updated);
    try {
      localStorage.setItem("medax_search_history", JSON.stringify(updated));
    } catch {
      // ignore
    }

    setIsOpen(false);
    navigate(`/catalog?q=${encodeURIComponent(trimmed)}`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveAndSearch(query);
  };

  const handleRemoveHistory = (e: React.MouseEvent, item: string) => {
    e.stopPropagation();
    const updated = history.filter((h) => h !== item);
    setHistory(updated);
    try {
      localStorage.setItem("medax_search_history", JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  const handleClearHistory = (e: React.MouseEvent) => {
    e.stopPropagation();
    setHistory([]);
    try {
      localStorage.setItem("medax_search_history", JSON.stringify([]));
    } catch {
      // ignore
    }
  };

  return (
    <>
      {/* Background Dimming Backdrop (keeps Header & Topbar fully visible on top) */}
      {isOpen && (
        <div
          className="uz-search-backdrop"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      <div className="uz-search-wrap" ref={wrapperRef}>
        <form
          className={`uz-search-form ${isOpen ? "is-open" : ""}`}
          role="search"
          onSubmit={handleSubmit}
        >
          <input
            type="search"
            name="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsOpen(true)}
            className="uz-search-input"
            placeholder="Mahsulotlar va turkumlar izlash (masalan: UZI, IVL, Jarrohlik)..."
            aria-label="Mahsulotlar va turkumlar izlash"
            autoComplete="off"
          />
          <button type="submit" className="uz-search-btn" aria-label="Qidirish">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
          </button>
        </form>

        {/* Uzum-style Search Dropdown */}
        {isOpen && (
          <div className="uz-search-dropdown" role="dialog" aria-label="Qidiruv takliflari">
            {/* Section 1: Recent Searches */}
            {history.length > 0 && (
              <div className="uz-search-section">
                <div className="uz-search-section-header">
                  <h4 className="uz-search-section-title">Yaqinda izlaganlaringiz</h4>
                  <button
                    type="button"
                    className="uz-search-clear-btn"
                    onClick={handleClearHistory}
                  >
                    Tozalash
                  </button>
                </div>

                <div className="uz-search-history-list">
                  {history.map((item) => (
                    <div
                      key={item}
                      className="uz-search-history-item"
                      onClick={() => {
                        setQuery(item);
                        saveAndSearch(item);
                      }}
                    >
                      <div className="uz-search-history-left">
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="uz-clock-icon"
                        >
                          <circle cx="12" cy="12" r="10" />
                          <polyline points="12 6 12 12 16 14" />
                        </svg>
                        <span className="uz-search-history-text">{item}</span>
                      </div>
                      <button
                        type="button"
                        className="uz-search-remove-btn"
                        onClick={(e) => handleRemoveHistory(e, item)}
                        aria-label={`${item} qidiruvini o'chirish`}
                      >
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Section 2: Popular / Trending Medical Items */}
            <div className="uz-search-section popular-section">
              <h4 className="uz-search-section-title">Mashhur</h4>
              <div className="uz-search-popular-grid">
                {POPULAR_ITEMS.map((item) => (
                  <div
                    key={item.id}
                    className="uz-search-popular-card"
                    onClick={() => {
                      setQuery(item.query);
                      saveAndSearch(item.query);
                    }}
                  >
                    <div className="uz-popular-thumb-wrap">
                      <img
                        src={item.img}
                        alt={item.title}
                        className="uz-popular-thumb"
                        loading="lazy"
                      />
                    </div>
                    <div className="uz-popular-info">
                      <span className="uz-popular-price">{item.price}</span>
                      <span className="uz-popular-title">{item.title}</span>
                      <span className="uz-popular-badge">
                        <span>⚡</span> {item.badge}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
