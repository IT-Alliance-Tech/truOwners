import React, { createContext, useContext, useState, useEffect } from 'react';

const WishlistContext = createContext();

export const WishlistProvider = ({ children }) => {
  const [wishlist, setWishlist] = useState([]);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('wishlist')) || [];
    setWishlist(saved);
  }, []);

  const saveWishlist = (items) => {
    setWishlist(items);
    localStorage.setItem('wishlist', JSON.stringify(items));
  };

  const toggle = (id) => {
    setWishlist((prev) => {
      const exists = prev.includes(id);
      const updated = exists ? prev.filter((item) => item !== id) : [...prev, id];
      localStorage.setItem('wishlist', JSON.stringify(updated));
      return updated;
    });
  };

  const isIn = (id) => wishlist.includes(id);

  return (
    <WishlistContext.Provider value={{ wishlist, toggle, isIn }}>
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => useContext(WishlistContext);
