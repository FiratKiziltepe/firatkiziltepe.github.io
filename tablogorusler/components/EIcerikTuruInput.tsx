import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, X } from 'lucide-react';

const E_ICERIK_TURLERI = [
  'Video',
  'Etkileşimli İçerik',
  'Animasyon',
  'Simülasyon',
  'Infografik',
  'E-Kitap',
  'Podcast',
  'Oyun',
  'Artırılmış Gerçeklik',
  'Sanal Gerçeklik',
  'Doküman',
  'Sunum',
  'Test/Değerlendirme',
  'Konu Anlatımı',
  'Çalışma Yaprağı',
  'Etkinlik',
];

interface EIcerikTuruInputProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

const EIcerikTuruInput: React.FC<EIcerikTuruInputProps> = ({ value, onChange, className }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Parse current value into tags
  const tags = value ? value.split('/').map(s => s.trim()).filter(Boolean) : [];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        // If there's text in input, add it as a tag
        if (inputText.trim()) {
          addTag(inputText.trim());
          setInputText('');
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [inputText, tags]);

  const addTag = (tag: string) => {
    if (!tag || tags.includes(tag)) return;
    const newTags = [...tags, tag];
    onChange(newTags.join('/'));
    setInputText('');
  };

  const removeTag = (index: number) => {
    const newTags = tags.filter((_, i) => i !== index);
    onChange(newTags.join('/'));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      if (inputText.trim()) {
        addTag(inputText.trim());
      }
    } else if (e.key === 'Backspace' && !inputText && tags.length > 0) {
      removeTag(tags.length - 1);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  // Filter suggestions based on input and already selected
  const filteredSuggestions = E_ICERIK_TURLERI.filter(t =>
    !tags.includes(t) &&
    (!inputText || t.toLowerCase().includes(inputText.toLowerCase()))
  );

  return (
    <div ref={containerRef} className={`relative ${className || ''}`}>
      {/* Tags + Input field */}
      <div
        className="w-full border-2 border-blue-300 rounded-xl bg-white flex flex-wrap gap-1 p-1.5 min-h-[38px] cursor-text items-center"
        onClick={() => { inputRef.current?.focus(); setIsOpen(true); }}
      >
        {tags.map((tag, i) => (
          <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-bold rounded-lg border border-blue-200">
            {tag}
            <button type="button" onClick={(e) => { e.stopPropagation(); removeTag(i); }} className="hover:text-red-600 transition-colors">
              <X size={10} />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          type="text"
          className="flex-1 min-w-[80px] outline-none text-xs font-bold px-1 py-0.5 bg-transparent"
          placeholder={tags.length === 0 ? 'Tür seçin veya yazın...' : 'Ekle...'}
          value={inputText}
          onChange={e => { setInputText(e.target.value); setIsOpen(true); }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
        />
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
          className="p-0.5 text-slate-400 hover:text-blue-600 transition-colors flex-shrink-0"
        >
          <ChevronDown size={14} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Dropdown */}
      {isOpen && filteredSuggestions.length > 0 && (
        <div className="absolute z-50 mt-1 w-full bg-white border-2 border-slate-200 rounded-xl shadow-2xl shadow-slate-200/60 max-h-48 overflow-y-auto">
          {filteredSuggestions.map(suggestion => (
            <button
              key={suggestion}
              type="button"
              className="w-full text-left px-3 py-2 text-xs font-bold text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-colors first:rounded-t-xl last:rounded-b-xl"
              onClick={() => { addTag(suggestion); inputRef.current?.focus(); }}
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default EIcerikTuruInput;

