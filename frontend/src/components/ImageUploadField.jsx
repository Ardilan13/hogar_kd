import { useEffect, useState } from 'react';
import { ImagePlus, X } from 'lucide-react';

export default function ImageUploadField({ label = 'Imagen (opcional)', value, onChange, onRemove }) {
  const [preview, setPreview] = useState(value || '');
  const [isRemoving, setIsRemoving] = useState(false);

  useEffect(() => {
    setPreview(value || '');
    setIsRemoving(false);
  }, [value]);

  function handleChange(e) {
    const file = e.target.files?.[0] || null;
    if (!file) {
      setPreview(value || '');
      onChange?.(null);
      return;
    }
    setPreview(URL.createObjectURL(file));
    onChange?.(file);
    setIsRemoving(false);
  }

  function clearImage() {
    setPreview('');
    setIsRemoving(true);
    onChange?.(null);
    onRemove?.();
  }

  return (
    <div>
      <label className="label">{label}</label>
      <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-line bg-white px-3 py-3 text-sm text-ink/60 transition-colors hover:border-berry hover:bg-blush">
        <ImagePlus size={16} />
        {preview ? 'Cambiar imagen' : 'Subir imagen'}
        <input type="file" accept="image/*" className="sr-only" onChange={handleChange} />
      </label>
      {(preview || isRemoving) && (
        <div className="mt-3 rounded-xl border border-line bg-white p-2">
          {preview && <img src={preview} alt="Vista previa" className="h-28 w-full rounded-lg object-cover" />}
          {!isRemoving && (
            <button type="button" onClick={clearImage} className="mt-2 inline-flex items-center gap-1 text-xs text-ink/60 hover:text-berry">
              <X size={12} /> Quitar
            </button>
          )}
        </div>
      )}
    </div>
  );
}
