import { useEffect, useState } from 'react';
import { ImagePlus, X } from 'lucide-react';

export default function ImageUploadField({ label = 'Imagen (opcional)', value, onChange }) {
  const [preview, setPreview] = useState(value || '');

  useEffect(() => {
    setPreview(value || '');
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
  }

  function clearImage() {
    setPreview('');
    onChange?.(null);
  }

  return (
    <div>
      <label className="label">{label}</label>
      <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-line bg-white px-3 py-3 text-sm text-ink/60 transition-colors hover:border-berry hover:bg-blush">
        <ImagePlus size={16} />
        {preview ? 'Cambiar imagen' : 'Subir imagen'}
        <input type="file" accept="image/*" className="sr-only" onChange={handleChange} />
      </label>
      {preview && (
        <div className="mt-3 rounded-xl border border-line bg-white p-2">
          <img src={preview} alt="Vista previa" className="h-28 w-full rounded-lg object-cover" />
          <button type="button" onClick={clearImage} className="mt-2 inline-flex items-center gap-1 text-xs text-ink/60 hover:text-berry">
            <X size={12} /> Quitar
          </button>
        </div>
      )}
    </div>
  );
}
