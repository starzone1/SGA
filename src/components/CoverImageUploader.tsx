import React, { useState, useRef } from 'react';
import { 
  Upload, 
  Image as ImageIcon, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Link2, 
  FileImage,
  RefreshCw,
  Sparkles
} from 'lucide-react';

export const PRESET_COVERS = [
  { label: 'Sepak Bola / Pertandingan', url: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&q=80&w=1200' },
  { label: 'Teknologi / Satelit', url: 'https://images.unsplash.com/photo-1517976487492-5750f3195933?auto=format&fit=crop&q=80&w=1200' },
  { label: 'Bisnis / UMKM', url: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?auto=format&fit=crop&q=80&w=1200' },
  { label: 'Olahraga / Stadion', url: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&q=80&w=1200' },
  { label: 'Edukasi / Rapat', url: 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&q=80&w=1200' },
  { label: 'Gaya Hidup / Santai', url: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&q=80&w=1200' },
  { label: 'Hiburan / Cinema', url: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&q=80&w=1200' }
];

/**
 * Utility to compress image files before storing as Base64 Data URL
 */
export const compressImageFile = (file: File, maxWidth = 1200, maxHeight = 800, quality = 0.82): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error('Gagal membaca gambar.'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Gagal mengunggah berkas.'));
    reader.readAsDataURL(file);
  });
};

interface CoverImageUploaderProps {
  coverImage: string;
  customCoverUrl: string;
  onSelectPreset: (presetUrl: string) => void;
  onChangeCustomUrl: (url: string) => void;
}

export const CoverImageUploader: React.FC<CoverImageUploaderProps> = ({
  coverImage,
  customCoverUrl,
  onSelectPreset,
  onChangeCustomUrl
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadFileName, setUploadFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeImage = customCoverUrl.trim() || coverImage;
  const isUploadedImage = customCoverUrl.trim().startsWith('data:image/');

  const handleFileChange = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];

    // Validate type
    if (!file.type.startsWith('image/')) {
      setUploadError('Berkas harus berupa gambar (JPG, PNG, WEBP, GIF)');
      return;
    }

    // Validate size (max 10MB original)
    if (file.size > 10 * 1024 * 1024) {
      setUploadError('Ukuran gambar terlalu besar (Maksimal 10MB)');
      return;
    }

    try {
      setIsUploading(true);
      setUploadError(null);
      
      const compressedDataUrl = await compressImageFile(file);
      onChangeCustomUrl(compressedDataUrl);
      setUploadFileName(file.name);
    } catch (err) {
      console.error(err);
      setUploadError('Terjadi kesalahan saat memproses gambar.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      handleFileChange(e.dataTransfer.files);
    }
  };

  const handleRemoveCustomImage = () => {
    onChangeCustomUrl('');
    setUploadFileName(null);
    setUploadError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
          Foto Sampul Utama Berita <span className="text-blue-500">*</span>
        </label>
        <span className="text-[10px] text-slate-400">
          Upload foto sendiri, pakai preset, atau tautkan link
        </span>
      </div>

      {/* Main Preview Box */}
      <div className="relative aspect-[21/9] sm:aspect-[2.2/1] w-full rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-900 shadow-inner group">
        {activeImage ? (
          <img 
            src={activeImage} 
            alt="Pratinjau Foto Sampul Berita" 
            className="w-full h-full object-cover transition duration-300 group-hover:scale-105" 
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-500">
            <ImageIcon className="w-8 h-8 mb-1 opacity-50" />
            <span className="text-xs">Pilih atau Upload Gambar Sampul</span>
          </div>
        )}

        {/* Overlay Badges */}
        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
          {isUploadedImage ? (
            <span className="px-2.5 py-1 bg-emerald-600/90 backdrop-blur-md text-white text-[10px] font-bold rounded-lg shadow-sm flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              Foto Diunggah ({uploadFileName || 'Galeri Perangkat'})
            </span>
          ) : customCoverUrl.trim() ? (
            <span className="px-2.5 py-1 bg-indigo-600/90 backdrop-blur-md text-white text-[10px] font-bold rounded-lg shadow-sm flex items-center gap-1">
              <Link2 className="w-3 h-3" />
              Link URL Kustom
            </span>
          ) : (
            <span className="px-2.5 py-1 bg-black/60 backdrop-blur-md text-white text-[10px] font-bold rounded-lg shadow-sm flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-400" />
              Gambar Stok Preset
            </span>
          )}
        </div>

        {/* Remove Custom Upload Button if exists */}
        {customCoverUrl && (
          <button
            type="button"
            onClick={handleRemoveCustomImage}
            className="absolute top-2.5 right-2.5 px-2.5 py-1 bg-rose-600/90 hover:bg-rose-700 text-white text-[10px] font-bold rounded-lg backdrop-blur-md shadow-sm transition active:scale-95 flex items-center gap-1"
            title="Hapus foto terunggah / reset ke preset"
          >
            <X className="w-3 h-3" />
            Hapus / Reset
          </button>
        )}
      </div>

      {/* Upload File Dropzone & Button */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative cursor-pointer p-4 rounded-xl border-2 border-dashed text-center transition ${
          isDragging 
            ? 'border-blue-500 bg-blue-50/80 dark:bg-blue-950/40 scale-[1.01]' 
            : 'border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png, image/jpeg, image/jpg, image/webp, image/gif"
          onChange={e => handleFileChange(e.target.files)}
          className="hidden"
        />

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 shadow-xs">
            {isUploading ? (
              <RefreshCw className="w-5 h-5 animate-spin" />
            ) : (
              <Upload className="w-5 h-5" />
            )}
          </div>

          <div className="text-center sm:text-left space-y-0.5">
            <p className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center justify-center sm:justify-start gap-1">
              <span>{isUploading ? 'Mengompres & Memproses Gambar...' : 'Klik untuk Unggah Foto dari Perangkat (HP / Komputer)'}</span>
            </p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">
              Dukungan format: PNG, JPG, JPEG, WEBP atau GIF. (Drag & drop berkas ke sini)
            </p>
          </div>
        </div>
      </div>

      {uploadError && (
        <div className="flex items-center gap-1.5 p-2.5 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 rounded-xl text-xs text-rose-600 dark:text-rose-400 font-medium">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{uploadError}</span>
        </div>
      )}

      {/* Preset Stock Photos Grid */}
      <div className="space-y-1.5">
        <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider block">
          Atau Pilih Foto Stok Berita Preset:
        </label>
        <div className="grid grid-cols-3 sm:grid-cols-7 gap-1.5">
          {PRESET_COVERS.map((preset, idx) => {
            const isSelected = coverImage === preset.url && !customCoverUrl;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  onSelectPreset(preset.url);
                  onChangeCustomUrl('');
                  setUploadFileName(null);
                }}
                title={preset.label}
                className={`relative rounded-xl overflow-hidden aspect-video border-2 transition ${
                  isSelected 
                    ? 'border-blue-600 ring-2 ring-blue-500/50 scale-105 z-10' 
                    : 'border-transparent opacity-75 hover:opacity-100 hover:scale-102'
                }`}
              >
                <img src={preset.url} alt={preset.label} className="w-full h-full object-cover" />
                <span className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[8px] font-bold py-0.5 px-1 truncate text-center">
                  {preset.label.split('/')[0]}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Custom URL Fallback Input */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 dark:text-slate-400">
          <span>Atau tempelkan Link URL Gambar dari Internet:</span>
        </div>
        <div className="flex items-center bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs">
          <Link2 className="w-3.5 h-3.5 text-slate-400 mr-2 shrink-0" />
          <input
            type="url"
            placeholder="https://images.unsplash.com/photo-..."
            value={isUploadedImage ? '' : customCoverUrl}
            onChange={e => {
              onChangeCustomUrl(e.target.value);
              setUploadFileName(null);
            }}
            className="w-full bg-transparent text-xs text-slate-900 dark:text-white focus:outline-none placeholder:text-slate-400"
          />
        </div>
      </div>
    </div>
  );
};
