import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { X, UploadCloud, GripVertical } from 'lucide-react';
import { makeImageItem, validateImage } from '../../utils/helpers.js';

/**
 * Reusable image dropzone with thumbnail strip, reorder (drag), and remove.
 * `value` is an array of items: { id, previewUrl, kind, file? | url? }.
 * `onChange(items)` is called on any mutation.
 */
export default function ImageDropzone({
  value = [],
  onChange,
  label = 'Drop images here or click to browse',
  maxFiles = 10,
  hint = 'JPG, PNG, WEBP or AVIF · 5MB each'
}) {
  const onDrop = useCallback(
    (accepted) => {
      const incoming = [];
      const errors = [];
      for (const f of accepted) {
        const err = validateImage(f);
        if (err) errors.push(`${f.name}: ${err}`);
        else incoming.push(makeImageItem(f));
      }
      const merged = [...value, ...incoming].slice(0, maxFiles);
      onChange(merged);
      if (errors.length) {
        // Soft toast via window event so we don't pull in toast dep here
        window.dispatchEvent(new CustomEvent('app:toast', { detail: { type: 'error', message: errors.join('\n') } }));
      }
    },
    [value, onChange, maxFiles]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/jpeg': [], 'image/png': [], 'image/webp': [], 'image/avif': [] },
    maxFiles,
    multiple: maxFiles > 1
  });

  const remove = (id) => onChange(value.filter((x) => x.id !== id));

  const moveItem = (from, to) => {
    if (to < 0 || to >= value.length) return;
    const next = [...value];
    const [m] = next.splice(from, 1);
    next.splice(to, 0, m);
    onChange(next);
  };

  return (
    <div className="space-y-3">
      <div
        {...getRootProps()}
        className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-xl p-6 cursor-pointer transition-colors ${
          isDragActive ? 'border-brand-primary bg-brand-primary/5' : 'border-border hover:border-brand-primary/60 hover:bg-surface-100/30'
        }`}
      >
        <input {...getInputProps()} />
        <UploadCloud className="w-8 h-8 text-muted" />
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted">{hint}</p>
      </div>

      {value.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
          {value.map((item, i) => (
            <div
              key={item.id}
              className="relative group aspect-[4/5] rounded-lg overflow-hidden border border-border bg-app-panel shadow-sm"
              draggable
              onDragStart={(e) => e.dataTransfer.setData('text/plain', String(i))}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                const from = Number(e.dataTransfer.getData('text/plain'));
                moveItem(from, i);
              }}
            >
              <img src={item.previewUrl} alt="" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => remove(item.id)}
                aria-label="Remove image"
                className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3.5 h-3.5" />
              </button>
              <div className="absolute bottom-1 left-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded flex items-center gap-1">
                <GripVertical className="w-3 h-3" />
                {i === 0 ? 'Cover' : `#${i + 1}`}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
