import React from 'react';
import { Volume2, VolumeX, Sparkles } from 'lucide-react';
import { useAccessibility } from '../context/AccessibilityContext';

interface VoiceReaderButtonProps {
  textToRead: string;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  variant?: 'subtle' | 'pill' | 'icon';
}

export const VoiceReaderButton: React.FC<VoiceReaderButtonProps> = ({
  textToRead,
  label = 'Ouvir',
  size = 'sm',
  className = '',
  variant = 'pill'
}) => {
  const { isSpeaking, isVoiceSupported, speakText, stopSpeaking } = useAccessibility();

  if (!isVoiceSupported) return null;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isSpeaking) {
      stopSpeaking();
    } else {
      speakText(textToRead);
    }
  };

  const sizeClasses = {
    sm: 'text-xs px-2.5 py-1 gap-1.5',
    md: 'text-xs px-3 py-1.5 gap-2',
    lg: 'text-sm px-4 py-2 gap-2'
  };

  if (variant === 'icon') {
    return (
      <button
        type="button"
        onClick={handleClick}
        aria-label={isSpeaking ? 'Parar leitura em voz alta' : `Ouvir: ${label}`}
        title={isSpeaking ? 'Parar leitura em voz alta' : 'Ouvir texto com voz em português'}
        className={`p-1.5 rounded-full text-slate-500 hover:text-[#00687a] hover:bg-cyan-50 transition-colors focus:ring-2 focus:ring-[#00687a] ${
          isSpeaking ? 'text-[#00687a] bg-cyan-100 animate-pulse' : ''
        } ${className}`}
      >
        {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={isSpeaking ? 'Parar leitura em voz alta' : `Ouvir áudio: ${label}`}
      title="Ouvir explicação com síntese de voz em português"
      className={`inline-flex items-center rounded-full font-medium transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-[#00687a] ${
        isSpeaking 
          ? 'bg-cyan-700 text-white shadow-md animate-pulse ring-2 ring-cyan-400' 
          : 'bg-cyan-50 hover:bg-cyan-100 text-[#00687a] border border-cyan-200'
      } ${sizeClasses[size]} ${className}`}
    >
      {isSpeaking ? (
        <>
          <VolumeX className="w-3.5 h-3.5 shrink-0 text-white" />
          <span>Parar Áudio</span>
        </>
      ) : (
        <>
          <Volume2 className="w-3.5 h-3.5 shrink-0 text-[#00687a]" />
          <span>{label}</span>
        </>
      )}
    </button>
  );
};
