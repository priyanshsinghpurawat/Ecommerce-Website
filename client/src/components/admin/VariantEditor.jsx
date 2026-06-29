import { Plus, Trash2, Wand2, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import ImageDropzone from './ImageDropzone.jsx';
import { COLOR_MAP, COLOR_OPTIONS, getSizeGroups } from '../../utils/constants.js';

/** Impure logic moved outside to satisfy React Compiler purity rules */
const generateRandomSkuSuffix = () => Math.floor(1000 + Math.random() * 9000);

export default function VariantEditor({ value = [], onChange, categoryName = '' }) {
  const [collapsed, setCollapsed] = useState({});
  const sizeGroups = getSizeGroups(categoryName);

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

  const toggleCollapse = (i) =>
    setCollapsed((prev) => ({ ...prev, [i]: !prev[i] }));

  const autoSku = (v, i) => {
    const colorCode = v.color ? v.color.substring(0, 3).toUpperCase() : 'CLR';
    const sizeCode  = v.size  ? v.size.replace(/\s+/g, '').toUpperCase() : 'SZ';
    const rand = generateRandomSkuSuffix();
    updateAt(i, { sku: `${colorCode}-${sizeCode}-${rand}` });
  };

  const inputCls = 'w-full px-3 py-2 rounded-xl border border-border bg-app-bg text-app-text text-sm focus:outline-none focus:border-brand-primary transition-colors';

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-black uppercase tracking-wider text-sm">Variants</h3>
          <p className="text-[11px] text-muted mt-0.5">
            Each color × size can have its own images — customers will see them when they pick a colour.
          </p>
        </div>
        <button
          type="button"
          onClick={addRow}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-primary text-black text-xs font-black uppercase tracking-wider hover:opacity-90 transition-all shadow-md shadow-brand-primary/20"
        >
          <Plus className="w-3.5 h-3.5" /> Add Variant
        </button>
      </div>

      {value.length === 0 && (
        <div className="py-10 rounded-2xl border-2 border-dashed border-border text-center space-y-2">
          <p className="text-2xl">🎨</p>
          <p className="text-xs font-bold text-muted uppercase tracking-wider">
            No variants yet — variants are optional.
          </p>
          <p className="text-[10px] text-muted/60">
            Add variants for different colours or sizes with their own images.
          </p>
        </div>
      )}

      <div className="space-y-3">
        {value.map((v, i) => {
          const swatchColor = COLOR_MAP[v.color];
          const isCollapsed = collapsed[i];
          const varLabel = [v.color, v.size].filter(Boolean).join(' / ') || `Variant ${i + 1}`;

          return (
            <div key={i} className="border border-border rounded-2xl overflow-hidden bg-app-card shadow-soft">
              <button
                type="button"
                onClick={() => toggleCollapse(i)}
                className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-app-panel/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {swatchColor ? (
                    <span
                      className="w-5 h-5 rounded-full border-2 border-border shadow-sm shrink-0"
                      style={{ backgroundColor: swatchColor }}
                    />
                  ) : (
                    <span className="w-5 h-5 rounded-full border-2 border-dashed border-border shrink-0" />
                  )}
                  <span className="text-sm font-bold text-app-text">{varLabel}</span>
                  {v.sku && (
                    <span className="text-[10px] font-mono text-muted bg-app-panel px-2 py-0.5 rounded-lg">
                      {v.sku}
                    </span>
                  )}
                  {v.images?.length > 0 && (
                    <span className="text-[10px] font-bold text-brand-primary">
                      {v.images.length} image{v.images.length !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); removeAt(i); }}
                    className="text-error hover:text-red-400 transition-colors p-1"
                    title="Remove variant"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  {isCollapsed ? <ChevronDown className="w-4 h-4 text-muted" /> : <ChevronUp className="w-4 h-4 text-muted" />}
                </div>
              </button>

              {!isCollapsed && (
                <div className="px-5 pb-5 space-y-5 border-t border-border">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-widest text-muted">Colour</label>
                      <div className="flex items-center gap-2">
                        <span
                          className="w-8 h-8 rounded-lg border-2 border-border shrink-0 transition-all"
                          style={{ backgroundColor: swatchColor || 'transparent' }}
                        />
                        <select
                          value={v.color}
                          onChange={(e) => updateAt(i, { color: e.target.value })}
                          className={inputCls}
                        >
                          <option value="">Select colour</option>
                          {COLOR_OPTIONS.map(c => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-widest text-muted">Size</label>
                      <select
                        value={v.size}
                        onChange={(e) => updateAt(i, { size: e.target.value })}
                        className={inputCls}
                      >
                        <option value="">Select size</option>
                        {sizeGroups.map(g => (
                          <optgroup key={g.label} label={g.label}>
                            {g.sizes.map(s => <option key={s} value={s}>{s}</option>)}
                          </optgroup>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-widest text-muted">SKU</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="e.g. BLK-M-1234"
                          value={v.sku}
                          onChange={(e) => updateAt(i, { sku: e.target.value })}
                          className={`${inputCls} uppercase font-mono`}
                        />
                        <button
                          type="button"
                          title="Auto-generate SKU"
                          onClick={() => autoSku(v, i)}
                          className="px-3 border border-border rounded-xl bg-app-panel hover:bg-brand-primary hover:text-black hover:border-brand-primary transition-all shrink-0"
                        >
                          <Wand2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-widest text-muted">Stock</label>
                      <input
                        type="number"
                        min="0"
                        placeholder="0"
                        value={v.stock}
                        onChange={(e) => updateAt(i, { stock: e.target.value })}
                        className={inputCls}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-widest text-muted">
                        Price Override (₹)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="Leave blank to use base price"
                        value={v.price}
                        onChange={(e) => updateAt(i, { price: e.target.value })}
                        className={inputCls}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-muted">
                        Colour Images
                        {v.color && <span className="ml-1 normal-case font-bold text-brand-primary">— {v.color}</span>}
                      </label>
                      <p className="text-[10px] text-muted/60 mt-0.5">
                        These images appear when a customer selects this colour on the product page.
                      </p>
                    </div>
                    <ImageDropzone
                      value={v.images}
                      onChange={(images) => updateAt(i, { images })}
                      label={`Drop ${v.color || 'variant'} photos here`}
                      maxFiles={8}
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {value.length > 0 && (
        <button
          type="button"
          onClick={addRow}
          className="w-full py-3 border-2 border-dashed border-border rounded-2xl text-xs font-bold uppercase tracking-wider text-muted hover:border-brand-primary hover:text-brand-primary transition-all"
        >
          + Add Another Variant
        </button>
      )}
    </div>
  );
}
