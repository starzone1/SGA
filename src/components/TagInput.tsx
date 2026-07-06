import React, { useState, KeyboardEvent } from 'react';
import { Tag, X, Plus, Sparkles, Check } from 'lucide-react';

interface TagInputProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  suggestedTags?: string[];
}

const DEFAULT_SUGGESTIONS = [
  'Riset',
  'Beasiswa',
  'Indonesia2026',
  'Teknologi',
  'Sepak Bola',
  'Pendidikan',
  'Bisnis',
  'Sains',
  'Gaya Hidup',
  'Nasional',
  'Politik',
  'Kesehatan',
  'Kecerdasan Buatan'
];

export const TagInput: React.FC<TagInputProps> = ({
  value,
  onChange,
  label = 'Kata Kunci / Tag Artikel',
  placeholder = 'Ketik tag baru lalu tekan Enter atau koma (,)...',
  suggestedTags = DEFAULT_SUGGESTIONS
}) => {
  const [inputValue, setInputValue] = useState('');

  // Parse comma-separated string value into string array
  const tags = value
    ? value
        .split(',')
        .map(t => t.trim())
        .filter(Boolean)
    : [];

  const updateTags = (newTags: string[]) => {
    // Remove duplicates keeping order
    const uniqueTags = Array.from(new Set(newTags));
    onChange(uniqueTags.join(', '));
  };

  const addTag = (rawTag: string) => {
    const trimmed = rawTag.trim().replace(/^#/, ''); // Strip leading hash if typed
    if (!trimmed) return;
    if (!tags.some(t => t.toLowerCase() === trimmed.toLowerCase())) {
      updateTags([...tags, trimmed]);
    }
    setInputValue('');
  };

  const removeTag = (indexToRemove: number) => {
    updateTags(tags.filter((_, idx) => idx !== indexToRemove));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(inputValue);
    } else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
      removeTag(tags.length - 1);
    }
  };

  const handleAddSuggestedTag = (suggested: string) => {
    addTag(suggested);
  };

  return (
    <div className="space-y-2">
      {/* Label and Counter */}
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
          <Tag className="w-3.5 h-3.5 text-blue-500" />
          {label}
        </label>
        <div className="flex items-center gap-2">
          {tags.length > 0 && (
            <button
              type="button"
              onClick={() => onChange('')}
              className="text-[10px] text-slate-400 hover:text-rose-500 transition font-medium"
            >
              Hapus Semua
            </button>
          )}
          <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 text-[10px] font-mono font-bold rounded-full border border-blue-200 dark:border-blue-800">
            {tags.length} Tag
          </span>
        </div>
      </div>

      {/* Main Tag Input Container */}
      <div className="p-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700/80 rounded-xl focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent transition space-y-2">
        {/* Active Tag Chips Grid */}
        <div className="flex flex-wrap items-center gap-1.5 min-h-[32px]">
          {tags.map((tag, idx) => (
            <span
              key={idx}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-600 dark:bg-blue-600 text-white text-xs font-bold rounded-lg shadow-xs group animate-in fade-in zoom-in-95 duration-150"
            >
              <span className="opacity-75">#</span>
              <span>{tag}</span>
              <button
                type="button"
                onClick={() => removeTag(idx)}
                className="ml-0.5 p-0.5 rounded-md hover:bg-blue-700 dark:hover:bg-blue-800 text-blue-200 hover:text-white transition"
                title={`Hapus tag #${tag}`}
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}

          {/* Text Input Field */}
          <div className="flex-1 min-w-[140px] flex items-center gap-1">
            <input
              type="text"
              value={inputValue}
              onChange={e => {
                const val = e.target.value;
                if (val.endsWith(',')) {
                  addTag(val.slice(0, -1));
                } else {
                  setInputValue(val);
                }
              }}
              onKeyDown={handleKeyDown}
              onBlur={() => {
                if (inputValue.trim()) {
                  addTag(inputValue);
                }
              }}
              placeholder={tags.length === 0 ? placeholder : 'Tambah tag lain...'}
              className="w-full bg-transparent text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none placeholder:text-slate-400 py-1"
            />
            {inputValue.trim() && (
              <button
                type="button"
                onClick={() => addTag(inputValue)}
                className="px-2 py-1 bg-blue-600 text-white text-[10px] font-bold rounded-md hover:bg-blue-700 transition flex items-center gap-1 shrink-0"
              >
                <Plus className="w-3 h-3" />
                Tambah
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Suggested Tags Quick Selection */}
      <div className="space-y-1 pt-1">
        <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          <Sparkles className="w-3 h-3 text-amber-500" />
          <span>Rekomendasi Tag Populer:</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {suggestedTags.map((sug, idx) => {
            const isAdded = tags.some(t => t.toLowerCase() === sug.toLowerCase());
            return (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  if (isAdded) {
                    const tagIdx = tags.findIndex(t => t.toLowerCase() === sug.toLowerCase());
                    if (tagIdx !== -1) removeTag(tagIdx);
                  } else {
                    handleAddSuggestedTag(sug);
                  }
                }}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium transition ${
                  isAdded
                    ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                    : 'bg-slate-100 dark:bg-slate-800/80 hover:bg-blue-50 dark:hover:bg-blue-950/50 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 border border-slate-200 dark:border-slate-700/80'
                }`}
              >
                {isAdded ? (
                  <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <Plus className="w-3 h-3 text-slate-400 group-hover:text-blue-500" />
                )}
                <span>#{sug}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
