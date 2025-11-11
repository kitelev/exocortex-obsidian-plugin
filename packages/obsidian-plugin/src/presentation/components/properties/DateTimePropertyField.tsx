import React, { useState, useRef, useEffect } from "react";

export interface DateTimePropertyFieldProps {
  value: string | null;
  onChange: (newValue: string | null) => void;
  onBlur?: () => void;
}

export const DateTimePropertyField: React.FC<DateTimePropertyFieldProps> = ({
  value,
  onChange,
  onBlur,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [localValue, setLocalValue] = useState(value || "");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLocalValue(value || "");
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        onBlur?.();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onBlur]);

  const formatDisplayValue = (isoString: string | null): string => {
    if (!isoString) return "Empty";

    try {
      const date = new Date(isoString);
      if (isNaN(date.getTime())) return isoString;

      const hasTime =
        isoString.includes("T") ||
        date.getHours() !== 0 ||
        date.getMinutes() !== 0;

      if (hasTime) {
        return date.toLocaleString(undefined, {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
      } else {
        return date.toLocaleDateString(undefined, {
          year: "numeric",
          month: "short",
          day: "numeric",
        });
      }
    } catch {
      return isoString;
    }
  };

  const convertToDateTimeLocalFormat = (isoString: string | null): string => {
    if (!isoString) return "";

    try {
      const date = new Date(isoString);
      if (isNaN(date.getTime())) return "";

      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const hours = String(date.getHours()).padStart(2, "0");
      const minutes = String(date.getMinutes()).padStart(2, "0");

      return `${year}-${month}-${day}T${hours}:${minutes}`;
    } catch {
      return "";
    }
  };

  const convertToISOFormat = (localDateTimeString: string): string | null => {
    if (!localDateTimeString) return null;

    try {
      const date = new Date(localDateTimeString);
      if (isNaN(date.getTime())) return null;

      return date.toISOString();
    } catch {
      return null;
    }
  };

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newLocalValue = e.target.value;
    setLocalValue(newLocalValue);

    const isoValue = convertToISOFormat(newLocalValue);
    onChange(isoValue);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setLocalValue("");
    onChange(null);
    setIsOpen(false);
    onBlur?.();
  };

  return (
    <div className="exocortex-property-datetime-container">
      <div
        ref={buttonRef}
        className="exocortex-property-datetime-display"
        onClick={handleToggle}
        style={{ cursor: "pointer", display: "flex", alignItems: "center" }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ marginRight: "6px", pointerEvents: "none" }}
        >
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
          <line x1="16" y1="2" x2="16" y2="6"></line>
          <line x1="8" y1="2" x2="8" y2="6"></line>
          <line x1="3" y1="10" x2="21" y2="10"></line>
        </svg>
        <span>{formatDisplayValue(value)}</span>
      </div>

      {isOpen && (
        <div
          ref={dropdownRef}
          className="exocortex-property-datetime-dropdown"
          style={{
            position: "absolute",
            zIndex: 1000,
            background: "var(--background-primary)",
            border: "1px solid var(--background-modifier-border)",
            borderRadius: "4px",
            padding: "12px",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
            marginTop: "4px",
          }}
        >
          <input
            type="datetime-local"
            value={convertToDateTimeLocalFormat(localValue)}
            onChange={handleDateChange}
            className="exocortex-property-datetime-input"
            style={{
              width: "100%",
              padding: "6px",
              border: "1px solid var(--background-modifier-border)",
              borderRadius: "3px",
              marginBottom: "8px",
            }}
          />
          <button
            onClick={handleClear}
            className="exocortex-property-datetime-clear"
            style={{
              width: "100%",
              padding: "6px",
              border: "1px solid var(--background-modifier-border)",
              borderRadius: "3px",
              background: "var(--background-secondary)",
              cursor: "pointer",
            }}
          >
            Clear
          </button>
        </div>
      )}
    </div>
  );
};
