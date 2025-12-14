import React from 'react';
import { Nationality } from '../types';

interface NationalitySelectorProps {
  selected: Nationality;
  onSelect: (nationality: Nationality) => void;
}

export const NationalitySelector: React.FC<NationalitySelectorProps> = ({ selected, onSelect }) => {
  const options = [
    { value: Nationality.AMERICAN, label: '🇺🇸 American', id: 'us' },
    { value: Nationality.BRITISH, label: '🇬🇧 British', id: 'uk' },
    { value: Nationality.AUSTRALIAN, label: '🇦🇺 Australian', id: 'au' },
  ];

  return (
    <div className="bg-slate-100 p-1 rounded-lg flex space-x-1 mb-6">
      {options.map((option) => {
        const isSelected = selected === option.value;
        return (
          <button
            key={option.value}
            onClick={() => onSelect(option.value)}
            className={`flex-1 flex items-center justify-center py-2 px-3 text-sm font-medium rounded-md transition-all duration-200 ${
              isSelected
                ? 'bg-white text-blue-700 shadow-sm ring-1 ring-black/5'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
};
