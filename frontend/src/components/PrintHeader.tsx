import type { Layer } from "@/types/editor";
import { sanitizeColor } from "@/lib/sanitize-color";

interface PrintHeaderProps {
  title: string;
  layers: Layer[];
}

export function PrintHeader({ title, layers }: PrintHeaderProps) {
  const visibleLayers = layers.filter((l) => l.visible);
  const dateStr = new Date().toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="hidden print:block mb-8 pb-4 border-b-2 border-zinc-300 print-header">
      <h1 className="text-3xl font-bold text-center mb-2">{title}</h1>
      <p className="text-sm text-center text-zinc-500 mb-4">{dateStr}</p>
      {visibleLayers.length > 0 && (
        <div className="flex flex-wrap justify-center gap-3">
          {visibleLayers.map((layer) => (
            <div key={layer.id} className="flex items-center gap-1.5 text-xs">
              <span
                className="inline-block w-3 h-3 rounded-full"
                style={{ backgroundColor: sanitizeColor(layer.color) }}
              />
              <span>{layer.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
