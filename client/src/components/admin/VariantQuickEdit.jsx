import { useState, useEffect } from 'react';
import { Plus, Trash2, Wand2, Loader2, Save } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Modal } from '../Modal.jsx';
import { getProductVariants, deleteVariant, updateProduct } from '../../services/product.service.js';
import { COLOR_MAP, COLOR_OPTIONS, getSizeGroups } from '../../utils/constants.js';

const genSku = (color, size) => {
  const c = color ? color.substring(0, 3).toUpperCase() : 'CLR';
  const s = size ? size.replace(/\s+/g, '').toUpperCase() : 'SZ';
  return `${c}-${s}-${Math.floor(1000 + Math.random() * 9000)}`;
};

export default function VariantQuickEdit({ isOpen, onClose, productId, categoryName = '' }) {
  const [variants, setVariants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const sizeGroups = getSizeGroups(categoryName);

  useEffect(() => {
    if (!isOpen || !productId) return;
    let cancel = false;
    setLoading(true);
    getProductVariants(productId)
      .then((res) => {
        if (cancel) return;
        const data = res?.data || [];
        setVariants(
          data.map((v) => ({
            color: v.optionValues?.Color || '',
            size: v.optionValues?.Size || '',
            sku: v.sku || '',
            stock: v.stock ?? 0,
            price: v.price ?? '',
            images: (v.images || []).map(url => ({ kind: 'remote', url, previewUrl: url })),
            variantId: v._id,
          }))
        );
      })
      .catch(() => toast.error('Failed to load variants'))
      .finally(() => { if (!cancel) setLoading(false); });
    return () => { cancel = true; };
  }, [isOpen, productId]);

  const addRow = () =>
    setVariants((prev) => [...prev, { color: '', size: '', sku: '', stock: 0, price: '', images: [] }]);

  const removeAt = (i) => {
    const removed = variants[i];
    if (removed?.variantId) {
      deleteVariant(removed.variantId).catch(() => {});
    }
    setVariants((prev) => prev.filter((_, idx) => idx !== i));
  };

  const updateAt = (i, patch) =>
    setVariants((prev) => prev.map((v, idx) => (idx === i ? { ...v, ...patch } : v)));

  const handleSave = async () => {
    setSaving(true);
    try {
      const fd = new FormData();
      const meta = variants.map((v) => ({
        color: v.color,
        size: v.size,
        sku: v.sku,
        stock: Number(v.stock) || 0,
        price: v.price === '' ? null : Number(v.price),
        keepImages: v.images.filter((i) => i.kind === 'remote').map((i) => i.url),
      }));
      fd.append('variantsMeta', JSON.stringify(meta));
      variants.forEach((v, i) => {
        v.images.filter((it) => it.kind === 'file').forEach((it) => {
          fd.append(`variant_${i}_images`, it.file);
        });
      });
      await updateProduct(productId, fd);
      toast.success('Variants updated!');
      onClose();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const inputCls = 'w-full px-2.5 py-1.5 rounded-lg border border-border bg-app-bg text-app-text text-xs focus:outline-none focus:border-brand-primary transition-colors';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Manage Variants — SKU & Colour">
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-brand-primary" />
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-[10px] text-muted uppercase tracking-wider font-bold">
            Add colour × size combos with SKU codes. Each variant can have its own stock and price.
          </p>

          {variants.length === 0 && (
            <div className="py-8 rounded-xl border-2 border-dashed border-border text-center space-y-2">
              <p className="text-lg">🎨</p>
              <p className="text-xs font-bold text-muted">No variants yet</p>
            </div>
          )}

          {variants.map((v, i) => {
            const swatch = COLOR_MAP[v.color];
            return (
              <div key={i} className="border border-border rounded-xl p-3 space-y-2.5 bg-app-panel/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {swatch ? (
                      <span className="w-4 h-4 rounded-full border border-border shrink-0" style={{ backgroundColor: swatch }} />
                    ) : (
                      <span className="w-4 h-4 rounded-full border border-dashed border-border shrink-0" />
                    )}
                    <span className="text-xs font-bold text-app-text">
                      {[v.color, v.size].filter(Boolean).join(' / ') || `Variant ${i + 1}`}
                    </span>
                    {v.sku && (
                      <span className="text-[9px] font-mono text-muted bg-app-bg px-1.5 py-0.5 rounded">{v.sku}</span>
                    )}
                  </div>
                  <button type="button" onClick={() => removeAt(i)} className="text-error/60 hover:text-error p-0.5 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[9px] font-black uppercase tracking-widest text-muted mb-0.5 block">Colour</label>
                    <select value={v.color} onChange={(e) => updateAt(i, { color: e.target.value })} className={inputCls}>
                      <option value="">Select</option>
                      {COLOR_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[9px] font-black uppercase tracking-widest text-muted mb-0.5 block">Size</label>
                    <select value={v.size} onChange={(e) => updateAt(i, { size: e.target.value })} className={inputCls}>
                      <option value="">Select</option>
                      {sizeGroups.map(g => (
                        <optgroup key={g.label} label={g.label}>
                          {g.sizes.map(s => <option key={s} value={s}>{s}</option>)}
                        </optgroup>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[9px] font-black uppercase tracking-widest text-muted mb-0.5 block">Stock</label>
                    <input type="number" min="0" value={v.stock} onChange={(e) => updateAt(i, { stock: e.target.value })} className={inputCls} />
                  </div>
                </div>

                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="text-[9px] font-black uppercase tracking-widest text-muted mb-0.5 block">SKU</label>
                    <input
                      type="text"
                      placeholder="BLK-M-1234"
                      value={v.sku}
                      onChange={(e) => updateAt(i, { sku: e.target.value.toUpperCase() })}
                      className={`${inputCls} font-mono uppercase`}
                    />
                  </div>
                  <button
                    type="button"
                    title="Auto-generate SKU"
                    onClick={() => updateAt(i, { sku: genSku(v.color, v.size) })}
                    className="self-end px-2.5 py-1.5 rounded-lg border border-border bg-app-bg hover:bg-brand-primary hover:text-black hover:border-brand-primary transition-all"
                  >
                    <Wand2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}

          <button
            type="button"
            onClick={addRow}
            className="w-full py-2.5 border-2 border-dashed border-border rounded-xl text-[10px] font-bold uppercase tracking-wider text-muted hover:border-brand-primary hover:text-brand-primary transition-all"
          >
            <Plus className="w-3 h-3 inline mr-1" /> Add Variant
          </button>

          <div className="flex gap-3 pt-2 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-border text-xs font-bold uppercase hover:bg-app-panel transition-all"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-brand-primary text-black text-xs font-black uppercase tracking-widest hover:opacity-90 disabled:opacity-50 transition-all"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              Save Variants
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
