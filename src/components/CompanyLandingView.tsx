import React from 'react';
import { Company, ServiceItem, TeacherProfile } from '../types';
import { getFirstName } from '../utils/names';
import { CalendarPlus, MapPin, MessageSquare, Phone, Sparkles, Users } from 'lucide-react';

interface CompanyLandingViewProps {
  company: Company;
  /** Professores desta academia */
  teachers: TeacherProfile[];
  /** Todos os serviços; a página mostra os de cada professor */
  services: ServiceItem[];
  /** Abre a vitrine do professor escolhido */
  onSelectTeacher: (teacher: TeacherProfile) => void;
  onEnterApp: () => void;
}

/**
 * Vitrine da academia: a porta de entrada de quem procura pela escola, e não
 * por um professor específico. Cada professor continua com a página dele --
 * daqui o visitante escolhe com quem quer aula.
 */
export const CompanyLandingView: React.FC<CompanyLandingViewProps> = ({
  company,
  teachers,
  services,
  onSelectTeacher,
  onEnterApp,
}) => {
  const primaria = company.primaryColor || '#00687a';
  const acento = company.accentColor || '#004e5c';
  const whatsapp = (company.phone || '').replace(/\D/g, '');

  const servicosDoProfessor = (teacherId: string) =>
    services.filter((s) => s.teacherId === teacherId && s.active);

  return (
    <div className="min-h-screen bg-[#f7f9fb] font-sans">
      {/* Cabeçalho */}
      <header
        className="text-white"
        style={{ background: `linear-gradient(135deg, ${acento} 0%, ${primaria} 100%)` }}
      >
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            {company.logoUrl ? (
              <img
                src={company.logoUrl}
                alt=""
                referrerPolicy="no-referrer"
                className="w-9 h-9 rounded-lg object-cover bg-white/10"
              />
            ) : (
              <div className="w-9 h-9 rounded-lg bg-white/15 flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
            )}
            <span className="font-bold truncate">{company.tradeName || company.name}</span>
          </div>
          <button
            onClick={onEnterApp}
            className="px-4 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-sm font-bold transition-colors shrink-0"
          >
            Entrar
          </button>
        </div>

        <div className="max-w-6xl mx-auto px-4 pb-14 pt-8">
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight max-w-3xl text-balance">
            {company.headline || company.name}
          </h1>
          {company.bio && (
            <p className="mt-4 text-base md:text-lg text-white/85 max-w-2xl leading-relaxed">
              {company.bio}
            </p>
          )}

          <div className="mt-7 flex flex-wrap items-center gap-3 text-sm">
            <span className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-white/10 border border-white/15">
              <Users className="w-4 h-4" />
              {teachers.length} professor(es)
            </span>
            {company.city && (
              <span className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-white/10 border border-white/15">
                <MapPin className="w-4 h-4" />
                {company.city}
              </span>
            )}
            {whatsapp && (
              <a
                href={`https://wa.me/${whatsapp}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-white text-[#091426] font-bold hover:bg-white/90 transition-colors"
              >
                <MessageSquare className="w-4 h-4 text-emerald-600" />
                Falar no WhatsApp
              </a>
            )}
          </div>
        </div>
      </header>

      {/* Professores */}
      <main className="max-w-6xl mx-auto px-4 py-12">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-[#091426]">Escolha seu professor</h2>
          <p className="text-sm text-[#45474c] mt-1">
            Cada professor tem a própria agenda e os próprios horários. Abra o perfil para ver as
            aulas e agendar.
          </p>
        </div>

        {teachers.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center">
            <Users className="w-8 h-8 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-700">
              Os professores desta academia ainda não estão publicados
            </p>
            {whatsapp && (
              <a
                href={`https://wa.me/${whatsapp}`}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-white font-bold text-sm"
                style={{ background: primaria }}
              >
                <MessageSquare className="w-4 h-4" />
                Falar com a academia
              </a>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {teachers.map((teacher) => {
              const servicos = servicosDoProfessor(teacher.id);
              return (
                <article
                  key={teacher.id}
                  className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col hover:shadow-md transition-shadow"
                >
                  <div className="p-5 flex items-center gap-3">
                    {teacher.avatarUrl ? (
                      <img
                        src={teacher.avatarUrl}
                        alt=""
                        referrerPolicy="no-referrer"
                        className="w-14 h-14 rounded-full object-cover border-2 border-slate-100 shrink-0"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                        <Users className="w-6 h-6 text-slate-400" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <h3 className="font-bold text-[#091426] truncate">{teacher.name}</h3>
                      <p className="text-xs text-slate-500 truncate">
                        {teacher.specialty || teacher.role}
                      </p>
                    </div>
                  </div>

                  {teacher.bio && (
                    <p className="px-5 text-xs text-slate-600 line-clamp-3 leading-relaxed">
                      {teacher.bio}
                    </p>
                  )}

                  {servicos.length > 0 && (
                    <ul className="px-5 mt-4 flex flex-wrap gap-1.5">
                      {servicos.slice(0, 3).map((s) => (
                        <li
                          key={s.id}
                          className="px-2.5 py-1 rounded-full bg-slate-100 text-[11px] font-semibold text-slate-600"
                        >
                          {s.name}
                        </li>
                      ))}
                      {servicos.length > 3 && (
                        <li className="px-2.5 py-1 text-[11px] text-slate-400">
                          +{servicos.length - 3}
                        </li>
                      )}
                    </ul>
                  )}

                  <div className="p-5 mt-auto pt-5">
                    <button
                      onClick={() => onSelectTeacher(teacher)}
                      className="w-full py-2.5 rounded-xl text-white text-sm font-bold flex items-center justify-center gap-2 transition-opacity hover:opacity-90"
                      style={{ background: primaria }}
                    >
                      <CalendarPlus className="w-4 h-4" />
                      Ver horários de {getFirstName(teacher.name)}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="max-w-6xl mx-auto px-4 py-8 flex flex-col sm:flex-row justify-between gap-4 text-xs text-slate-500">
          <div>
            <p className="font-bold text-slate-700">{company.name}</p>
            {company.document && <p className="mt-0.5">CNPJ {company.document}</p>}
          </div>
          <div className="space-y-0.5 sm:text-right">
            {company.email && <p>{company.email}</p>}
            {company.phone && (
              <p className="flex items-center gap-1.5 sm:justify-end">
                <Phone className="w-3.5 h-3.5" />
                {company.phone}
              </p>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
};
