import type { Priority } from '../types';

interface PriorityDropdownProps {
  value: Priority;
  onChange: (priority: Priority) => void;
}

/** 중요도(high/medium/low) 선택 드롭다운 */
export default function PriorityDropdown({ value, onChange }: PriorityDropdownProps) {
  const options: { value: Priority; label: string }[] = [
    { value: 'high', label: '높음' },
    { value: 'medium', label: '보통' },
    { value: 'low', label: '낮음' },
  ];

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as Priority)}
      className="px-2 py-1 text-xs border border-gray-300 rounded bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
      aria-label="중요도 선택"
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
