import type { Priority } from '../types';

interface PriorityDropdownProps {
  value: Priority;
  onChange: (priority: Priority) => void;
}

/** 중요도(아이젠하워 매트릭스) 선택 드롭다운 */
export default function PriorityDropdown({ value, onChange }: PriorityDropdownProps) {
  const options: { value: Priority; label: string }[] = [
    { value: 'urgent_important', label: '🔴 중요+긴급' },
    { value: 'not_urgent_important', label: '🟢 중요+비긴급' },
    { value: 'urgent_not_important', label: '🔵 비중요+긴급' },
    { value: 'not_urgent_not_important', label: '⚪ 비중요+비긴급' },
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
