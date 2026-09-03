import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { VideoFormModal, VideoFormMode } from './VideoFormModal';
import { TeacherProfile, VideoItem } from '../../types';

const teacher: TeacherProfile = {
  id: 'prof-roberto',
  name: 'Prof. Roberto Almeida',
  role: 'Personal Trainer',
  specialty: 'Treino',
  bio: '',
  rating: 5,
  reviewCount: 1,
  yearsExperience: 1,
  avatarUrl: '',
  heroImageUrl: '',
  whatsapp: '',
  email: 'roberto@teste.com',
};

const existingPodcast: VideoItem = {
  id: 'vid-1',
  title: 'Episódio antigo',
  mediaType: 'podcast',
  category: 'Entrevistas & Debates',
  videoUrl: 'https://open.spotify.com/embed/episode/abc',
  thumbnailUrl: 'https://example.com/thumb.jpg',
  duration: '30:00',
  description: 'Descrição antiga',
  active: true,
  episodeNumber: 'EP #1',
};

function renderForm(mode: VideoFormMode, videos: VideoItem[] = [existingPodcast]) {
  const onSave = vi.fn();
  const onClose = vi.fn();
  render(<VideoFormModal mode={mode} videos={videos} currentTeacher={teacher} onSave={onSave} onClose={onClose} />);
  return { onSave, onClose };
}

const titleInput = () => screen.getByPlaceholderText(/^Ex: (PodCast|Módulo|Apresentação|Conheça)/i);
const urlInput = () => screen.getByPlaceholderText(/youtube\.com\/watch|open\.spotify\.com\/episode/i);
const categoryInput = () => screen.getByPlaceholderText(/Metodologia, Aulas, Oferta/i);
const typeButton = (label: RegExp) => screen.getByRole('button', { name: label });
const submit = () => fireEvent.click(screen.getByRole('button', { name: /adicionar conteúdo|salvar alterações/i }));

describe('formulário de vídeo, curso e podcast', () => {
  it('novo podcast começa com o tipo, a categoria e o número do episódio preenchidos', () => {
    renderForm({ kind: 'new', type: 'podcast' });
    expect(categoryInput()).toHaveValue('Entrevistas & Debates');
    // já existe 1 podcast na lista, então o próximo é o EP #2
    expect(screen.getByDisplayValue('EP #2')).toBeInTheDocument();
    expect(screen.getByText(/status do conteúdo: ativo no site/i)).toBeInTheDocument();
  });

  it('trocar o tipo ajusta as sugestões de categoria', () => {
    renderForm({ kind: 'new', type: 'podcast' });
    fireEvent.click(typeButton(/^curso online$/i));
    expect(screen.getByText('Aulas & Didática')).toBeInTheDocument();
    expect(screen.queryByText('Bate-papo com Alunos')).not.toBeInTheDocument();

    fireEvent.click(typeButton(/^vendas$/i));
    expect(screen.getByText('Lançamentos & Ofertas')).toBeInTheDocument();
  });

  it('salva um curso online novo com URL normalizada para embed e status ativo', () => {
    const { onSave } = renderForm({ kind: 'new', type: 'curso_online' });
    fireEvent.change(titleInput(), { target: { value: 'Módulo 01 - Introdução' } });
    fireEvent.change(urlInput(), { target: { value: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' } });
    fireEvent.change(categoryInput(), { target: { value: 'Aulas & Didática' } });
    submit();

    expect(onSave).toHaveBeenCalledTimes(1);
    const [item, isEdit] = onSave.mock.calls[0];
    expect(isEdit).toBe(false);
    expect(item.id).toMatch(/^vid-/);
    expect(item).toMatchObject({
      title: 'Módulo 01 - Introdução',
      mediaType: 'curso_online',
      category: 'Aulas & Didática',
      active: true,
    });
    expect(item.videoUrl).toContain('youtube.com/embed/dQw4w9WgXcQ');
    expect(item.thumbnailUrl).toBeTruthy();
  });

  it('não salva sem título ou sem URL', () => {
    const { onSave } = renderForm({ kind: 'new', type: 'institucional' });
    // o formulário novo já sugere uma URL de exemplo; apagando, não pode salvar
    fireEvent.change(titleInput(), { target: { value: 'Só título' } });
    fireEvent.change(urlInput(), { target: { value: '   ' } });
    submit();
    expect(onSave).not.toHaveBeenCalled();

    fireEvent.change(urlInput(), { target: { value: 'https://youtu.be/dQw4w9WgXcQ' } });
    fireEvent.change(titleInput(), { target: { value: '' } });
    submit();
    expect(onSave).not.toHaveBeenCalled();
  });

  it('marcar como inativo sai no item salvo', () => {
    const { onSave } = renderForm({ kind: 'new', type: 'vendas' });
    fireEvent.change(titleInput(), { target: { value: 'Oferta de matrícula' } });
    fireEvent.change(urlInput(), { target: { value: 'https://youtu.be/xyz789' } });
    fireEvent.click(screen.getByRole('button', { name: /^publicado$/i }));
    expect(screen.getByText(/status do conteúdo: inativo/i)).toBeInTheDocument();
    submit();
    expect(onSave.mock.calls[0][0].active).toBe(false);
  });

  it('edição carrega o item e devolve o mesmo id', () => {
    const { onSave } = renderForm({ kind: 'edit', item: existingPodcast });
    expect(titleInput()).toHaveValue('Episódio antigo');
    expect(screen.getByRole('button', { name: /salvar alterações/i })).toBeInTheDocument();

    fireEvent.change(titleInput(), { target: { value: 'Episódio renomeado' } });
    submit();

    const [item, isEdit] = onSave.mock.calls[0];
    expect(isEdit).toBe(true);
    expect(item.id).toBe('vid-1');
    expect(item.title).toBe('Episódio renomeado');
    expect(item.mediaType).toBe('podcast');
  });

  it('cancelar fecha sem salvar', () => {
    const { onSave, onClose } = renderForm({ kind: 'new', type: 'podcast' });
    fireEvent.click(screen.getByRole('button', { name: /^cancelar$/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onSave).not.toHaveBeenCalled();
  });
});
