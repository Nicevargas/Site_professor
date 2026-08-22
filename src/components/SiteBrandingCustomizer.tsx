import React, { useState } from 'react';
import { TeacherProfile } from '../types';
import { 
  Palette, 
  Sparkles, 
  Image as ImageIcon, 
  Upload, 
  Check, 
  RefreshCw, 
  Eye, 
  Save, 
  ExternalLink, 
  ShieldCheck, 
  ArrowRight, 
  Star, 
  CheckCircle2, 
  Layers, 
  Trash2,
  Sliders,
  Sun,
  Laptop
} from 'lucide-react';
import { THEME_COLOR_PRESETS, PRESET_LOGO_OPTIONS, ColorThemePreset } from '../utils/themePresets';
import { readFileAsDataUrl } from '../utils/mediaAndTextHelpers';

interface SiteBrandingCustomizerProps {
  currentTeacher: TeacherProfile;
  onUpdateTeacher: (updated: TeacherProfile) => void;
  onOpenPublicSite?: () => void;
}

export const SiteBrandingCustomizer: React.FC<SiteBrandingCustomizerProps> = ({
  currentTeacher,
  onUpdateTeacher,
  onOpenPublicSite,
}) => {
  // Brand state
  const [selectedPreset, setSelectedPreset] = useState<string>(
    currentTeacher.themePreset || 'ocean'
  );
  const [primaryColor, setPrimaryColor] = useState<string>(
    currentTeacher.primaryColor || '#00687a'
  );
  const [secondaryColor, setSecondaryColor] = useState<string>(
    currentTeacher.secondaryColor || '#57dffe'
  );
  const [accentColor, setAccentColor] = useState<string>(
    currentTeacher.accentColor || '#004e5c'
  );

  const [brandName, setBrandName] = useState<string>(
    currentTeacher.brandName || currentTeacher.name
  );
  const [logoUrl, setLogoUrl] = useState<string>(
    currentTeacher.logoUrl || ''
  );
  const [showLogo, setShowLogo] = useState<boolean>(
    currentTeacher.showLogo ?? true
  );

  const [isSaved, setIsSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<'colors' | 'logo' | 'preview'>('colors');

  // Handle preset selection
  const handleApplyPreset = (preset: ColorThemePreset) => {
    setSelectedPreset(preset.id);
    setPrimaryColor(preset.primaryColor);
    setSecondaryColor(preset.secondaryColor);
    setAccentColor(preset.accentColor);
  };

  // Handle file upload for logo
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await readFileAsDataUrl(file);
      setLogoUrl(dataUrl);
    } catch (err) {
      alert('Erro ao carregar imagem da logo.');
    }
  };

  // Save changes
  const handleSave = () => {
    const updated: TeacherProfile = {
      ...currentTeacher,
      themePreset: selectedPreset as any,
      primaryColor,
      secondaryColor,
      accentColor,
      brandName: brandName.trim() || currentTeacher.name,
      logoUrl: logoUrl.trim(),
      showLogo,
    };
    onUpdateTeacher(updated);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  // Reset to default
  const handleResetDefaults = () => {
    const defaultPreset = THEME_COLOR_PRESETS[0];
    setSelectedPreset(defaultPreset.id);
    setPrimaryColor(defaultPreset.primaryColor);
    setSecondaryColor(defaultPreset.secondaryColor);
    setAccentColor(defaultPreset.accentColor);
    setBrandName(currentTeacher.name);
    setLogoUrl('');
    setShowLogo(true);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#091426] via-[#10223e] to-[#091426] text-white p-6 md:p-8 rounded-3xl shadow-ambient border border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 border border-white/15 rounded-full text-xs font-semibold text-[#57dffe] mb-3">
            <Palette className="w-3.5 h-3.5" />
            <span>Identidade Visual & Personalização</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            Personalize as Cores e a Logo do seu Site
          </h2>
          <p className="text-sm text-slate-300 mt-2 leading-relaxed">
            Destaque sua marca profissional! Escolha uma paleta de cores moderna para botões, destaques e cabeçalhos, ou defina sua logo e cores exclusivas em tempo real.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 relative z-10">
          {onOpenPublicSite && (
            <button
              onClick={onOpenPublicSite}
              className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold border border-white/20 transition-all"
            >
              <Eye className="w-4 h-4 text-[#57dffe]" />
              <span>Ver Site Público</span>
            </button>
          )}
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md bg-emerald-500 hover:bg-emerald-600 text-white hover:scale-105"
          >
            {isSaved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            <span>{isSaved ? 'Identidade Salva!' : 'Salvar Alterações'}</span>
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-slate-200 gap-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('colors')}
          className={`flex items-center gap-2 pb-3 px-4 text-sm font-semibold border-b-2 transition-all shrink-0 ${
            activeTab === 'colors'
              ? 'border-[#00687a] text-[#00687a]'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Palette className="w-4 h-4" />
          <span>Paleta de Cores & Temas</span>
        </button>

        <button
          onClick={() => setActiveTab('logo')}
          className={`flex items-center gap-2 pb-3 px-4 text-sm font-semibold border-b-2 transition-all shrink-0 ${
            activeTab === 'logo'
              ? 'border-[#00687a] text-[#00687a]'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <ImageIcon className="w-4 h-4" />
          <span>Logo & Nome da Marca</span>
        </button>

        <button
          onClick={() => setActiveTab('preview')}
          className={`flex items-center gap-2 pb-3 px-4 text-sm font-semibold border-b-2 transition-all shrink-0 ${
            activeTab === 'preview'
              ? 'border-[#00687a] text-[#00687a]'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Laptop className="w-4 h-4" />
          <span>Pré-Visualização ao Vivo</span>
        </button>
      </div>

      {/* TAB 1: CORES & TEMAS */}
      {activeTab === 'colors' && (
        <div className="space-y-6">
          {/* Preset Palettes Grid */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-bold text-[#091426] flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>Temas Prontos de Alta Conversão</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Combinações harmoniosas projetadas para diferentes nichos de ensino e treinamento.
                </p>
              </div>
              <button
                type="button"
                onClick={handleResetDefaults}
                className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1.5 self-start sm:self-auto"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Restaurar Padrão</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
              {THEME_COLOR_PRESETS.map((preset) => {
                const isSelected = selectedPreset === preset.id;
                return (
                  <div
                    key={preset.id}
                    onClick={() => handleApplyPreset(preset)}
                    className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between h-44 hover:scale-[1.02] ${
                      isSelected
                        ? 'border-[#00687a] bg-cyan-50/30 shadow-md ring-2 ring-[#00687a]/15'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#091426]">{preset.name}</span>
                        {isSelected && (
                          <span className="w-5 h-5 rounded-full bg-[#00687a] text-white flex items-center justify-center text-[10px] font-bold">
                            <Check className="w-3 h-3" />
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] font-semibold text-slate-400 block mt-0.5">
                        {preset.suggestedNiche}
                      </span>
                    </div>

                    {/* Color Swatch Bars */}
                    <div className="space-y-1.5 my-2">
                      <div className="flex items-center gap-1.5">
                        <div 
                          className="h-5 flex-1 rounded-md shadow-xs flex items-center justify-center text-[9px] font-bold text-white uppercase"
                          style={{ backgroundColor: preset.primaryColor }}
                        >
                          {preset.primaryColor}
                        </div>
                        <div 
                          className="h-5 w-8 rounded-md shadow-xs"
                          style={{ backgroundColor: preset.secondaryColor }}
                        />
                        <div 
                          className="h-5 w-8 rounded-md shadow-xs"
                          style={{ backgroundColor: preset.accentColor }}
                        />
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-500 line-clamp-2 leading-tight">
                      {preset.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Custom Color Tuning */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
            <div>
              <h3 className="text-base font-bold text-[#091426] flex items-center gap-2">
                <Sliders className="w-4 h-4 text-[#00687a]" />
                <span>Ajuste Fino de Cores Personalizadas</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Altere os tons hexadecimais conforme a sua identidade visual exata.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Primary Color */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700">Cor Primária (Principal)</label>
                  <span className="text-[10px] text-slate-400">Botões, Títulos & Ícones</span>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => {
                      setPrimaryColor(e.target.value);
                      setSelectedPreset('custom');
                    }}
                    className="w-12 h-10 rounded-lg cursor-pointer border border-slate-300 p-0.5 bg-white"
                  />
                  <input
                    type="text"
                    value={primaryColor}
                    onChange={(e) => {
                      setPrimaryColor(e.target.value);
                      setSelectedPreset('custom');
                    }}
                    className="flex-1 px-3 py-2 text-xs font-mono font-bold rounded-lg border border-slate-200 bg-white text-slate-800 uppercase focus:outline-[#00687a]"
                    placeholder="#00687a"
                  />
                </div>
              </div>

              {/* Secondary Color */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700">Cor Secundária (Luz & Badge)</label>
                  <span className="text-[10px] text-slate-400">Bordas, Badges & Acentos</span>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={secondaryColor}
                    onChange={(e) => {
                      setSecondaryColor(e.target.value);
                      setSelectedPreset('custom');
                    }}
                    className="w-12 h-10 rounded-lg cursor-pointer border border-slate-300 p-0.5 bg-white"
                  />
                  <input
                    type="text"
                    value={secondaryColor}
                    onChange={(e) => {
                      setSecondaryColor(e.target.value);
                      setSelectedPreset('custom');
                    }}
                    className="flex-1 px-3 py-2 text-xs font-mono font-bold rounded-lg border border-slate-200 bg-white text-slate-800 uppercase focus:outline-[#00687a]"
                    placeholder="#57dffe"
                  />
                </div>
              </div>

              {/* Accent Color */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700">Cor de Acento (Hover / Escuro)</label>
                  <span className="text-[10px] text-slate-400">Passagem de mouse e contrastes</span>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={accentColor}
                    onChange={(e) => {
                      setAccentColor(e.target.value);
                      setSelectedPreset('custom');
                    }}
                    className="w-12 h-10 rounded-lg cursor-pointer border border-slate-300 p-0.5 bg-white"
                  />
                  <input
                    type="text"
                    value={accentColor}
                    onChange={(e) => {
                      setAccentColor(e.target.value);
                      setSelectedPreset('custom');
                    }}
                    className="flex-1 px-3 py-2 text-xs font-mono font-bold rounded-lg border border-slate-200 bg-white text-slate-800 uppercase focus:outline-[#00687a]"
                    placeholder="#004e5c"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: LOGO & NOME DA MARCA */}
      {activeTab === 'logo' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
            <div>
              <h3 className="text-base font-bold text-[#091426] flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-[#00687a]" />
                <span>Configuração de Logo & Identidade</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Defina a logo oficial e o nome comercial que aparecem no topo e no rodapé do seu site.
              </p>
            </div>

            {/* Brand Name Input */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">
                Nome Comercial / Estúdio / Marca do Site
              </label>
              <input
                type="text"
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                placeholder="Ex: Roberto Almeida | Personal Trainer VIP"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#00687a]"
              />
              <p className="text-[11px] text-slate-400">
                Aparece no cabeçalho de navegação, no rodapé e nas tags de compartilhamento.
              </p>
            </div>

            {/* Logo Display Toggle */}
            <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-slate-50">
              <div>
                <span className="text-xs font-bold text-slate-800 block">Exibir Logo no Cabeçalho do Site</span>
                <span className="text-[11px] text-slate-500">
                  Mostra sua logo ao lado do seu nome e foto no topo do site público.
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={showLogo}
                  onChange={(e) => setShowLogo(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#00687a]"></div>
              </label>
            </div>

            {/* Logo Upload & URL */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              {/* Option A: Upload */}
              <div className="p-5 rounded-2xl border-2 border-dashed border-slate-300 hover:border-[#00687a] bg-slate-50/50 flex flex-col items-center justify-center text-center gap-3 transition-colors">
                <div className="w-12 h-12 rounded-full bg-cyan-50 text-[#00687a] flex items-center justify-center">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800">Fazer Upload de Logo do Computador</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">PNG com fundo transparente, JPG ou SVG</p>
                </div>
                <label className="px-4 py-2 bg-[#00687a] hover:bg-[#004e5c] text-white text-xs font-bold rounded-xl cursor-pointer shadow-xs transition-all">
                  <span>Selecionar Arquivo</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Option B: Direct URL */}
              <div className="p-5 rounded-2xl border border-slate-200 bg-white flex flex-col justify-between gap-3">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 block">
                    Ou Cole uma URL Direta da Logo
                  </label>
                  <input
                    type="url"
                    value={logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                    placeholder="https://meusite.com/logo.png"
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#00687a]"
                  />
                  <p className="text-[10px] text-slate-400">
                    Link público para seu arquivo de imagem online.
                  </p>
                </div>

                {logoUrl && (
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <div className="flex items-center gap-2">
                      <img
                        src={logoUrl}
                        alt="Logo Preview"
                        className="w-8 h-8 rounded-lg object-contain border border-slate-200 bg-slate-50"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                      <span className="text-xs font-semibold text-emerald-600">Logo carregada!</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setLogoUrl('')}
                      className="text-xs text-rose-500 hover:text-rose-700 flex items-center gap-1 font-semibold"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remover</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Option C: Preset Model Logos */}
            <div className="pt-3">
              <h4 className="text-xs font-bold text-slate-700 mb-2">
                Ou Escolha entre Modelos de Logo Pré-Definidos:
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                {PRESET_LOGO_OPTIONS.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => setLogoUrl(item.imageUrl)}
                    className={`p-2.5 rounded-xl border text-center cursor-pointer transition-all hover:scale-105 ${
                      logoUrl === item.imageUrl
                        ? 'border-[#00687a] bg-cyan-50 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-12 h-12 mx-auto rounded-full object-cover border border-slate-200 mb-1.5"
                    />
                    <div className="text-[11px] font-bold text-slate-800 truncate">{item.name}</div>
                    <div className="text-[9px] text-slate-400 truncate">{item.niche}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* LIVE PREVIEW COMPONENT */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-[#091426] flex items-center gap-2">
              <Laptop className="w-4 h-4 text-[#00687a]" />
              <span>Prévia Interativa em Tempo Real</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Veja exatamente como os elementos do site reagem às cores e à logo configurada:
            </p>
          </div>
          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Aplicar e Salvar Agora</span>
          </button>
        </div>

        {/* Mockup Container */}
        <div className="border border-slate-300 rounded-2xl overflow-hidden shadow-sm bg-[#f7f9fb]">
          {/* Mockup Top Header */}
          <div className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {showLogo && logoUrl ? (
                <img
                  src={logoUrl}
                  alt="Logo"
                  className="w-9 h-9 rounded-lg object-contain border border-slate-200 bg-white"
                />
              ) : (
                <img
                  src={currentTeacher.avatarUrl}
                  alt={currentTeacher.name}
                  className="w-9 h-9 rounded-full object-cover border-2"
                  style={{ borderColor: primaryColor }}
                />
              )}
              <div>
                <div className="font-bold text-xs text-[#091426] leading-tight">
                  {brandName || currentTeacher.name}
                </div>
                <div className="text-[10px] font-semibold" style={{ color: primaryColor }}>
                  {currentTeacher.role}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-4 text-[11px] font-medium text-slate-500 pr-2">
                <span>Início</span>
                <span>Currículo</span>
                <span>Serviços</span>
                <span>Depoimentos</span>
              </div>
              <button
                className="px-3.5 py-1.5 rounded-lg text-xs font-bold text-white shadow-xs transition-transform flex items-center gap-1"
                style={{ backgroundColor: primaryColor }}
              >
                <span>Agendar Aula</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Mockup Hero Banner */}
          <div className="p-6 md:p-8 bg-white border-b border-slate-200 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-3 max-w-md">
              <div 
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider"
                style={{ 
                  backgroundColor: `${secondaryColor}25`,
                  color: primaryColor,
                  border: `1px solid ${secondaryColor}60`
                }}
              >
                <Sparkles className="w-3 h-3" />
                <span>{currentTeacher.specialty.slice(0, 45)}...</span>
              </div>

              <h3 className="text-xl md:text-2xl font-extrabold text-[#091426] tracking-tight">
                {brandName || currentTeacher.name}
              </h3>
              <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                {currentTeacher.bio}
              </p>

              <div className="flex items-center gap-3 pt-1">
                <button
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white shadow-ambient flex items-center gap-1.5"
                  style={{ backgroundColor: primaryColor }}
                >
                  <span>Agendar Horário</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <div className="flex items-center gap-1 text-amber-400 text-xs font-bold">
                  <Star className="w-3.5 h-3.5 fill-amber-400" />
                  <span className="text-slate-800">{currentTeacher.rating}</span>
                </div>
              </div>
            </div>

            {/* Mini Service Card Preview */}
            <div className="w-full md:w-64 p-4 rounded-xl border border-slate-200 bg-[#f7f9fb] shadow-xs space-y-2">
              <span 
                className="text-[9px] font-bold px-2 py-0.5 rounded-full uppercase"
                style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}
              >
                Serviço em Destaque
              </span>
              <div className="text-xs font-bold text-slate-900">Aula Individual / Consultoria VIP</div>
              <div className="text-sm font-extrabold" style={{ color: primaryColor }}>
                R$ 150,00 <span className="text-[10px] font-normal text-slate-500">/ 60 min</span>
              </div>
              <div 
                className="w-full py-1.5 text-center text-xs font-bold rounded-lg text-white"
                style={{ backgroundColor: primaryColor }}
              >
                Reservar Horário
              </div>
            </div>
          </div>

          {/* Mockup Footer Accent Bar */}
          <div 
            className="p-3 text-center text-[10px] font-semibold text-white flex items-center justify-between px-6"
            style={{ backgroundColor: accentColor }}
          >
            <span>© {new Date().getFullYear()} {brandName || currentTeacher.name} - Todos os direitos reservados</span>
            <span className="flex items-center gap-1 text-[10px] opacity-90">
              <ShieldCheck className="w-3 h-3" />
              <span>Ambiente Seguro</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
