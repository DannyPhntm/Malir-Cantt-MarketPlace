import { createContext, useContext, useState, useCallback } from 'react';

const FavoritesContext = createContext(null);

export function FavoritesProvider({ children }) {
  const [favorites, setFavorites] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('malir-favorites') || '[]');
    } catch {
      return [];
    }
  });
  const [isOpen, setIsOpen] = useState(false);

  const toggle = useCallback((listing) => {
    setFavorites(prev => {
      const exists = prev.some(f => f.id === listing.id);
      const next = exists
        ? prev.filter(f => f.id !== listing.id)
        : [listing, ...prev];
      localStorage.setItem('malir-favorites', JSON.stringify(next));
      return next;
    });
  }, []);

  const isFavorited = useCallback(
    (id) => favorites.some(f => f.id === id),
    [favorites]
  );

  return (
    <FavoritesContext.Provider value={{ favorites, toggle, isFavorited, isOpen, setIsOpen }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export const useFavorites = () => useContext(FavoritesContext);
