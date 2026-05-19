import { useEffect } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

type Foto = { url: string; nome?: string | null };

type Props = {
  fotos: Foto[];
  index: number | null;
  onClose: () => void;
  onChange: (i: number) => void;
};

export function Lightbox({ fotos, index, onClose, onChange }: Props) {
  const aberto = index !== null && index >= 0 && index < fotos.length;

  useEffect(() => {
    if (!aberto) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") onChange((index! + 1) % fotos.length);
      if (e.key === "ArrowLeft")
        onChange((index! - 1 + fotos.length) % fotos.length);
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [aberto, index, fotos.length, onClose, onChange]);

  if (!aberto) return null;
  const foto = fotos[index!];
  const temVarias = fotos.length > 1;
  const go = (delta: number) =>
    onChange((index! + delta + fotos.length) % fotos.length);

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        aria-label="Fechar"
        className="absolute top-4 right-4 text-white/80 hover:text-white p-2"
      >
        <X className="w-7 h-7" />
      </button>

      {temVarias && (
        <button
          onClick={e => {
            e.stopPropagation();
            go(-1);
          }}
          aria-label="Anterior"
          className="absolute left-2 sm:left-6 text-white/80 hover:text-white p-2"
        >
          <ChevronLeft className="w-9 h-9" />
        </button>
      )}

      <figure
        className="max-w-[92vw] max-h-[88vh] flex flex-col items-center"
        onClick={e => e.stopPropagation()}
      >
        <img
          src={foto.url}
          alt={foto.nome || "Foto"}
          className="max-w-[92vw] max-h-[80vh] object-contain rounded-lg"
        />
        <figcaption className="text-white/70 text-sm mt-3">
          {foto.nome || "Foto"}
          {temVarias && (
            <span className="ml-2 text-white/40">
              {index! + 1}/{fotos.length}
            </span>
          )}
        </figcaption>
      </figure>

      {temVarias && (
        <button
          onClick={e => {
            e.stopPropagation();
            go(1);
          }}
          aria-label="Próxima"
          className="absolute right-2 sm:right-6 text-white/80 hover:text-white p-2"
        >
          <ChevronRight className="w-9 h-9" />
        </button>
      )}
    </div>
  );
}
