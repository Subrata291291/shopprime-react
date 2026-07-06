import { memo, type ReactNode } from 'react';

interface Chip {
  label: string;
  type?: string;
  onRemove: () => void;
}

interface FilterChipsProps {
  chips: Chip[];
  children?: ReactNode;
}

const FilterChips = memo(function FilterChips({ chips, children }: FilterChipsProps) {
  if (chips.length === 0) return null;
  return (
    <div className="active-filter-chips">
      {chips.map((chip) => (
        <span key={chip.label} className={`filter-chip ${chip.type ? 'filter-chip-' + chip.type : ''}`}>
          {chip.label}
          <button onClick={chip.onRemove} aria-label={`Remove ${chip.label} filter`}>
            ×
          </button>
        </span>
      ))}
      {children}
    </div>
  );
});

export default FilterChips;
