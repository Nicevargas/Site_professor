import React, { useState, useEffect } from 'react';
import { 
  TUTORIAL_STEPS 
} from '../data/tutorialData';
import { ViewMode } from '../types';
import { useAccessibility } from '../context/AccessibilityContext';
import { 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Sparkles, 
  CheckCircle2, 
  Volume2, 
  VolumeX, 
  Play, 
  ExternalLink,
  HelpCircle,
  Lightbulb,
  Compass,
  ArrowRight
} from 'lucide-react';

interface InteractiveTourModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentView: ViewMode;
  onNavigate: (view: ViewMode) => void;
}

export const InteractiveTourModal: React.FC<InteractiveTourModalProps> = ({
  isOpen,
  onClose,
  currentView,
  onNavigate,
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const { isSpeaking, speakText, stopSpeaking, settings } = useAccessibility();

  const totalSteps = TUTORIAL_STEPS.length;
  const currentStep = TUTORIAL_STEPS[currentStepIndex];

  // When step changes, automatically switch view to show the relevant screen behind
  useEffect(() => {
    if (isOpen && currentStep) {
      if (currentStep.targetView !== currentView) {
        onNavigate(currentStep.targetView);
      }
      
      // Auto narrate if option enabled
      if (settings.autoNarrateOnTour) {
        speakText(`${currentStep.title}. ${currentStep.audioNarrationText}`);
      }
    }
  }, [currentStepIndex, isOpen]);

  // Keyboard navigation inside tour
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        handleClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentStepIndex]);

  if (!isOpen || !currentStep) return null;

  const handleNext = () => {
    stopSpeaking();
    if (currentStepIndex < totalSteps - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    } else {
      handleClose();
    }
  };

  const handlePrev = () => {
    stopSpeaking();
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
    }
  };

  const handleClose = () => {
    stopSpeaking();
    onClose();
  };

  const handleSpeakStep = () => {
    if (isSpeaking) {
      stopSpeaking();
    } else {
      speakText(`${currentStep.title}. ${currentStep.subtitle}. ${currentStep.description} ${currentStep.detailedText}`);
    }
  };

  const progressPercent = Math.round(((currentStepIndex + 1) / totalSteps) * 100);

  return (
    <div 
      role="dialog" 
      aria-modal="true"
      aria-labelledby="tour-step-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in"
    >
      <div 
        className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Progress Bar */}
        <div className="h-1.5 w-full bg-slate-100 relative">
          <div 
            className="h-full bg-gradient-to-r from-[#00687a] to-[#57dffe] transition-all duration-300 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Modal Header */}
        <div className="bg-[#091426] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-[#57dffe] flex items-center justify-center border border-cyan-500/30">
              <Compass className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider bg-cyan-900/60 text-[#57dffe] px-2 py-0.5 rounded-full border border-cyan-700/50">
                  {currentStep.badge}
                </span>
                <span className="text-xs text-slate-300">
                  Passo {currentStepIndex + 1} de {totalSteps} ({progressPercent}%)
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Audio narration button */}
            <button
              type="button"
              onClick={handleSpeakStep}
              title={isSpeaking ? 'Pausar áudio explicativo' : 'Ouvir explicação em voz alta'}
              className={`p-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors ${
                isSpeaking 
                  ? 'bg-cyan-500 text-[#091426] animate-pulse' 
                  : 'bg-white/10 hover:bg-white/20 text-white'
              }`}
            >
              {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              <span className="hidden sm:inline">{isSpeaking ? 'Parar' : 'Ouvir'}</span>
            </button>

            <button
              type="button"
              onClick={handleClose}
              className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              title="Fechar tour (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tour Step Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          <div>
            <h2 id="tour-step-title" className="text-xl font-bold text-[#091426]">
              {currentStep.title}
            </h2>
            <p className="text-sm font-semibold text-[#00687a] mt-0.5">
              {currentStep.subtitle}
            </p>
          </div>

          <p className="text-sm text-slate-700 leading-relaxed">
            {currentStep.description}
          </p>

          {/* Key Features Bullet Points */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#00687a]" />
              <span>Destaques & Capacidades</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {currentStep.keyFeatures.map((feat, idx) => (
                <div key={idx} className="flex items-start gap-2 text-xs text-slate-700">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{feat}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Practical Tip */}
          {currentStep.tip && (
            <div className="bg-amber-50/70 border border-amber-200 p-3.5 rounded-2xl flex items-start gap-3">
              <Lightbulb className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-900 leading-relaxed font-medium">
                {currentStep.tip}
              </p>
            </div>
          )}

          {/* Step Selector Dots */}
          <div className="pt-2 flex items-center justify-center gap-1.5">
            {TUTORIAL_STEPS.map((step, idx) => (
              <button
                key={step.id}
                type="button"
                onClick={() => {
                  stopSpeaking();
                  setCurrentStepIndex(idx);
                }}
                title={`Ir para: ${step.title}`}
                className={`h-2 rounded-full transition-all ${
                  idx === currentStepIndex 
                    ? 'w-7 bg-[#00687a]' 
                    : 'w-2 bg-slate-200 hover:bg-slate-300'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleClose}
            className="text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors order-2 sm:order-1"
          >
            Pular Tutorial
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end order-1 sm:order-2">
            <button
              type="button"
              onClick={handlePrev}
              disabled={currentStepIndex === 0}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1 ${
                currentStepIndex === 0 
                  ? 'text-slate-300 border-slate-200 cursor-not-allowed' 
                  : 'text-slate-700 bg-white border-slate-300 hover:bg-slate-100'
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Anterior</span>
            </button>

            <button
              type="button"
              onClick={handleNext}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[#00687a] hover:bg-[#004e5c] text-white transition-all shadow-sm flex items-center gap-1.5"
            >
              <span>{currentStepIndex === totalSteps - 1 ? 'Concluir Tour' : 'Próximo Passo'}</span>
              {currentStepIndex === totalSteps - 1 ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
