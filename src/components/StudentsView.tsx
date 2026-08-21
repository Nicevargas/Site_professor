import React, { useState } from 'react';
import { Student } from '../types';
import { 
  Users, 
  Search, 
  UserPlus, 
  MessageSquare, 
  Phone, 
  Mail, 
  GraduationCap, 
  History, 
  Check, 
  Plus, 
  Calendar 
} from 'lucide-react';

interface StudentsViewProps {
  students: Student[];
  onAddStudent: (student: Omit<Student, 'id' | 'totalClasses' | 'joinedDate'>) => void;
  onSelectStudentToSchedule: (student: Student) => void;
}

export const StudentsView: React.FC<StudentsViewProps> = ({
  students,
  onAddStudent,
  onSelectStudentToSchedule,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'Todos' | 'Ativo' | 'Inativo'>('Todos');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentEmail, setNewStudentEmail] = useState('');
  const [newStudentPhone, setNewStudentPhone] = useState('');
  const [newStudentNotes, setNewStudentNotes] = useState('');

  const filteredStudents = students.filter((s) => {
    const matchesSearch = 
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.phone.includes(searchTerm);
    const matchesStatus = statusFilter === 'Todos' || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleCreateStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentName.trim()) return;

    onAddStudent({
      name: newStudentName.trim(),
      email: newStudentEmail.trim() || `${newStudentName.toLowerCase().replace(/\s+/g, '.')}@email.com`,
      phone: newStudentPhone.trim() || '(11) 98888-7777',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      status: 'Ativo',
      notes: newStudentNotes.trim() || 'Novo aluno cadastrado.',
    });

    setNewStudentName('');
    setNewStudentEmail('');
    setNewStudentPhone('');
    setNewStudentNotes('');
    setShowAddModal(false);
  };

  const handleOpenWhatsApp = (student: Student) => {
    const cleanPhone = student.phone.replace(/\D/g, '');
    const msg = encodeURIComponent(`Olá ${student.name}, tudo bem? Aqui é o seu professor.`);
    window.open(`https://wa.me/55${cleanPhone}?text=${msg}`, '_blank');
  };

  return (
    <main className="flex-1 p-4 md:p-10 bg-[#f7f9fb] pb-32 overflow-y-auto font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-[#091426] tracking-tight">
              Gestão de Alunos
            </h1>
            <p className="text-sm md:text-base text-[#45474c] mt-1">
              Acompanhe histórico, dados de contato e frequência dos seus alunos.
            </p>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="h-12 px-6 bg-[#00687a] hover:bg-[#004e5c] text-white font-semibold text-sm rounded-xl flex items-center justify-center gap-2 shadow-ambient hover:shadow-elevated transition-all"
          >
            <UserPlus className="w-5 h-5" />
            <span>Cadastrar Aluno</span>
          </button>
        </div>

        {/* Search & Filter Bar */}
        <div className="bg-white p-4 rounded-xl border border-[#eceef0] shadow-card flex flex-col md:flex-row justify-between gap-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar aluno por nome, e-mail ou telefone..."
              className="w-full h-11 pl-10 pr-4 bg-[#f7f9fb] border border-[#c5c6cd] rounded-lg text-sm focus:outline-none focus:border-[#00687a] focus:bg-white"
            />
          </div>

          <div className="flex items-center gap-2">
            {(['Todos', 'Ativo', 'Inativo'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                  statusFilter === st
                    ? 'bg-[#091426] text-white'
                    : 'bg-[#eceef0] text-[#45474c] hover:bg-[#e0e3e5]'
                }`}
              >
                {st === 'Todos' ? 'Todos os Alunos' : st}
              </button>
            ))}
          </div>
        </div>

        {/* Students Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStudents.map((std) => (
            <div
              key={std.id}
              className="bg-white rounded-2xl p-6 shadow-ambient border border-[#eceef0] hover:shadow-elevated transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={std.avatar}
                      alt={std.name}
                      referrerPolicy="no-referrer"
                      className="w-14 h-14 rounded-full object-cover border-2 border-slate-100 shadow-sm shrink-0"
                    />
                    <div className="min-w-0">
                      <h3 className="font-bold text-base text-[#091426] truncate">{std.name}</h3>
                      <span className="text-xs text-[#75777d]">Desde {std.joinedDate}</span>
                    </div>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                      std.status === 'Ativo'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {std.status}
                  </span>
                </div>

                <div className="space-y-2 text-xs text-[#45474c] mb-4 bg-[#f7f9fb] p-3.5 rounded-xl border border-[#eceef0]">
                  <p className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-500" />
                    <span>{std.phone}</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-500" />
                    <span className="truncate">{std.email}</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <GraduationCap className="w-3.5 h-3.5 text-[#00687a]" />
                    <span><b>{std.totalClasses}</b> aulas realizadas</span>
                  </p>
                </div>

                {std.notes && (
                  <p className="text-xs text-slate-600 italic line-clamp-2 mb-4 bg-amber-50/60 p-2.5 rounded-lg border border-amber-100">
                    "{std.notes}"
                  </p>
                )}
              </div>

              <div className="pt-4 border-t border-[#eceef0] flex items-center gap-2 mt-auto">
                <button
                  onClick={() => handleOpenWhatsApp(std)}
                  className="flex-1 py-2.5 px-3 bg-[#091426] hover:bg-[#1e293b] text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                  <span>WhatsApp</span>
                </button>
                <button
                  onClick={() => onSelectStudentToSchedule(std)}
                  className="py-2.5 px-4 bg-[#f2f4f6] hover:bg-[#e0e3e5] text-[#091426] text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                  title="Agendar Aula com este aluno"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Agendar</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Modal: Add Student */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200">
              <h2 className="text-xl font-bold text-[#091426] mb-1">Cadastrar Novo Aluno</h2>
              <p className="text-xs text-slate-500 mb-6">Preencha as informações básicas de contato.</p>

              <form onSubmit={handleCreateStudent} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#191c1e] mb-1">Nome Completo *</label>
                  <input
                    type="text"
                    required
                    value={newStudentName}
                    onChange={(e) => setNewStudentName(e.target.value)}
                    placeholder="Ex: Lucas Fernandes"
                    className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-[#00687a]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#191c1e] mb-1">Telefone / WhatsApp</label>
                    <input
                      type="text"
                      value={newStudentPhone}
                      onChange={(e) => setNewStudentPhone(e.target.value)}
                      placeholder="(11) 99999-9999"
                      className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-[#00687a]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#191c1e] mb-1">E-mail</label>
                    <input
                      type="email"
                      value={newStudentEmail}
                      onChange={(e) => setNewStudentEmail(e.target.value)}
                      placeholder="aluno@email.com"
                      className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-[#00687a]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#191c1e] mb-1">Observações / Metas</label>
                  <textarea
                    value={newStudentNotes}
                    onChange={(e) => setNewStudentNotes(e.target.value)}
                    rows={3}
                    placeholder="Ex: Foco em condicionamento, vestibulares, etc."
                    className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-[#00687a]"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-[#00687a] hover:bg-[#004e5c] text-white text-xs font-semibold rounded-xl shadow-sm"
                  >
                    Salvar Aluno
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </main>
  );
};
