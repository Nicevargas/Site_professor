import { Appointment } from '../types';

/**
 * Parses and formats any valid YouTube URL (watch, embed, short link, youtu.be, shorts)
 * into a safe embed URL format.
 */
export function formatYouTubeEmbedUrl(inputUrl: string): string {
  if (!inputUrl) return '';
  const trimmed = inputUrl.trim();

  // If already an embed URL, ensure proper syntax
  if (trimmed.includes('youtube.com/embed/')) {
    return trimmed;
  }

  // Extract from youtube.com/watch?v=VIDEO_ID
  const watchMatch = trimmed.match(/(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/i);
  if (watchMatch && watchMatch[1]) {
    return `https://www.youtube.com/embed/${watchMatch[1]}`;
  }

  // Extract from youtu.be/VIDEO_ID
  const shortMatch = trimmed.match(/(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/i);
  if (shortMatch && shortMatch[1]) {
    return `https://www.youtube.com/embed/${shortMatch[1]}`;
  }

  // Extract from youtube.com/shorts/VIDEO_ID
  const shortsMatch = trimmed.match(/(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/i);
  if (shortsMatch && shortsMatch[1]) {
    return `https://www.youtube.com/embed/${shortsMatch[1]}`;
  }

  // Fallback if URL is already standard or non-standard video
  return trimmed;
}

export type MediaPlatform = 'youtube' | 'spotify' | 'vimeo' | 'audio' | 'video' | 'other';

/**
 * Universal media embed formatter that supports:
 * - YouTube videos / shorts
 * - Spotify podcast episodes & shows
 * - Vimeo videos
 * - Direct MP3/WAV/AAC audio
 * - Direct MP4/WebM video
 */
export function formatAnyMediaEmbedUrl(inputUrl: string): { embedUrl: string; platform: MediaPlatform } {
  if (!inputUrl) return { embedUrl: '', platform: 'other' };
  const trimmed = inputUrl.trim();

  // 1. Spotify Episode / Show
  if (trimmed.includes('spotify.com')) {
    if (trimmed.includes('/embed/')) {
      return { embedUrl: trimmed, platform: 'spotify' };
    }
    // https://open.spotify.com/episode/xyz -> https://open.spotify.com/embed/episode/xyz
    const episodeMatch = trimmed.match(/open\.spotify\.com\/episode\/([a-zA-Z0-9]+)/i);
    if (episodeMatch && episodeMatch[1]) {
      return { embedUrl: `https://open.spotify.com/embed/episode/${episodeMatch[1]}`, platform: 'spotify' };
    }
    const showMatch = trimmed.match(/open\.spotify\.com\/show\/([a-zA-Z0-9]+)/i);
    if (showMatch && showMatch[1]) {
      return { embedUrl: `https://open.spotify.com/embed/show/${showMatch[1]}`, platform: 'spotify' };
    }
    return { embedUrl: trimmed, platform: 'spotify' };
  }

  // 2. Vimeo
  if (trimmed.includes('vimeo.com')) {
    if (trimmed.includes('player.vimeo.com')) {
      return { embedUrl: trimmed, platform: 'vimeo' };
    }
    const vimeoMatch = trimmed.match(/vimeo\.com\/([0-9]+)/i);
    if (vimeoMatch && vimeoMatch[1]) {
      return { embedUrl: `https://player.vimeo.com/video/${vimeoMatch[1]}`, platform: 'vimeo' };
    }
  }

  // 3. YouTube
  if (trimmed.includes('youtube.com') || trimmed.includes('youtu.be')) {
    return { embedUrl: formatYouTubeEmbedUrl(trimmed), platform: 'youtube' };
  }

  // 4. Audio files
  if (/\.(mp3|wav|ogg|aac|m4a)(\?.*)?$/i.test(trimmed)) {
    return { embedUrl: trimmed, platform: 'audio' };
  }

  // 5. Video files
  if (/\.(mp4|webm|ogv|mov)(\?.*)?$/i.test(trimmed)) {
    return { embedUrl: trimmed, platform: 'video' };
  }

  return { embedUrl: trimmed, platform: 'other' };
}

/**
 * Reads a local browser file and converts it into a Base64 Data URL
 */
export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Erro ao ler arquivo como imagem base64.'));
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

/**
 * Replaces dynamic template variables like {nome_aluno}, {data}, {horario}, {professor}, {link_aula}
 */
export function applyTemplateVariables(template: string, vars: Record<string, string>): string {
  let result = template;
  for (const [key, value] of Object.entries(vars)) {
    const regex = new RegExp(`\\{${key}\\}`, 'gi');
    result = result.replace(regex, value || '');
  }
  return result;
}

export interface FinancialOverview {
  totalRevenue: number;
  confirmedRevenue: number;
  pendingRevenue: number;
  totalClasses: number;
  completedClasses: number;
  confirmedClasses: number;
  averageTicket: number;
  onlineClassesCount: number;
  inPersonClassesCount: number;
  classesDurationHours: number;
}

/**
 * Calculates financial and attendance metrics from appointment list
 */
export function calculateFinancialOverview(appointments: Appointment[]): FinancialOverview {
  let totalRevenue = 0;
  let confirmedRevenue = 0;
  let pendingRevenue = 0;
  let completedClasses = 0;
  let confirmedClasses = 0;
  let onlineClassesCount = 0;
  let inPersonClassesCount = 0;
  let totalMinutes = 0;

  appointments.forEach((apt) => {
    const price = apt.price || 0;
    totalRevenue += price;

    if (apt.status === 'Confirmado') {
      confirmedRevenue += price;
      confirmedClasses++;
    } else if (apt.status === 'Concluído') {
      confirmedRevenue += price;
      completedClasses++;
    } else if (apt.status === 'Pendente') {
      pendingRevenue += price;
    }

    if (apt.modality?.toLowerCase().includes('online')) {
      onlineClassesCount++;
    } else {
      inPersonClassesCount++;
    }

    totalMinutes += apt.durationMinutes || 60;
  });

  const totalCount = appointments.length;
  const averageTicket = totalCount > 0 ? Math.round(totalRevenue / totalCount) : 0;
  const classesDurationHours = Math.round((totalMinutes / 60) * 10) / 10;

  return {
    totalRevenue,
    confirmedRevenue,
    pendingRevenue,
    totalClasses: totalCount,
    completedClasses,
    confirmedClasses,
    averageTicket,
    onlineClassesCount,
    inPersonClassesCount,
    classesDurationHours,
  };
}

/**
 * Generates and triggers download of a standardized CSV file for financial and agenda reports
 */
export function exportAppointmentsToCsv(appointments: Appointment[], teacherName: string): void {
  const headers = [
    'ID',
    'Data',
    'Horario Inicio',
    'Horario Fim',
    'Aluno',
    'Telefone Aluno',
    'Email Aluno',
    'Servico',
    'Modalidade',
    'Valor (R$)',
    'Status',
    'Link Videochamada',
    'Notas'
  ];

  const rows = appointments.map((apt) => [
    apt.id,
    apt.date,
    apt.startTime,
    apt.endTime,
    `"${(apt.studentName || '').replace(/"/g, '""')}"`,
    `"${(apt.studentPhone || '').replace(/"/g, '""')}"`,
    `"${(apt.studentEmail || '').replace(/"/g, '""')}"`,
    `"${(apt.serviceName || '').replace(/"/g, '""')}"`,
    `"${(apt.modality || '').replace(/"/g, '""')}"`,
    apt.price || 0,
    apt.status,
    `"${(apt.meetingUrl || '').replace(/"/g, '""')}"`,
    `"${(apt.notes || '').replace(/"/g, '""')}"`
  ]);

  const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map(e => e.join(';'))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `relatorio_aulas_${teacherName.toLowerCase().replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Lê a imagem já reduzida ao tamanho que o site usa.
 *
 * As imagens do professor viram data URL dentro da linha dele no banco, sem
 * passar por storage. Sem reduzir, uma foto de celular de 4000px vira uns
 * 3 MB de texto que o banco guarda e TODO visitante baixa junto com a página
 * -- para exibir num quadrado de 400px.
 *
 * Redimensiona pelo maior lado, mantendo proporção, e nunca amplia: imagem
 * pequena continua do tamanho que é, só que recomprimida.
 */
export interface ImagemPreparada {
  /** Endereço utilizável agora: data URL do resultado */
  dataUrl: string;
  /** O mesmo conteúdo como arquivo, para subir ao Storage */
  file: File;
  /** A imagem usa transparência de verdade */
  temTransparencia: boolean;
}

/** Alguma parte da imagem é translúcida? Amostra o canal alfa. */
function detectarTransparencia(ctx: CanvasRenderingContext2D, w: number, h: number): boolean {
  try {
    const { data } = ctx.getImageData(0, 0, w, h);
    // De 4 em 4 pixels: uma logo transparente tem MUITO pixel vazio, e varrer
    // tudo numa imagem grande trava a aba por um instante visível
    for (let i = 3; i < data.length; i += 16) {
      if (data[i] < 250) return true;
    }
    return false;
  } catch {
    // Imagem de outro domínio suja o canvas e proíbe a leitura. Assumir que
    // tem transparência é o palpite seguro: no máximo guarda em WebP.
    return true;
  }
}

/**
 * Lê a imagem já reduzida ao tamanho que o site usa.
 *
 * Redimensiona pelo maior lado, mantendo proporção, e nunca amplia: imagem
 * pequena continua do tamanho que é, só que recomprimida.
 *
 * O fundo branco antes de desenhar não é enfeite. Canvas exportado como JPEG
 * não tem canal alfa, e o que era transparente sai PRETO -- foi assim que uma
 * logo de fundo transparente virou um quadrado escuro. Quando a imagem usa
 * transparência de verdade, o resultado sai em WebP e ela é preservada;
 * quando não usa, vira JPEG, que é menor.
 */
export async function readImageResized(
  file: File,
  maxSide = 1200,
  quality = 0.82
): Promise<ImagemPreparada> {
  const dataUrlOriginal = await readFileAsDataUrl(file);

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error('O arquivo não parece ser uma imagem.'));
    el.src = dataUrlOriginal;
  });

  const maior = Math.max(img.width, img.height);
  const escala = maior > maxSide ? maxSide / maior : 1;
  const largura = Math.max(1, Math.round(img.width * escala));
  const altura = Math.max(1, Math.round(img.height * escala));

  const canvas = document.createElement('canvas');
  canvas.width = largura;
  canvas.height = altura;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    // Sem canvas (navegador antigo, teste sem DOM gráfico) fica o original:
    // imagem grande é melhor que nenhuma imagem.
    return { dataUrl: dataUrlOriginal, file, temTransparencia: false };
  }

  ctx.drawImage(img, 0, 0, largura, altura);
  const temTransparencia = detectarTransparencia(ctx, largura, altura);

  if (!temTransparencia) {
    // Sem transparência, JPEG é menor. O fundo branco é redundante aqui, mas
    // garante que qualquer canto translúcido que a amostragem não pegou saia
    // branco, nunca preto.
    const comFundo = document.createElement('canvas');
    comFundo.width = largura;
    comFundo.height = altura;
    const ctx2 = comFundo.getContext('2d')!;
    ctx2.fillStyle = '#ffffff';
    ctx2.fillRect(0, 0, largura, altura);
    ctx2.drawImage(canvas, 0, 0);
    const dataUrl = comFundo.toDataURL('image/jpeg', quality);
    return { dataUrl, file: dataUrlParaArquivo(dataUrl, file.name, 'jpg'), temTransparencia };
  }

  const dataUrl = canvas.toDataURL('image/webp', quality);
  return { dataUrl, file: dataUrlParaArquivo(dataUrl, file.name, 'webp'), temTransparencia };
}

/** Converte o data URL de volta em arquivo, para subir ao Storage. */
function dataUrlParaArquivo(dataUrl: string, nomeOriginal: string, ext: string): File {
  const [cabecalho, base64] = dataUrl.split(',');
  const tipo = /:(.*?);/.exec(cabecalho)?.[1] || 'image/jpeg';
  const bin = atob(base64 || '');
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  const base = nomeOriginal.replace(/\.[^.]+$/, '') || 'imagem';
  return new File([bytes], `${base}.${ext}`, { type: tipo });
}

/** Quantos KB um data URL ocupa, para avisar quando ficou grande demais. */
export function dataUrlKb(dataUrl: string): number {
  const base64 = dataUrl.split(',')[1] || '';
  return Math.round((base64.length * 3) / 4 / 1024);
}
