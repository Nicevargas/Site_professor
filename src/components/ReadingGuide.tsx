import React from 'react';
import { useAccessibility } from '../context/AccessibilityContext';

export const ReadingGuide: React.FC = () => {
  const { settings, readingRulerY } = useAccessibility();

  if (!settings.readingGuide) return null;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed left-0 right-0 z-50 transition-all duration-75"
      style={{
        top: `${readingRulerY - 16}px`,
        height: '36px',
        backgroundColor: 'rgba(0, 104, 122, 0.08)',
        borderTop: '2px solid rgba(0, 104, 122, 0.4)',
        borderBottom: '2px solid rgba(0, 104, 122, 0.4)',
        boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.05)',
      }}
    />
  );
};
