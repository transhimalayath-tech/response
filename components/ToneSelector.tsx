import React from 'react';
import { Tone } from '../types';
import { MessageCircle, Briefcase, Zap, Heart } from 'lucide-react';

interface ToneSelectorProps {
  selectedTone: Tone;
  onSelect: (tone: Tone) => void;
}

export const ToneSelector: React.FC<ToneSelectorProps> = ({ selectedTone, onSelect }) => {
  const tones = [
    { value: Tone.PROFESSIONAL, icon: Briefcase, label: 'Professional' },
    { value: Tone.CASUAL, icon: MessageCircle, label: 'Casual' },
    { value: Tone.SALES, icon: Zap, label: 'Sales' },
    { value: Tone.EMPATHETIC, icon: Heart, label: 'Empathetic' },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 mb-6">
      {tones.map((t) => {
        const Icon = t.icon;
        const isSelected = selectedTone === t.value;
        return (
          <button
            key={t.value}
            onClick={() => onSelect(t.value)}
            className={`flex items-center justify-center p-3 rounded-lg border transition-all duration-200 ${
              isSelected
                ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300 hover:bg-slate-50'
            }`}
          >
            <Icon size={18} className="mr-2" />
            <span className="text-sm font-medium">{t.label}</span>
          </button>
        );
      })}
    </div>
  );
};
