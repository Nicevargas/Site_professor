import React from 'react';
import { ServiceItem } from '../types';
import { 
  Dumbbell, 
  Waves, 
  Activity, 
  GraduationCap, 
  Calculator, 
  Clock, 
  Edit3, 
  Copy, 
  Trash2, 
  Plus, 
  Sparkles,
  CheckCircle,
  XCircle
} from 'lucide-react';

interface ServicesViewProps {
  services: ServiceItem[];
  onOpenNewServiceModal: () => void;
  onEditService: (service: ServiceItem) => void;
  onDuplicateService: (service: ServiceItem) => void;
  onDeleteService: (id: string) => void;
  onToggleActive: (id: string) => void;
}

export const ServicesView: React.FC<ServicesViewProps> = ({
  services,
  onOpenNewServiceModal,
  onEditService,
  onDuplicateService,
  onDeleteService,
  onToggleActive,
}) => {
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'fitness_center':
        return <Dumbbell className="w-6 h-6" />;
      case 'pool':
        return <Waves className="w-6 h-6" />;
      case 'sports_martial_arts':
        return <Activity className="w-6 h-6" />;
      case 'calculate':
        return <Calculator className="w-6 h-6" />;
      case 'menu_book':
      case 'school':
      default:
        return <GraduationCap className="w-6 h-6" />;
    }
  };

  return (
    <main className="flex-1 p-4 md:p-10 bg-[#f7f9fb] pb-32 overflow-y-auto font-sans relative">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Row */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-[#091426] tracking-tight">
              Meus Serviços
            </h1>
            <p className="text-sm md:text-base text-[#45474c] mt-1">
              Gerencie as modalidades, valores e planos que você oferece aos seus alunos.
            </p>
          </div>
          <button
            onClick={onOpenNewServiceModal}
            className="h-12 px-6 bg-[#00687a] hover:bg-[#004e5c] text-white font-semibold text-sm rounded-xl flex items-center justify-center gap-2 shadow-ambient hover:shadow-elevated transition-all"
          >
            <Plus className="w-5 h-5" />
            <span>Novo Serviço</span>
          </button>
        </div>

        {/* Bento Grid / Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((svc) => (
            <div
              key={svc.id}
              className={`bg-white rounded-2xl p-6 shadow-ambient border border-[#eceef0] hover:shadow-elevated transition-all flex flex-col justify-between group relative ${
                !svc.active ? 'opacity-80 bg-slate-50/70' : ''
              }`}
            >
              {/* Card Top */}
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      svc.active
                        ? 'bg-[#d8e3fb] text-[#091426]'
                        : 'bg-[#e0e3e5] text-[#45474c]'
                    }`}
                  >
                    {getIcon(svc.iconName)}
                  </div>

                  <button
                    onClick={() => onToggleActive(svc.id)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold cursor-pointer transition-colors ${
                      svc.active
                        ? 'bg-[#acedff]/40 text-[#00687a] hover:bg-[#acedff]'
                        : 'bg-[#e0e3e5] text-[#45474c] hover:bg-slate-300'
                    }`}
                    title="Clique para alternar status"
                  >
                    {svc.active ? 'Ativo' : 'Inativo'}
                  </button>
                </div>

                <h3 className="text-lg font-bold text-[#091426] mb-1 group-hover:text-[#00687a] transition-colors">
                  {svc.name}
                </h3>
                <p className="text-sm text-[#45474c] mb-6 line-clamp-2">
                  {svc.description}
                </p>
              </div>

              {/* Card Bottom / Price & Actions */}
              <div className="flex justify-between items-center pt-4 border-t border-[#eceef0] mt-auto">
                <div>
                  <p className="text-2xl font-extrabold text-[#091426]">
                    R$ {svc.price}
                  </p>
                  <p className="text-xs text-[#75777d] flex items-center gap-1 mt-0.5">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{svc.durationMinutes} min</span>
                    <span className="mx-1">•</span>
                    <span className="truncate max-w-[110px]">{svc.modality}</span>
                  </p>
                </div>

                {/* Hover action buttons */}
                <div className="flex items-center gap-1 opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => onEditService(svc)}
                    className="w-9 h-9 rounded-full hover:bg-slate-100 flex items-center justify-center text-[#75777d] hover:text-[#091426] transition-colors"
                    title="Editar Serviço"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDuplicateService(svc)}
                    className="w-9 h-9 rounded-full hover:bg-slate-100 flex items-center justify-center text-[#75777d] hover:text-[#091426] transition-colors"
                    title="Duplicar Serviço"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDeleteService(svc.id)}
                    className="w-9 h-9 rounded-full hover:bg-red-50 flex items-center justify-center text-[#75777d] hover:text-[#ba1a1a] transition-colors"
                    title="Excluir Serviço"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Floating Action Button (FAB) on mobile / desktop */}
        <button
          onClick={onOpenNewServiceModal}
          className="fixed bottom-20 md:bottom-8 right-6 md:right-10 w-14 h-14 bg-[#00687a] hover:bg-[#004e5c] text-white rounded-2xl shadow-[0_8px_20px_rgba(0,104,122,0.4)] flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95 z-40 group"
          title="Adicionar Novo Serviço"
        >
          <Plus className="w-7 h-7 group-hover:rotate-90 transition-transform duration-300" />
        </button>

        {/* Footer */}
        <footer className="w-full py-8 flex flex-col md:flex-row justify-between items-center text-[#45474c] text-xs border-t border-[#eceef0] mt-12">
          <p className="font-semibold text-sm text-[#091426]">Agenda do Professor</p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <a href="#contato" className="hover:text-[#091426] transition-colors">Contato</a>
            <a href="#termos" className="hover:text-[#091426] transition-colors">Termos de Uso</a>
            <a href="#privacidade" className="hover:text-[#091426] transition-colors">Privacidade</a>
          </div>
          <p className="mt-4 md:mt-0">© 2024 Agenda do Professor. Todos os direitos reservados.</p>
        </footer>
      </div>
    </main>
  );
};
