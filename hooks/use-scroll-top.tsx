import { useState, useEffect } from "react";

export const useScrollTop = (threshold = 10) => {
  const [scrolled, updateScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > threshold) updateScrolled(true);
      else updateScrolled(false);
    };
    window.addEventListener("scroll", handleScroll);

    return () => window.removeEventListener("scroll", handleScroll);
  }, [threshold]);

  return scrolled;
};
