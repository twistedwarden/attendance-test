import React, { useState, useEffect, useRef } from 'react';
import { Search, User } from 'lucide-react';
import { AdminService } from '../api/adminService';

interface Student {
  id: number;
  name: string;
  gradeLevel: string | null;
  section: string | null;
}

interface StudentSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onSelect: (student: Student) => void;
  placeholder?: string;
  className?: string;
}

export default function StudentSearchInput({ 
  value, 
  onChange, 
  onSelect, 
  placeholder = "Search by ID or name...",
  className = ""
}: StudentSearchInputProps) {
  const [suggestions, setSuggestions] = useState<Student[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Load all students on component mount
  useEffect(() => {
    const loadStudents = async () => {
      try {
        setLoading(true);
        const students = await AdminService.listStudents();
        setAllStudents(students.map((s: any) => ({
          id: s.id ?? s.StudentID,
          name: s.name ?? s.FullName,
          gradeLevel: s.gradeLevel ?? s.GradeLevel ?? null,
          section: s.section ?? s.Section ?? s.sectionName ?? s.SectionName ?? null
        })));
      } catch (error) {
        console.error('Failed to load students:', error);
      } finally {
        setLoading(false);
      }
    };

    loadStudents();
  }, []);

  // Filter students based on search query
  useEffect(() => {
    if (!value.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const filtered = allStudents.filter(student => {
      const searchLower = value.toLowerCase();
      const nameMatch = student.name.toLowerCase().includes(searchLower);
      const idMatch = student.id.toString().includes(searchLower);
      return nameMatch || idMatch;
    });

    setSuggestions(filtered.slice(0, 10)); // Limit to 10 suggestions
    setShowSuggestions(filtered.length > 0);
  }, [value, allStudents]);

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
  };

  // Handle suggestion selection
  const handleSuggestionClick = (student: Student) => {
    onChange(student.id.toString());
    onSelect(student);
    setShowSuggestions(false);
  };

  // Handle input focus
  const handleFocus = () => {
    if (suggestions.length > 0) {
      setShowSuggestions(true);
    }
  };

  // Handle click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current && 
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={`w-full pl-10 pr-3 py-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${className}`}
        />
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto"
        >
          {suggestions.map((student) => (
            <div
              key={student.id}
              onClick={() => handleSuggestionClick(student)}
              className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
            >
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <User className="w-4 h-4 text-gray-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-900">
                      {student.name}
                    </span>
                    <span className="text-xs text-gray-500">
                      ID: {student.id}
                    </span>
                  </div>
                  {(student.gradeLevel || student.section) && (
                    <div className="text-xs text-gray-500 mt-1">
                      {[student.gradeLevel, student.section].filter(Boolean).join(' ')}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {loading && (
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
        </div>
      )}
    </div>
  );
}
