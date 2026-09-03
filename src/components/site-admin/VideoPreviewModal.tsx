import React from 'react';
import { Play, X, Mic, Headphones } from 'lucide-react';

interface VideoPreviewModalProps {
  /** URL de embed (YouTube, Vimeo, Spotify) ou arquivo direto de áudio/vídeo */
  url: string;
  onClose: () => void;
}

/** Player de teste: mostra como o conteúdo vai tocar no site antes de publicar. */
export const VideoPreviewModal: React.FC<VideoPreviewModalProps> = ({ url, onClose }) => {
const isSpotify = url.includes('spotify.com');
const isAudio = /\.(mp3|wav|ogg|aac|m4a)(\?.*)?$/i.test(url);
const isDirectVideo = /\.(mp4|webm|ogv|mov)(\?.*)?$/i.test(url);

  return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => onClose()}>
        <div className={`bg-slate-900 rounded-3xl w-full p-4 overflow-hidden shadow-elevated border border-slate-700 ${isSpotify ? 'max-w-xl' : 'max-w-3xl'}`} onClick={(e) => e.stopPropagation()}>
          <div className="flex justify-between items-center pb-3 text-white">
            <span className="text-xs font-bold flex items-center gap-2">
              {isSpotify ? (
                <>
                  <Mic className="w-4 h-4 text-purple-400" />
                  <span>Player Spotify / Podcast</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 text-rose-500 fill-rose-500" />
                  <span>Player de Demonstração</span>
                </>
              )}
            </span>
            <button onClick={() => onClose()} className="p-1 text-slate-400 hover:text-white rounded-full">
              <X className="w-5 h-5" />
            </button>
          </div>

          {isSpotify ? (
            <div className="w-full rounded-2xl overflow-hidden bg-black">
              <iframe
                src={url}
                title="Spotify Podcast"
                className="w-full h-[232px] sm:h-[352px] border-0"
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                loading="lazy"
              />
            </div>
          ) : isAudio ? (
            <div className="p-6 bg-slate-800 rounded-2xl flex flex-col items-center justify-center gap-4 text-white">
              <Headphones className="w-12 h-12 text-[#57dffe]" />
              <audio controls className="w-full">
                <source src={url} />
                Seu navegador não suporta reprodução de áudio.
              </audio>
            </div>
          ) : isDirectVideo ? (
            <div className="aspect-video w-full rounded-2xl overflow-hidden bg-black">
              <video controls className="w-full h-full object-contain">
                <source src={url} />
                Seu navegador não suporta reprodução de vídeo.
              </video>
            </div>
          ) : (
            <div className="aspect-video w-full rounded-2xl overflow-hidden bg-black">
              <iframe
                src={url}
                title="Demonstração"
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          )}
        </div>
      </div>
  );
};
