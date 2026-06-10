import { Plus, Trash2, Wand2 } from 'lucide-react';
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
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-brand-primary text-black text-sm font-bold uppercase hover:opacity-90 transition-all shadow-sm"
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
        <div key={i} className="border border-border rounded-xl p-4 space-y-4 bg-app-card shadow-soft">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3">
            <select
              value={v.color}
              onChange={(e) => updateAt(i, { color: e.target.value })}
              className="px-3 py-2 rounded-md border border-border bg-app-bg text-app-text text-sm focus:outline-none focus:border-brand-primary"
            >
              <option value="">Select Color</option>
              {['Black', 'White', 'Blue', 'Red', 'Green', 'Sand', 'Sage', 'Khaki', 'Neon Black'].map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            <select
              value={v.size}
              onChange={(e) => updateAt(i, { size: e.target.value })}
              className="px-3 py-2 rounded-md border border-border bg-app-bg text-app-text text-sm focus:outline-none focus:border-brand-primary"
            >
              <option value="">Select Size</option>
              <optgroup label="Apparel">
                {['XS', 'S', 'M', 'L', 'XL', 'XXL'].map(s => <option key={s} value={s}>{s}</option>)}
              </optgroup>
              <optgroup label="Bottoms (Waist)">
                {['28', '30', '32', '34', '36', '38', '40'].map(s => <option key={s} value={s}>{s}</option>)}
              </optgroup>
              <optgroup label="Footwear (UK)">
                {['6', '7', '8', '9', '10', '11', '12'].map(s => <option key={`UK${s}`} value={s}>UK {s}</option>)}
              </optgroup>
            </select>

            <div className="flex gap-1">
              <input
                type="text"
                placeholder="SKU"
                value={v.sku}
                onChange={(e) => updateAt(i, { sku: e.target.value })}
                className="w-full px-3 py-2 rounded-md border border-border bg-app-bg text-app-text text-sm focus:outline-none focus:border-brand-primary uppercase"
              />
              <button
                type="button"
                title="Auto-generate SKU"
                onClick={() => {
                  if (v.color || v.size) {
                    const colorCode = v.color ? v.color.substring(0, 3).toUpperCase() : 'XXX';
                    const sizeCode = v.size ? v.size.toUpperCase() : 'XX';
                    const randomNum = Math.floor(1000 + Math.random() * 9000);
                    updateAt(i, { sku: `${colorCode}-${sizeCode}-${randomNum}` });
                  }
                }}
                className="px-2 border border-border rounded-md bg-app-panel hover:bg-brand-primary hover:text-black transition-colors"
              >
                <Wand2 className="w-4 h-4" />
              </button>
            </div>

            <input
              type="number"
              min="0"
              placeholder="Stock"
              value={v.stock}
              onChange={(e) => updateAt(i, { stock: e.target.value })}
              className="px-3 py-2 rounded-md border border-border bg-app-bg text-app-text text-sm focus:outline-none focus:border-brand-primary"
            />

            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="Price (override)"
              value={v.price}
              onChange={(e) => updateAt(i, { price: e.target.value })}
              className="px-3 py-2 rounded-md border border-border bg-app-bg text-app-text text-sm focus:outline-none focus:border-brand-primary"
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
