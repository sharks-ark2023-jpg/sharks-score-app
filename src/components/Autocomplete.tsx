'use client';

import { useState, useRef, useEffect } from 'react';

interface AutocompleteProps {
    value: string;
    onChange: (value: string) => void;
    options: { name: string }[];
    placeholder?: string;
    label?: string;
    required?: boolean;
}

export default function Autocomplete({ value, onChange, options, placeholder, label, required }: AutocompleteProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [filteredOptions, setFilteredOptions] = useState<{ name: string }[]>([]);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (value.length > 0) {
            const filtered = options.filter(opt =>
                opt.name.toLowerCase().includes(value.toLowerCase())
            );
            setFilteredOptions(filtered);
            setIsOpen(true);
        } else {
            setFilteredOptions([]);
            setIsOpen(false);
        }
    }, [value, options]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={containerRef}>
            {label && <span className="text-sm font-medium text-gray-700">{label}</span>}
            <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                required={required}
                className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-gray-50 p-2"
                onFocus={() => value.length > 0 && setIsOpen(true)}
            />
            {isOpen && filteredOptions.length > 0 && (
                <ul className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                    {filteredOptions.map((option, index) => (
                        <li
                            key={index}
                            className="relative cursor-pointer select-none py-2 px-4 text-gray-900 hover:bg-blue-50 hover:text-blue-900"
                            onClick={() => {
                                onChange(option.name);
                                setIsOpen(false);
                            }}
                        >
                            {option.name}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
