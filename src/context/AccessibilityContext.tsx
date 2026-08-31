import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { 
  AccessibilitySettings, 
  AccessibilityFontSize, 
  AccessibilityContrastMode, 
  ViewMode 
} from '../types';

interface AccessibilityContextType {
  settings: AccessibilitySettings;
  updateSetting: <K extends keyof AccessibilitySettings>(key: K, value: AccessibilitySettings[K]) => void;
  resetSettings: () => void;
  
  // Voice Text-to-Speech (TTS)
  isSpeaking: boolean;
  isVoiceSupported: boolean;
  speakText: (text: string, onEnd?: () => void) => void;
  stopSpeaking: () => void;
  
  // Modals & Tour Triggers
  isA11yModalOpen: boolean;
  setIsA11yModalOpen: (open: boolean) => void;
  isTutorialHubOpen: boolean;
  setIsTutorialHubOpen: (open: boolean) => void;
  isInteractiveTourOpen: boolean;
  setIsInteractiveTourOpen: (open: boolean) => void;
  
  // Reading Ruler position
  readingRulerY: number;
}

const DEFAULT_SETTINGS: AccessibilitySettings = {
  fontSize: 'normal',
  contrastMode: 'normal',
  dyslexiaFont: false,
  reducedMotion: false,
  enhancedFocus: false,
  highlightLinks: false,
  readingGuide: false,
  voiceSpeed: 1,
  autoNarrateOnTour: false,
};

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export const AccessibilityProvider: React.FC<{
  children: React.ReactNode;
  onNavigate?: (view: ViewMode) => void;
}> = ({ children, onNavigate }) => {
  const [settings, setSettings] = useState<AccessibilitySettings>(() => {
    try {
      const saved = localStorage.getItem('agenda_prof_a11y_settings');
      if (saved) return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
    } catch {
      // ignore
    }
    return DEFAULT_SETTINGS;
  });

  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isVoiceSupported, setIsVoiceSupported] = useState(false);
  const [isA11yModalOpen, setIsA11yModalOpen] = useState(false);
  const [isTutorialHubOpen, setIsTutorialHubOpen] = useState(false);
  const [isInteractiveTourOpen, setIsInteractiveTourOpen] = useState(false);
  const [readingRulerY, setReadingRulerY] = useState(200);

  // Check voice synthesis support
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      setIsVoiceSupported(true);
    }
  }, []);

  // Sync settings with DOM html classes & persistence
  useEffect(() => {
    try {
      localStorage.setItem('agenda_prof_a11y_settings', JSON.stringify(settings));
    } catch {
      // ignore
    }

    const root = document.documentElement;

    // Font size classes
    root.classList.remove('a11y-font-medium', 'a11y-font-large', 'a11y-font-xlarge');
    if (settings.fontSize === 'medium') root.classList.add('a11y-font-medium');
    else if (settings.fontSize === 'large') root.classList.add('a11y-font-large');
    else if (settings.fontSize === 'xlarge') root.classList.add('a11y-font-xlarge');

    // Contrast classes
    root.classList.remove('a11y-high-contrast-dark', 'a11y-high-contrast-light', 'a11y-monochrome');
    if (settings.contrastMode === 'high-contrast-dark') root.classList.add('a11y-high-contrast-dark');
    else if (settings.contrastMode === 'high-contrast-light') root.classList.add('a11y-high-contrast-light');
    else if (settings.contrastMode === 'monochrome') root.classList.add('a11y-monochrome');

    // Dyslexia font
    if (settings.dyslexiaFont) root.classList.add('a11y-dyslexia');
    else root.classList.remove('a11y-dyslexia');

    // Enhanced Focus
    if (settings.enhancedFocus) root.classList.add('a11y-enhanced-focus');
    else root.classList.remove('a11y-enhanced-focus');

    // Reduced Motion
    if (settings.reducedMotion) root.classList.add('a11y-reduced-motion');
    else root.classList.remove('a11y-reduced-motion');

    // Highlight Links
    if (settings.highlightLinks) root.classList.add('a11y-highlight-links');
    else root.classList.remove('a11y-highlight-links');
  }, [settings]);

  // Track cursor for reading ruler if enabled
  useEffect(() => {
    if (!settings.readingGuide) return;
    const handleMouseMove = (e: MouseEvent) => {
      setReadingRulerY(e.clientY);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [settings.readingGuide]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts if typing inside input / textarea
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }

      if (e.altKey) {
        if (e.key === '1' && onNavigate) {
          e.preventDefault();
          onNavigate('dashboard');
        } else if (e.key === '2' && onNavigate) {
          e.preventDefault();
          onNavigate('agenda');
        } else if (e.key === '3' && onNavigate) {
          e.preventDefault();
          onNavigate('servicos');
        } else if ((e.key === 'a' || e.key === 'A') && onNavigate) {
          e.preventDefault();
          onNavigate('alunos');
        } else if ((e.key === 'f' || e.key === 'F') && onNavigate) {
          e.preventDefault();
          onNavigate('pagamentos');
        } else if ((e.key === 'u' || e.key === 'U') && onNavigate) {
          e.preventDefault();
          onNavigate('usuarios');
        } else if ((e.key === 's' || e.key === 'S') && onNavigate) {
          e.preventDefault();
          onNavigate('site-admin');
        } else if ((e.key === 'p' || e.key === 'P') && onNavigate) {
          e.preventDefault();
          onNavigate('portal-aluno');
        } else if (e.key === 't' || e.key === 'T') {
          e.preventDefault();
          if (onNavigate) {
            onNavigate('tutorial-wizard');
          } else {
            setIsInteractiveTourOpen(true);
          }
        } else if (e.key === 'h' || e.key === 'H') {
          e.preventDefault();
          setIsA11yModalOpen(true);
        }
      }

      if (e.key === 'Escape') {
        setIsA11yModalOpen(false);
        setIsTutorialHubOpen(false);
        setIsInteractiveTourOpen(false);
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
          window.speechSynthesis.cancel();
          setIsSpeaking(false);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onNavigate]);

  const updateSetting = useCallback(<K extends keyof AccessibilitySettings>(
    key: K, 
    value: AccessibilitySettings[K]
  ) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }, []);

  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }, []);

  const stopSpeaking = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, []);

  const speakText = useCallback((text: string, onEnd?: () => void) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return;
    }

    try {
      window.speechSynthesis.cancel();

      if (!text.trim()) {
        setIsSpeaking(false);
        return;
      }

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'pt-BR';
      utterance.rate = settings.voiceSpeed || 1;
      utterance.pitch = 1;

      // Select Portuguese voice if available
      const voices = window.speechSynthesis.getVoices();
      const ptVoice = voices.find(v => v.lang.startsWith('pt') || v.lang === 'pt_BR');
      if (ptVoice) {
        utterance.voice = ptVoice;
      }

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => {
        setIsSpeaking(false);
        if (onEnd) onEnd();
      };
      utterance.onerror = () => setIsSpeaking(false);

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn('Speech synthesis error:', err);
      setIsSpeaking(false);
    }
  }, [settings.voiceSpeed]);

  return (
    <AccessibilityContext.Provider
      value={{
        settings,
        updateSetting,
        resetSettings,
        isSpeaking,
        isVoiceSupported,
        speakText,
        stopSpeaking,
        isA11yModalOpen,
        setIsA11yModalOpen,
        isTutorialHubOpen,
        setIsTutorialHubOpen,
        isInteractiveTourOpen,
        setIsInteractiveTourOpen,
        readingRulerY,
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
};

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
};
