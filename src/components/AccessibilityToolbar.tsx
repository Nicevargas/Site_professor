import React from 'react';
import { 
  Eye, 
  Type, 
  Sun, 
  Moon, 
  Sparkles, 
  Sliders, 
  Volume2, 
  Keyboard, 
  Check, 
  RotateCcw, 
  X, 
  BookOpen, 
  HelpCircle,
  PlayCircle
} from 'lucide-react';
import { useAccessibility } from '../context/AccessibilityContext';
import { KEYBOARD_SHORTCUTS } from '../data/tutorialData';
import { AccessibilityFontSize, AccessibilityContrastMode } from '../types';

export const AccessibilityToolbar: React.FC = () => {
  const { 
    settings, 
    updateSetting, 
    resetSettings, 
    isA11yModalOpen, 
    setIsA11yModalOpen,
    setIsTutorialHubOpen,
    setIsInteractiveTourOpen,
    speakText,
    isSpeaking,
    stopSpeaking
  } = useAccessibility();

  const fontOptions: { id: AccessibilityFontSize; label: string; sizeClass: string }[] = [
    { id: 'normal', label: '100% (Normal)', sizeClass: 'text-xs' },
    { id: 'medium', label: '115% (Médio)', sizeClass: 'text-sm' },
    { id: 'large', label: '130% (Grande)', sizeClass: 'text-base' },
    { id: 'xlarge', label: '150% (Extra)', sizeClass: 'text-lg' },
  ];

  const contrastOptions: { id: AccessibilityContrastMode; label: string; desc: string; icon: any }[] = [
    { id: 'normal', label: 'Padrão', desc: 'Cores normais do sistema', icon: Sun },
    { id: 'high-contrast-dark', label: 'Alto Contraste Escuro', desc: 'Fundo escuro profundo e texto branco', icon: Moon },
    { id: 'high-contrast-light', label: 'Alto Contraste Claro', desc: 'Preto puro com bordas reforçadas', icon: Eye },
    { id: 'monochrome', label: 'Monocromático', desc: 'Escala de cinza neutra', icon: Sliders },
  ];

  return (
    <>
      {/* Skip to Main Content Link for Keyboard / Screen Readers */}
      <a href="#main-content" className="a11y-skip-link">
        Pular para o conteúdo principal (Alt + 1)
      </a>

      {/* Accessibility Dialog Modal */}
      {isA11yModalOpen && (
        <div 
          role="dialog" 
          aria-modal="true" 
          aria-labelledby="a11y-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in"
          onClick={() => setIsA11yModalOpen(false)}
        >
          <div 
            className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-[#091426] text-white px-6 py-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 text-[#57dffe] flex items-center justify-center border border-cyan-500/30">
                  <Sliders className="w-6 h-6" />
                </div>
                <div>
                  <h2 id="a11y-modal-title" className="text-lg font-bold">Preferências Visuais & Leitura</h2>
                  <p className="text-xs text-slate-300">Ajuste o tamanho de fonte, contraste e preferências do sistema</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={resetSettings}
                  title="Restaurar configurações padrão"
                  className="flex items-center gap-1 text-xs text-slate-300 hover:text-white px-2.5 py-1.5 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Restaurar</span>
                </button>
                
                <button
                  type="button"
                  onClick={() => setIsA11yModalOpen(false)}
                  aria-label="Fechar janela de acessibilidade"
                  className="p-1.5 rounded-full hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-800">
              
              {/* 1. Font Size Scaling */}
              <div>
                <label className="flex items-center gap-2 text-sm font-bold text-slate-900 mb-2">
                  <Type className="w-4 h-4 text-[#00687a]" />
                  <span>Tamanho do Texto (Zoom)</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {fontOptions.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => updateSetting('fontSize', opt.id)}
                      className={`p-3 rounded-2xl border text-center transition-all ${
                        settings.fontSize === opt.id
                          ? 'border-[#00687a] bg-cyan-50/70 text-[#00687a] font-bold shadow-sm ring-2 ring-[#00687a]/20'
                          : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                      }`}
                    >
                      <span className={`block ${opt.sizeClass}`}>A A</span>
                      <span className="text-xs mt-1 block">{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. Contrast Modes */}
              <div>
                <label className="flex items-center gap-2 text-sm font-bold text-slate-900 mb-2">
                  <Sun className="w-4 h-4 text-[#00687a]" />
                  <span>Modo de Contraste & Cores</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {contrastOptions.map((opt) => {
                    const Icon = opt.icon;
                    const isSelected = settings.contrastMode === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => updateSetting('contrastMode', opt.id)}
                        className={`p-3.5 rounded-2xl border text-left flex items-start gap-3 transition-all ${
                          isSelected
                            ? 'border-[#00687a] bg-cyan-50/70 text-[#00687a] shadow-sm ring-2 ring-[#00687a]/20'
                            : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                        }`}
                      >
                        <div className={`p-2 rounded-xl shrink-0 ${isSelected ? 'bg-[#00687a] text-white' : 'bg-slate-100 text-slate-600'}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold flex items-center justify-between">
                            <span>{opt.label}</span>
                            {isSelected && <Check className="w-3.5 h-3.5 text-[#00687a]" />}
                          </p>
                          <p className="text-[11px] text-slate-500 mt-0.5">{opt.desc}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3. Toggles Grid (Dyslexia, Reading Guide, Enhanced Focus, Reduced Motion) */}
              <div>
                <label className="flex items-center gap-2 text-sm font-bold text-slate-900 mb-2">
                  <Sliders className="w-4 h-4 text-[#00687a]" />
                  <span>Facilitadores de Leitura & Navegação</span>
                </label>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Dyslexia font toggle */}
                  <label className="flex items-start gap-3 p-3.5 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={settings.dyslexiaFont}
                      onChange={(e) => updateSetting('dyslexiaFont', e.target.checked)}
                      className="mt-0.5 w-4 h-4 text-[#00687a] rounded border-slate-300 focus:ring-[#00687a]"
                    />
                    <div>
                      <p className="text-xs font-bold text-slate-900">Fonte para Dislexia</p>
                      <p className="text-[11px] text-slate-500">Aumenta espaçamento entre letras e melhora a distinção de caracteres.</p>
                    </div>
                  </label>

                  {/* Reading Guide Ruler */}
                  <label className="flex items-start gap-3 p-3.5 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={settings.readingGuide}
                      onChange={(e) => updateSetting('readingGuide', e.target.checked)}
                      className="mt-0.5 w-4 h-4 text-[#00687a] rounded border-slate-300 focus:ring-[#00687a]"
                    />
                    <div>
                      <p className="text-xs font-bold text-slate-900">Régua Guia de Leitura</p>
                      <p className="text-[11px] text-slate-500">Exibe uma faixa de foco horizontal que acompanha a leitura.</p>
                    </div>
                  </label>

                  {/* Enhanced Keyboard Focus */}
                  <label className="flex items-start gap-3 p-3.5 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={settings.enhancedFocus}
                      onChange={(e) => updateSetting('enhancedFocus', e.target.checked)}
                      className="mt-0.5 w-4 h-4 text-[#00687a] rounded border-slate-300 focus:ring-[#00687a]"
                    />
                    <div>
                      <p className="text-xs font-bold text-slate-900">Realce de Foco (Teclado)</p>
                      <p className="text-[11px] text-slate-500">Contorno nítido e espesso ao navegar utilizando a tecla TAB.</p>
                    </div>
                  </label>

                  {/* Highlight Links & Buttons */}
                  <label className="flex items-start gap-3 p-3.5 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={settings.highlightLinks}
                      onChange={(e) => updateSetting('highlightLinks', e.target.checked)}
                      className="mt-0.5 w-4 h-4 text-[#00687a] rounded border-slate-300 focus:ring-[#00687a]"
                    />
                    <div>
                      <p className="text-xs font-bold text-slate-900">Sublinhar Links & Ações</p>
                      <p className="text-[11px] text-slate-500">Destaca todos os links e botões com sublinhado legível.</p>
                    </div>
                  </label>

                  {/* Reduced Motion */}
                  <label className="flex items-start gap-3 p-3.5 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={settings.reducedMotion}
                      onChange={(e) => updateSetting('reducedMotion', e.target.checked)}
                      className="mt-0.5 w-4 h-4 text-[#00687a] rounded border-slate-300 focus:ring-[#00687a]"
                    />
                    <div>
                      <p className="text-xs font-bold text-slate-900">Reduzir Movimento</p>
                      <p className="text-[11px] text-slate-500">Desativa animações e transições para evitar fadiga visual.</p>
                    </div>
                  </label>

                  {/* Voice Speed */}
                  <div className="p-3.5 rounded-2xl border border-slate-200 bg-white">
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <Volume2 className="w-3.5 h-3.5 text-[#00687a]" />
                        <span>Velocidade da Voz</span>
                      </p>
                      <span className="text-[11px] font-bold text-[#00687a]">{settings.voiceSpeed}x</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {[0.75, 1, 1.25, 1.5].map((speed) => (
                        <button
                          key={speed}
                          type="button"
                          onClick={() => {
                            updateSetting('voiceSpeed', speed);
                            speakText(`Velocidade da voz ajustada para ${speed} vezes.`);
                          }}
                          className={`flex-1 py-1 text-[11px] font-bold rounded-lg border transition-all ${
                            settings.voiceSpeed === speed
                              ? 'bg-[#00687a] text-white border-[#00687a]'
                              : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                        >
                          {speed}x
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* 4. Keyboard Shortcuts Reference Table */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Keyboard className="w-4 h-4 text-[#00687a]" />
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Atalhos de Teclado Rápidos</h3>
                  </div>
                  <span className="text-[11px] text-slate-500">Navegação sem mouse</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {KEYBOARD_SHORTCUTS.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs py-1 border-b border-slate-200/60 last:border-0">
                      <span className="text-slate-600 truncate pr-2">{item.description}</span>
                      <kbd className="px-2 py-0.5 bg-white border border-slate-300 rounded text-[10px] font-mono font-bold text-slate-800 shrink-0 shadow-2xs">
                        {item.key}
                      </kbd>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsA11yModalOpen(false);
                    setIsInteractiveTourOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#00687a] hover:underline"
                >
                  <PlayCircle className="w-3.5 h-3.5" />
                  <span>Iniciar Tour Interativo</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setIsA11yModalOpen(false)}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#00687a] hover:bg-[#004e5c] text-white text-xs font-bold transition-all shadow-sm"
              >
                Concluir e Aplicar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
