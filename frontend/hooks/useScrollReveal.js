'use client';

import { useEffect } from 'react';

/**
 * useScrollReveal — attaches an IntersectionObserver to every element
 * with class .reveal, .reveal-left, or .reveal-right and adds class .in
 * when the element enters the viewport.
 */
export default function useScrollReveal(dependencies = []) {
  useEffect(() => {
    const selectors = '.reveal, .reveal-left, .reveal-right';
    const elements = document.querySelectorAll(selectors);

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in');
            observer.unobserve(entry.target); // only trigger once
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );

    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, dependencies);
}
