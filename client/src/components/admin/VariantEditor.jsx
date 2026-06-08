import { Plus, Trash2 } from 'lucide-react';
import ImageDropzone from './ImageDropzone.jsx';

/**
 * Variants editor — Powerlook/Savana style.
 * value: [{ color, size, sku, stock, price, images: [item, ...] }, ...]
 *   items follow uploadHelpers shape: { id, previewUrl, kind: 'file'|'remote', file?, url? }
 */
export default function VariantEditor({ value = [], onChange }) {
  const updateAt = (i, patch) => {
    const next = [...value];
    next[i] = { ...next[i], ...patch };
    onChange(next);
  };

  const addRow = () =>
    onChange([
      ...value,
      { color: '', size: '', sku: '', stock: 0, price: '', images: [] }
    ]);

  const removeAt = (i) => onChange(value.filter((_, idx) => idx !== i));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold">Variants</h3>
          <p className="text-xs text-muted">
            Add color × size combinations. Each variant can have its own images.
          </p>
        </div>
        <button
          type="button"
          onClick={addRow}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-lux-primary text-black text-sm font-bold uppercase hover:opacity-90 transition-all shadow-sm"
        >
          <Plus className="w-4 h-4" /> Add variant
        </button>
      </div>

      {value.length === 0 && (
        <p className="text-sm text-muted italic">
          No variants yet. Variants are optional — the product can sell using the
          main gallery and base stock.
        </p>
      )}

      {value.map((v, i) => (
        <div key={i} className="border border-border rounded-xl p-4 space-y-4 bg-lux-card shadow-soft">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <input
              type="text"
              placeholder="Color (e.g. Black)"
              value={v.color}
              onChange={(e) => updateAt(i, { color: e.target.value })}
              className="px-3 py-2 rounded-md border border-border bg-lux-bg text-lux-dark text-sm focus:outline-none focus:border-lux-primary"
            />
            <input
              type="text"
              placeholder="Size (e.g. M)"
              value={v.size}
              onChange={(e) => updateAt(i, { size: e.target.value })}
              className="px-3 py-2 rounded-md border border-border bg-lux-bg text-lux-dark text-sm focus:outline-none focus:border-lux-primary"
            />
            <input
              type="text"
              placeholder="SKU"
              value={v.sku}
              onChange={(e) => updateAt(i, { sku: e.target.value })}
              className="px-3 py-2 rounded-md border border-border bg-lux-bg text-lux-dark text-sm focus:outline-none focus:border-lux-primary"
            />
            <input
              type="number"
              min="0"
              placeholder="Stock"
              value={v.stock}
              onChange={(e) => updateAt(i, { stock: e.target.value })}
              className="px-3 py-2 rounded-md border border-border bg-lux-bg text-lux-dark text-sm focus:outline-none focus:border-lux-primary"
            />
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="Price override (opt.)"
              value={v.price}
              onChange={(e) => updateAt(i, { price: e.target.value })}
              className="px-3 py-2 rounded-md border border-border bg-lux-bg text-lux-dark text-sm focus:outline-none focus:border-lux-primary"
            />
          </div>

          <ImageDropzone
            value={v.images}
            onChange={(images) => updateAt(i, { images })}
            label={`Variant images${v.color || v.size ? ` — ${[v.color, v.size].filter(Boolean).join(' / ')}` : ''}`}
            maxFiles={8}
          />

          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => removeAt(i)}
              className="inline-flex items-center gap-1 text-sm text-error hover:underline"
            >
              <Trash2 className="w-4 h-4" /> Remove variant
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
