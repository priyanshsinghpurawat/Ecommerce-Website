import { useState, useMemo } from 'react';
import { X, Plus, Trash2, Sparkles } from 'lucide-react';
import { COLOR_MAP, COLOR_OPTIONS, getSizeGroups } from '../../utils/constants.js';

const generateRandomSkuSuffix = () => Math.floor(1000 + Math.random() * 9000);

function cartesianProduct(arrays) {
  return arrays.reduce((acc, curr) => acc.flatMap(a => curr.map(c => [...a, c])), [[]]);
}

export default function VariantGeneratorModal({ isOpen, onClose, onGenerate, productCode = '', categoryName = '' }) {
  const [options, setOptions] = useState([
    { name: 'Color', values: [] },
    { name: 'Size', values: [] }
  ]);
  const sizeGroups = getSizeGroups(categoryName);

  const matrix = useMemo(() => {
    const validOptions = options.filter(o => o.name && o.values.length > 0);
    if (validOptions.length === 0) return [];

    const optionNames = validOptions.map(o => o.name);
    const optionValues = validOptions.map(o => o.values);
    const combinations = cartesianProduct(optionValues);

    return combinations.map(combo => {
      const optVals = {};
      optionNames.forEach((name, i) => { optVals[name] = combo[i]; });

      const suffix = Object.entries(optVals)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([, v]) => v.substring(0, 3).toUpperCase().replace(/\s+/g, ''))
        .join('-');

      const sku = `${productCode || 'PROD'}-${suffix}`.substring(0, 64);

      return { optionValues: optVals, sku, stock: 0, price: '' };
    });
  }, [options, productCode]);

  const updateOptionName = (i, name) => {
    const next = [...options];
    next[i] = { ...next[i], name };
    setOptions(next);
  };

  const updateOptionValues = (i, values) => {
    const next = [...options];
    next[i] = { ...next[i], values };
    setOptions(next);
  };

  const addOption = () => {
    setOptions([...options, { name: '', values: [] }]);
  };

  const removeOption = (i) => {
    setOptions(options.filter((_, idx) => idx !== i));
  };

  const toggleValue = (optionIndex, value) => {
    const current = options[optionIndex].values;
    const next = current.includes(value)
      ? current.filter(v => v !== value)
      : [...current, value];
    updateOptionValues(optionIndex, next);
  };

  const handleGenerate = () => {
    const variants = matrix.map(m => ({
      color: m.optionValues.Color || '',
      size: m.optionValues.Size || '',
      sku: m.sku,
      stock: m.stock,
      price: m.price === '' ? null : Number(m.price),
      images: []
    }));
    onGenerate(variants);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-app-card border border-border rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-brand-primary/10 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-brand-primary" />
            </div>
            <div>
              <h2 className="font-black uppercase tracking-wider text-sm">Variant Generator</h2>
              <p className="text-[10px] text-muted">Select option values to generate a matrix</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-app-panel transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
          {/* Options */}
          {options.map((opt, i) => (
            <div key={i} className="space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={opt.name}
                  onChange={(e) => updateOptionName(i, e.target.value)}
                  placeholder="Option name (e.g. Color)"
                  className="flex-1 px-3 py-2 rounded-xl border border-border bg-app-bg text-app-text text-xs focus:outline-none focus:border-brand-primary transition-colors"
                />
                {options.length > 1 && (
                  <button onClick={() => removeOption(i)} className="p-2 text-error/40 hover:text-error transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Quick value selectors */}
              {opt.name === 'Color' && (
                <div className="flex flex-wrap gap-1.5">
                  {COLOR_OPTIONS.map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => toggleValue(i, c)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all ${
                        opt.values.includes(c)
                          ? 'bg-brand-primary/10 border-brand-primary text-brand-primary'
                          : 'bg-app-panel border-border text-muted hover:border-app-text/40'
                      }`}
                    >
                      <span className="w-3 h-3 rounded-full border border-border" style={{ backgroundColor: COLOR_MAP[c] }} />
                      {c}
                    </button>
                  ))}
                </div>
              )}

              {opt.name === 'Size' && (
                <div className="space-y-2">
                  {sizeGroups.map(g => (
                    <div key={g.label}>
                      <p className="text-[9px] font-black uppercase tracking-widest text-muted mb-1">{g.label}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {g.sizes.map(s => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => toggleValue(i, s)}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all ${
                              opt.values.includes(s)
                                ? 'bg-brand-primary/10 border-brand-primary text-brand-primary'
                                : 'bg-app-panel border-border text-muted hover:border-app-text/40'
                            }`}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {opt.name !== 'Color' && opt.name !== 'Size' && (
                <div>
                  <input
                    type="text"
                    value={opt.values.join(', ')}
                    onChange={(e) => updateOptionValues(i, e.target.value.split(',').map(v => v.trim()).filter(Boolean))}
                    placeholder="Comma-separated values (e.g. Red, Blue, Green)"
                    className="w-full px-3 py-2 rounded-xl border border-border bg-app-bg text-app-text text-xs focus:outline-none focus:border-brand-primary transition-colors"
                  />
                </div>
              )}
            </div>
          ))}

          <button
            type="button"
            onClick={addOption}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-dashed border-border text-[10px] font-bold text-muted hover:border-brand-primary hover:text-brand-primary transition-all"
          >
            <Plus className="w-3 h-3" /> Add Option
          </button>

          {/* Preview matrix */}
          {matrix.length > 0 && (
            <div className="space-y-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted">
                Preview — {matrix.length} variant{matrix.length !== 1 ? 's' : ''} will be generated
              </p>
              <div className="max-h-40 overflow-y-auto rounded-xl border border-border divide-y divide-border">
                {matrix.map((m, i) => (
                  <div key={i} className="flex items-center gap-3 px-3 py-2 text-[10px]">
                    {Object.entries(m.optionValues).map(([k, v]) => (
                      <span key={k} className="font-bold text-app-text">{k}: {v}</span>
                    ))}
                    <span className="ml-auto font-mono text-muted">{m.sku}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-app-panel/30">
          <p className="text-[10px] text-muted">
            {matrix.length} combination{matrix.length !== 1 ? 's' : ''}
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-xl border border-border text-xs font-bold uppercase hover:bg-app-panel transition-all"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleGenerate}
              disabled={matrix.length === 0}
              className="inline-flex items-center gap-2 px-6 py-2 rounded-xl bg-brand-primary text-black text-xs font-black uppercase tracking-widest hover:opacity-90 disabled:opacity-50 transition-all"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Generate {matrix.length} Variant{matrix.length !== 1 ? 's' : ''}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
