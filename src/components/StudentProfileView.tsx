import React, { useState } from 'react';
import { AuthUser, TeacherProfile } from '../types';
import { User, Phone, Mail, GraduationCap, Save, CheckCircle2, MessageCircle } from 'lucide-react';

interface StudentProfileViewProps {
  currentUser: AuthUser;
  currentTeacher: TeacherProfile;
  onUpdateProfile: (updates: { name?: string; phone?: string }) => void;
}

/**
 * "Meus Dados" do aluno: edita apenas o próprio nome e telefone.
 * O perfil público, o Pix e as integrações pertencem ao professor e ficam em SettingsView.
 */
export const StudentProfileView: React.FC<StudentProfileViewProps> = ({
  currentUser,
  currentTeacher,
  onUpdateProfile,
}) => {
  const [name, setName] = useState(currentUser.name || '');
  const [phone, setPhone] = useState(currentUser.phone || '');
  const [saved, setSaved] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile({
      name: name.trim() || currentUser.name,
      phone: phone.trim(),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const inputClass =
    'w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#57dffe] focus:border-[#00687a]';

  return (
    <div className="flex-1 overflow-y-auto p-5 md:p-8">
      <div className="max-w-2xl mx-auto space-y-6 pb-20">
        <header>
          <h1 className="text-2xl md:text-3xl font-extrabold text-[#091426] tracking-tight">Meus Dados</h1>
          <p className="text-sm text-[#45474c] mt-1">
            Atualize seu nome e telefone de contato. O e-mail de acesso e o vínculo com o professor são
            gerenciados pela secretaria.
          </p>
        </header>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 shadow-card p-6 space-y-5">
          <div>
            <label htmlFor="student-name" className="block text-xs font-semibold text-slate-700 mb-1">
              Nome completo
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="student-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={inputClass}
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="student-phone" className="block text-xs font-semibold text-slate-700 mb-1">
              WhatsApp / Telefone
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="student-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(11) 90000-0000"
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label htmlFor="student-email" className="block text-xs font-semibold text-slate-700 mb-1">
              E-mail de acesso
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="student-email"
                type="email"
                value={currentUser.email}
                readOnly
                className={`${inputClass} text-slate-500 cursor-not-allowed`}
              />
            </div>
          </div>

          <div className="flex items-center gap-3 pt-1">
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#00687a] hover:bg-[#004e5c] text-white text-sm font-bold transition-colors"
            >
              <Save className="w-4 h-4" />
              Salvar
            </button>
            {saved && (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                <CheckCircle2 className="w-4 h-4" />
                Dados salvos.
              </span>
            )}
          </div>
        </form>

        <section className="bg-white rounded-2xl border border-slate-200 shadow-card p-6 space-y-4">
          <h2 className="text-sm font-bold text-[#091426] flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-[#00687a]" />
            Seu professor
          </h2>
          <div className="flex items-center gap-3">
            <img
              src={currentTeacher.avatarUrl}
              alt={currentTeacher.name}
              referrerPolicy="no-referrer"
              className="w-12 h-12 rounded-full object-cover border border-slate-200"
            />
            <div className="min-w-0">
              <p className="font-bold text-sm text-slate-900 truncate">{currentTeacher.name}</p>
              <p className="text-xs text-slate-500 truncate">{currentTeacher.specialty}</p>
            </div>
          </div>
          {currentTeacher.whatsapp && (
            <a
              href={`https://wa.me/${currentTeacher.whatsapp.replace(/\D/g, '')}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 text-xs font-semibold text-[#00687a] hover:underline"
            >
              <MessageCircle className="w-4 h-4" />
              Falar com o professor no WhatsApp
            </a>
          )}
        </section>
      </div>
    </div>
  );
};
