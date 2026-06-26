import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface NavigationItem {
  label: string;
  hasDropdown?: boolean;
  onClick?: () => void;
}

interface CategoryCard {
  image: string;
  category: string;
  title: string;
  count?: string;
  href?: string;
  onClick?: () => void;
}

interface TrustStat {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

interface PulseFitHeroProps {
  logo?: string;
  navigation?: NavigationItem[];
  ctaButton?: {
    label: string;
    onClick: () => void;
  };
  title: string;
  titleAccent?: string;
  subtitle: string;
  showSearch?: boolean;
  searchPlaceholder?: string;
  onSearch?: (query: string) => void;
  popularTags?: string[];
  trustStats?: TrustStat[];
  primaryAction?: {
    label: string;
    onClick: () => void;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  disclaimer?: string;
  programs?: CategoryCard[];
  showHeader?: boolean;
  backgroundImage?: string;
  className?: string;
  children?: React.ReactNode;
}

export function PulseFitHero({
  logo = "Malir Market",
  navigation = [
    { label: "Browse" },
    { label: "Categories", hasDropdown: true },
    { label: "Listings" },
    { label: "About" },
    { label: "Contact" },
  ],
  ctaButton,
  title,
  titleAccent,
  subtitle,
  showSearch = false,
  searchPlaceholder = "Search for cars, electronics, property...",
  onSearch,
  popularTags,
  trustStats,
  primaryAction,
  secondaryAction,
  disclaimer,
  programs = [],
  showHeader = true,
  backgroundImage,
  className,
  children,
}: PulseFitHeroProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("malir-recent-searches") || "[]");
    } catch {
      return [];
    }
  });

  const handleSearch = () => {
    const q = searchQuery.trim();
    if (onSearch) onSearch(searchQuery);
    if (q) {
      const updated = [q, ...recentSearches.filter((s) => s !== q)].slice(0, 5);
      setRecentSearches(updated);
      localStorage.setItem("malir-recent-searches", JSON.stringify(updated));
    }
  };

  const applyRecent = (term: string) => {
    setSearchQuery(term);
    if (onSearch) onSearch(term);
  };

  const clearRecent = (e: React.MouseEvent, term: string) => {
    e.stopPropagation();
    const updated = recentSearches.filter((s) => s !== term);
    setRecentSearches(updated);
    localStorage.setItem("malir-recent-searches", JSON.stringify(updated));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleSearch();
  };

  const cardWidth = 380;
  const cardGap = 20;
  const cardPitch = cardWidth + cardGap;
  const scrollDistance = programs.length * cardPitch;
  const scrollDuration = Math.max(programs.length * 3.8, 16);

  const heroBackground = backgroundImage
    ? `linear-gradient(160deg, rgba(7,30,17,0.92) 0%, rgba(10,42,24,0.82) 30%, rgba(14,61,40,0.68) 65%, rgba(26,107,69,0.52) 100%), url(${backgroundImage})`
    : "linear-gradient(160deg, #071e11 0%, #0a2a18 25%, #0e3d28 55%, #1a6b45 100%)";

  return (
    <section
      className={cn("relative w-full flex flex-col overflow-hidden", className)}
      style={{
        background: heroBackground,
        backgroundSize: backgroundImage ? "cover" : undefined,
        backgroundPosition: backgroundImage ? "center" : undefined,
      }}
      role="banner"
      aria-label="Hero section"
    >
      {/* Decorative concentric rings — depth and atmosphere */}
      <div
        aria-hidden="true"
        className="absolute pointer-events-none"
        style={{
          top: "-28%",
          right: "-6%",
          width: "65vw",
          height: "65vw",
          borderRadius: "50%",
          border: "1px solid rgba(255,255,255,0.05)",
        }}
      />
      <div
        aria-hidden="true"
        className="absolute pointer-events-none"
        style={{
          top: "-14%",
          right: "-14%",
          width: "44vw",
          height: "44vw",
          borderRadius: "50%",
          border: "1px solid rgba(255,255,255,0.03)",
        }}
      />

      {/* ── Header (optional — hide when an external Navbar is present) ── */}
      {showHeader && (
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="relative z-20 flex flex-row justify-between items-center px-8 lg:px-16"
          style={{ paddingTop: "28px", paddingBottom: "28px" }}
        >
          <div
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 700,
              fontSize: "22px",
              color: "#ffffff",
            }}
          >
            {logo}
          </div>

          <nav className="hidden lg:flex flex-row items-center gap-8" aria-label="Main navigation">
            {navigation.map((item, index) => (
              <button
                key={index}
                onClick={item.onClick}
                className="flex flex-row items-center gap-1 transition-opacity hover:opacity-70"
                style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: "15px",
                  fontWeight: 400,
                  color: "rgba(255,255,255,0.75)",
                }}
              >
                {item.label}
                {item.hasDropdown && (
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                    <path
                      d="M4 6L8 10L12 6"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </button>
            ))}
          </nav>

          {ctaButton && (
            <button
              onClick={ctaButton.onClick}
              className="px-5 py-2.5 rounded-full transition-all hover:scale-105"
              style={{
                background: "rgba(255,255,255,0.1)",
                border: "1px solid rgba(255,255,255,0.2)",
                fontFamily: "var(--font-sans)",
                fontSize: "14px",
                fontWeight: 500,
                color: "#ffffff",
                backdropFilter: "blur(8px)",
              }}
            >
              {ctaButton.label}
            </button>
          )}
        </motion.header>
      )}

      {/* ── Main Hero Content ── */}
      {children ? (
        <div className="relative z-10 flex-1 flex items-center justify-center w-full">
          {children}
        </div>
      ) : (
        <div
          className="relative z-10 flex flex-col items-center text-center px-5 sm:px-6"
          style={{ paddingTop: showHeader ? "48px" : "80px", paddingBottom: "64px" }}
        >
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col items-center"
            style={{ gap: "24px", maxWidth: "720px", width: "100%" }}
          >
            {/* Title */}
            <h1
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 800,
                fontSize: "clamp(2.4rem, 6vw, 4rem)",
                lineHeight: 1.08,
                color: "#ffffff",
                letterSpacing: "-0.03em",
              }}
            >
              {title}
              {titleAccent && (
                <>
                  <br />
                  <span
                    style={{
                      background:
                        "linear-gradient(110deg, #a8e4c4 0%, #6ecf94 55%, #5ec87a 100%)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                      display: "block",
                    }}
                  >
                    {titleAccent}
                  </span>
                </>
              )}
            </h1>

            {/* Subtitle */}
            <p
              style={{
                fontFamily: "var(--font-sans)",
                fontWeight: 400,
                fontSize: "clamp(15px, 2vw, 18px)",
                lineHeight: 1.7,
                color: "rgba(255,255,255,0.7)",
                maxWidth: "460px",
              }}
            >
              {subtitle}
            </p>

            {/* Search bar — primary marketplace interaction */}
            {showSearch && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
                className="w-full"
                style={{ maxWidth: "600px" }}
              >
                <div
                  className="flex items-center"
                  role="search"
                  style={{
                    background: "rgba(255,255,255,0.97)",
                    borderRadius: "9999px",
                    padding: "6px 6px 6px 20px",
                    boxShadow:
                      "0 2px 6px rgba(0,0,0,0.12), 0 12px 40px rgba(0,0,0,0.24), inset 0 1px 0 rgba(255,255,255,0.8)",
                    border: "1px solid rgba(255,255,255,0.5)",
                    gap: "8px",
                  }}
                >
                  <svg
                    width="17"
                    height="17"
                    viewBox="0 0 20 20"
                    fill="none"
                    stroke="#9a9997"
                    strokeWidth="2"
                    aria-hidden="true"
                    style={{ flexShrink: 0 }}
                  >
                    <circle cx="9" cy="9" r="6" />
                    <path d="M15 15l3 3" strokeLinecap="round" />
                  </svg>
                  <input
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={searchPlaceholder}
                    aria-label="Search listings"
                    style={{
                      flex: 1,
                      border: "none",
                      outline: "none",
                      fontSize: "15px",
                      color: "#1b1b19",
                      background: "transparent",
                      fontFamily: "var(--font-sans)",
                      minWidth: 0,
                    }}
                  />
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={handleSearch}
                    style={{
                      height: "44px",
                      padding: "0 28px",
                      background: "#1a6b45",
                      color: "#ffffff",
                      borderRadius: "9999px",
                      fontSize: "13px",
                      fontWeight: 700,
                      letterSpacing: "0.05em",
                      border: "none",
                      cursor: "pointer",
                      flexShrink: 0,
                      fontFamily: "var(--font-sans)",
                      transition: "background 150ms ease",
                    }}
                  >
                    Search
                  </motion.button>
                </div>
              </motion.div>
            )}

            {/* Recent searches — shown when the user has searched before */}
            {showSearch && recentSearches.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.18 }}
                className="flex items-center flex-wrap justify-center"
                style={{ gap: "8px" }}
              >
                <span className="hero-tag-label">Recent:</span>
                {recentSearches.map((term) => (
                  <button
                    key={term}
                    onClick={() => applyRecent(term)}
                    className="hero-tag hero-tag--recent"
                  >
                    <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden="true" style={{ flexShrink: 0 }}>
                      <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.4" />
                      <path d="M6 4v2.2l1.3 1.3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                    </svg>
                    {term}
                    <span
                      onClick={(e) => clearRecent(e, term)}
                      role="button"
                      aria-label={`Remove ${term}`}
                      className="hero-tag__clear"
                    >
                      ×
                    </span>
                  </button>
                ))}
              </motion.div>
            )}

            {/* Popular tags — quick-access category shortcuts */}
            {popularTags && popularTags.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.22 }}
                className="flex items-center flex-wrap justify-center"
                style={{ gap: "8px" }}
              >
                <span className="hero-tag-label">Popular:</span>
                {popularTags.map((tag) => (
                  <Link
                    key={tag}
                    to={`/category/${tag.toLowerCase()}`}
                    className="hero-tag"
                  >
                    {tag}
                  </Link>
                ))}
              </motion.div>
            )}

            {/* Trust stats — real marketplace signals (no fake avatars) */}
            {trustStats && trustStats.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="flex items-center flex-wrap justify-center"
                style={{ gap: "6px 20px", paddingTop: "4px" }}
              >
                {trustStats.map((stat, i) => (
                  <React.Fragment key={stat.label}>
                    {i > 0 && (
                      <span
                        aria-hidden="true"
                        style={{ color: "rgba(255,255,255,0.3)", fontSize: "13px" }}
                      >
                        ·
                      </span>
                    )}
                    <span
                      style={{
                        fontFamily: "var(--font-sans)",
                        fontSize: "12px",
                        color: "rgba(255,255,255,0.72)",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "5px",
                      }}
                    >
                      {stat.icon && (
                        <span
                          aria-hidden="true"
                          style={{ color: "#6ecf94", display: "flex", flexShrink: 0 }}
                        >
                          {stat.icon}
                        </span>
                      )}
                      <strong
                        style={{
                          color: "#fbbf24",
                          fontWeight: 700,
                          fontVariantNumeric: "tabular-nums",
                        }}
                      >
                        {stat.value}
                      </strong>{" "}
                      {stat.label}
                    </span>
                  </React.Fragment>
                ))}
              </motion.div>
            )}

            {/* Fallback CTA buttons — only shown when search is off */}
            {!showSearch && (primaryAction || secondaryAction) && (
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.55, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
                className="flex flex-col sm:flex-row items-center gap-3"
              >
                {primaryAction && (
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={primaryAction.onClick}
                    className="flex items-center gap-2 px-7 py-3.5 rounded-full"
                    style={{
                      background: "#1a6b45",
                      fontFamily: "var(--font-sans)",
                      fontSize: "15px",
                      fontWeight: 600,
                      color: "#ffffff",
                      border: "none",
                      cursor: "pointer",
                      boxShadow: "0 4px 16px rgba(26,107,69,0.35)",
                      transition: "background 150ms ease",
                    }}
                  >
                    {primaryAction.label}
                  </motion.button>
                )}
                {secondaryAction && (
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={secondaryAction.onClick}
                    className="px-7 py-3.5 rounded-full"
                    style={{
                      background: "rgba(255,255,255,0.08)",
                      border: "1px solid rgba(255,255,255,0.2)",
                      fontFamily: "var(--font-sans)",
                      fontSize: "15px",
                      fontWeight: 500,
                      color: "rgba(255,255,255,0.85)",
                      cursor: "pointer",
                    }}
                  >
                    {secondaryAction.label}
                  </motion.button>
                )}
              </motion.div>
            )}

            {disclaimer && !showSearch && (
              <p
                style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: "12px",
                  color: "rgba(255,255,255,0.35)",
                  fontStyle: "italic",
                }}
              >
                {disclaimer}
              </p>
            )}
          </motion.div>
        </div>
      )}

      {/* ── Category Carousel ── */}
      {programs.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 48 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="relative z-10 w-full overflow-hidden"
          style={{ paddingBottom: "56px" }}
        >
          {/* Left fade edge */}
          <div
            aria-hidden="true"
            className="absolute left-0 top-0 bottom-0 z-10 pointer-events-none"
            style={{
              width: "120px",
              background: "linear-gradient(90deg, rgba(7,30,17,0.95) 0%, rgba(7,30,17,0) 100%)",
            }}
          />
          {/* Right fade edge */}
          <div
            aria-hidden="true"
            className="absolute right-0 top-0 bottom-0 z-10 pointer-events-none"
            style={{
              width: "120px",
              background: "linear-gradient(270deg, rgba(7,30,17,0.95) 0%, rgba(7,30,17,0) 100%)",
            }}
          />

          {/* CSS infinite scroll — pauses on hover via animation-play-state */}
          <div
            className="carousel-track"
            style={
              {
                display: "flex",
                gap: `${cardGap}px`,
                paddingLeft: "24px",
                "--scroll-x": `-${scrollDistance}px`,
                "--scroll-dur": `${scrollDuration}s`,
              } as React.CSSProperties
            }
          >
            {[...programs, ...programs].map((program, index) => (
              <Link
                key={index}
                to={program.href || "/"}
                className="carousel-card"
                onClick={program.onClick}
                style={{ width: `${cardWidth}px`, height: "260px" }}
                aria-label={`Browse ${program.title}`}
              >
                <img
                  src={program.image}
                  alt={program.title}
                  loading="lazy"
                />
                <div className="carousel-card__overlay" aria-hidden="true" />
                <div className="carousel-card__text">
                  <span className="carousel-card__category">{program.category}</span>
                  <h3 className="carousel-card__title">{program.title}</h3>
                  {program.count && (
                    <span className="carousel-card__count">{program.count}</span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </motion.div>
      )}
    </section>
  );
}
