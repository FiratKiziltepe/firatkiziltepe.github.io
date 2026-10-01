import React, { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';

interface LessonMultiSelectProps {
  lessons: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
}

const LessonMultiSelect: React.FC<LessonMultiSelectProps> = ({ lessons, selected, onChange }) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', closeOnOutsideClick);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('mousedown', closeOnOutsideClick);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [open]);

  const toggle = (lesson: string) => {
    onChange(selected.includes(lesson) ? selected.filter(value => value !== lesson) : [...selected, lesson]);
  };

  const summary = selected.length === 0
    ? 'Tüm Dersler'
    : selected.length === 1
      ? selected[0]
      : `${selected.length} ders seçildi`;

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => setOpen(value => !value)}
        className="w-full border-2 border-slate-100 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none font-medium bg-white flex items-center justify-between gap-2 text-left"
      >
        <span className="truncate">{summary}</span>
        <ChevronDown size={16} className="shrink-0 text-slate-400" />
      </button>
      {open && (
        <div role="listbox" aria-multiselectable="true" className="absolute top-full left-0 right-0 z-40 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-72 overflow-y-auto p-1">
          <button type="button" onClick={() => onChange([])} className="w-full text-left px-3 py-2 text-xs font-bold text-blue-700 hover:bg-blue-50 rounded-lg">
            Tüm Dersler {selected.length === 0 && <Check size={13} className="inline ml-1" />}
          </button>
          {lessons.map(lesson => (
            <button
              key={lesson}
              type="button"
              role="option"
              aria-selected={selected.includes(lesson)}
              onClick={() => toggle(lesson)}
              className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 rounded-lg flex items-center gap-2"
            >
              <span className={`w-4 h-4 shrink-0 rounded border flex items-center justify-center ${selected.includes(lesson) ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300'}`}>
                {selected.includes(lesson) && <Check size={11} />}
              </span>
              <span>{lesson}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default LessonMultiSelect;
