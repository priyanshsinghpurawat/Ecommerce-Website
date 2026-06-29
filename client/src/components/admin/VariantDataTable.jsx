import { useState, useMemo, Fragment } from 'react';
import { Trash2, Wand2, ChevronDown, ChevronUp } from 'lucide-react';
import { COLOR_MAP, COLOR_OPTIONS, getSizeGroups } from '../../utils/constants.js';
import ImageDropzone from './ImageDropzone.jsx';

const generateRandomSkuSuffix = () => Math.floor(1000 + Math.random() * 9000);

export default function VariantDataTable({ value = [], onChange, categoryName = '', onDelete }) {
  const [expanded, setExpanded] = useState({});
  const [sortBy, setSortBy] = useState(null);
  const [sortDir, setSortDir] = useState('asc');
  const sizeGroups = getSizeGroups(categoryName);

  const sortedVariants = useMemo(() => {
    if (!sortBy) return value;
    return [...value].sort((a, b) => {
      const aVal = a[sortBy] || '';
      const bVal = b[sortBy] || '';
      const cmp = String(aVal).localeCompare(String(bVal));
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [value, sortBy, sortDir]);

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDir('asc');
    }
  };

  const updateAt = (originalIndex, patch) => {
    const next = [...value];
    next[originalIndex] = { ...next[originalIndex], ...patch };
    onChange(next);
  };

  const removeAt = (originalIndex) => {
    const removed = value[originalIndex];
    if (removed?.variantId && onDelete) onDelete(removed.variantId);
    onChange(value.filter((_, idx) => idx !== originalIndex));
  };

  const autoSku = (v, originalIndex) => {
    const colorCode = v.color ? v.color.substring(0, 3).toUpperCase() : 'CLR';
    const sizeCode = v.size ? v.size.replace(/\s+/g, '').toUpperCase() : 'SZ';
    const rand = generateRandomSkuSuffix();
    updateAt(originalIndex, { sku: `${colorCode}-${sizeCode}-${rand}` });
  };

  const addRow = () => {
    onChange([...value, { color: '', size: '', sku: '', stock: 0, price: '', images: [] }]);
  };

  const addBulk = (colors, sizes) => {
    const existing = new Set(value.map(v => `${v.color}|${v.size}`));
    const newVariants = [];
    for (const color of colors) {
      for (const size of sizes) {
        const key = `${color}|${size}`;
        if (!existing.has(key)) {
          const colorCode = color.substring(0, 3).toUpperCase();
          const sizeCode = size.replace(/\s+/g, '').toUpperCase();
          newVariants.push({
            color,
            size,
            sku: `${colorCode}-${sizeCode}-${generateRandomSkuSuffix()}`,
            stock: 0,
            price: '',
            images: []
          });
        }
      }
    }
    if (newVariants.length > 0) {
      onChange([...value, ...newVariants]);
    }
  };

  const toggleExpand = (i) => {
    setExpanded(prev => ({ ...prev, [i]: !prev[i] }));
  };

  const totalStock = value.reduce((sum, v) => sum + (Number(v.stock) || 0), 0);

  const inputCls = 'w-full px-2.5 py-1.5 rounded-lg border border-border bg-app-bg text-app-text text-xs focus:outline-none focus:border-brand-primary transition-colors';
  const thCls = 'text-[9px] font-black uppercase tracking-widest text-muted text-left py-2 px-2 cursor-pointer hover:text-brand-primary transition-colors select-none';
  const tdCls = 'py-1.5 px-2 align-middle';

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-black uppercase tracking-wider text-sm">Variants</h3>
          <p className="text-[11px] text-muted mt-0.5">
            {value.length} variant{value.length !== 1 ? 's' : ''} · {totalStock} total stock
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={addRow}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-primary text-black text-[10px] font-black uppercase tracking-wider hover:opacity-90 transition-all"
          >
            + Add Row
          </button>
        </div>
      </div>

      {/* Empty state */}
      {value.length === 0 && (
        <div className="py-10 rounded-2xl border-2 border-dashed border-border text-center space-y-2">
          <p className="text-2xl">🎨</p>
          <p className="text-xs font-bold text-muted uppercase tracking-wider">No variants yet</p>
          <p className="text-[10px] text-muted/60">Add variants or use the generator to create combinations.</p>
        </div>
      )}

      {/* Table */}
      {value.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-xs">
            <thead className="bg-app-panel border-b border-border">
              <tr>
                <th className="w-8"></th>
                <th className={thCls} onClick={() => handleSort('color')}>
                  Color {sortBy === 'color' && (sortDir === 'asc' ? <ChevronUp className="w-3 h-3 inline" /> : <ChevronDown className="w-3 h-3 inline" />)}
                </th>
                <th className={thCls} onClick={() => handleSort('size')}>
                  Size {sortBy === 'size' && (sortDir === 'asc' ? <ChevronUp className="w-3 h-3 inline" /> : <ChevronDown className="w-3 h-3 inline" />)}
                </th>
                <th className={thCls} onClick={() => handleSort('sku')}>
                  SKU {sortBy === 'sku' && (sortDir === 'asc' ? <ChevronUp className="w-3 h-3 inline" /> : <ChevronDown className="w-3 h-3 inline" />)}
                </th>
                <th className={`${thCls} text-right`} onClick={() => handleSort('stock')}>
                  Stock {sortBy === 'stock' && (sortDir === 'asc' ? <ChevronUp className="w-3 h-3 inline" /> : <ChevronDown className="w-3 h-3 inline" />)}
                </th>
                <th className={`${thCls} text-right`} onClick={() => handleSort('price')}>
                  Price {sortBy === 'price' && (sortDir === 'asc' ? <ChevronUp className="w-3 h-3 inline" /> : <ChevronDown className="w-3 h-3 inline" />)}
                </th>
                <th className="w-16"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {sortedVariants.map((v, displayIdx) => {
                // Find original index for updates
                const originalIndex = value.findIndex(val =>
                  val.color === v.color && val.size === v.size && val.sku === v.sku
                );
                const idx = originalIndex >= 0 ? originalIndex : displayIdx;
                const swatchColor = COLOR_MAP[v.color];
                const isExpanded = expanded[idx];

                return (
                  <Fragment key={`${v.color}-${v.size}-${v.sku}-${displayIdx}`}>
                  <tr className="group hover:bg-app-panel/30 transition-colors">
                    <td className={tdCls}>
                      <button type="button" onClick={() => toggleExpand(idx)} className="text-muted hover:text-app-text transition-colors">
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>
                    </td>
                    <td className={tdCls}>
                      <div className="flex items-center gap-1.5">
                        {swatchColor ? (
                          <span className="w-4 h-4 rounded-full border border-border shrink-0" style={{ backgroundColor: swatchColor }} />
                        ) : (
                          <span className="w-4 h-4 rounded-full border border-dashed border-border shrink-0" />
                        )}
                        <select
                          value={v.color}
                          onChange={(e) => updateAt(idx, { color: e.target.value })}
                          className={`${inputCls} min-w-[100px]`}
                        >
                          <option value="">Select</option>
                          {COLOR_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                    </td>
                    <td className={tdCls}>
                      <select
                        value={v.size}
                        onChange={(e) => updateAt(idx, { size: e.target.value })}
                        className={`${inputCls} min-w-[90px]`}
                      >
                        <option value="">Select</option>
                        {sizeGroups.map(g => (
                          <optgroup key={g.label} label={g.label}>
                            {g.sizes.map(s => <option key={s} value={s}>{s}</option>)}
                          </optgroup>
                        ))}
                      </select>
                    </td>
                    <td className={tdCls}>
                      <div className="flex gap-1">
                        <input
                          type="text"
                          value={v.sku}
                          onChange={(e) => updateAt(idx, { sku: e.target.value })}
                          placeholder="SKU"
                          className={`${inputCls} font-mono uppercase flex-1 min-w-[100px]`}
                        />
                        <button
                          type="button"
                          title="Auto-generate SKU"
                          onClick={() => autoSku(v, idx)}
                          className="px-1.5 border border-border rounded-lg bg-app-bg hover:bg-brand-primary hover:text-black hover:border-brand-primary transition-all shrink-0"
                        >
                          <Wand2 className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                    <td className={`${tdCls} text-right`}>
                      <input
                        type="number"
                        min="0"
                        value={v.stock}
                        onChange={(e) => updateAt(idx, { stock: e.target.value })}
                        className={`${inputCls} w-20 text-right`}
                      />
                    </td>
                    <td className={`${tdCls} text-right`}>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={v.price}
                        onChange={(e) => updateAt(idx, { price: e.target.value })}
                        placeholder="—"
                        className={`${inputCls} w-24 text-right`}
                      />
                    </td>
                    <td className={tdCls}>
                      <button
                        type="button"
                        onClick={() => removeAt(idx)}
                        className="text-error/40 hover:text-error p-1 transition-colors"
                        title="Remove variant"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr>
                      <td colSpan={7} className="px-4 py-3 bg-app-panel/20">
                        <p className="text-[9px] font-black uppercase tracking-widest text-muted mb-2">Variant Images</p>
                        <ImageDropzone
                          value={v.images || []}
                          onChange={(imgs) => updateAt(idx, { images: imgs })}
                          maxFiles={8}
                        />
                      </td>
                    </tr>
                  )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {value.length > 0 && (
        <button
          type="button"
          onClick={addRow}
          className="w-full py-2.5 border-2 border-dashed border-border rounded-xl text-[10px] font-bold uppercase tracking-wider text-muted hover:border-brand-primary hover:text-brand-primary transition-all"
        >
          + Add Another Variant
        </button>
      )}
    </div>
  );
}
