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
  const [textInput, setTextInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const clearClickedRef = useRef(false);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
      if (value) {
        const formatted = formatForInput(value);
        setTextInput(formatted);
      } else {
        setTextInput("");
      }
      setError(null);
    }
  }, [isOpen, value]);

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
          hour12: false,
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

  const formatForInput = (isoString: string): string => {
    try {
      const date = new Date(isoString);
      if (isNaN(date.getTime())) return isoString;

      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const hours = String(date.getHours()).padStart(2, "0");
      const minutes = String(date.getMinutes()).padStart(2, "0");

      if (date.getHours() !== 0 || date.getMinutes() !== 0) {
        return `${year}-${month}-${day} ${hours}:${minutes}`;
      } else {
        return `${year}-${month}-${day}`;
      }
    } catch {
      return isoString;
    }
  };

  const parseDate = (input: string): Date | null => {
    if (!input.trim()) return null;

    const lowerInput = input.toLowerCase().trim();

    if (lowerInput === "today") {
      const date = new Date();
      date.setHours(0, 0, 0, 0);
      return date;
    }

    if (lowerInput === "tomorrow") {
      const date = new Date();
      date.setDate(date.getDate() + 1);
      date.setHours(0, 0, 0, 0);
      return date;
    }

    if (lowerInput === "yesterday") {
      const date = new Date();
      date.setDate(date.getDate() - 1);
      date.setHours(0, 0, 0, 0);
      return date;
    }

    if (lowerInput === "next week") {
      const date = new Date();
      date.setDate(date.getDate() + 7);
      date.setHours(0, 0, 0, 0);
      return date;
    }

    const inDaysMatch = lowerInput.match(/^in (\d+) days?$/i);
    if (inDaysMatch) {
      const days = parseInt(inDaysMatch[1]);
      const date = new Date();
      date.setDate(date.getDate() + days);
      date.setHours(0, 0, 0, 0);
      return date;
    }

    const inWeeksMatch = lowerInput.match(/^in (\d+) weeks?$/i);
    if (inWeeksMatch) {
      const weeks = parseInt(inWeeksMatch[1]);
      const date = new Date();
      date.setDate(date.getDate() + weeks * 7);
      date.setHours(0, 0, 0, 0);
      return date;
    }

    try {
      const date = new Date(input);
      if (!isNaN(date.getTime())) {
        return date;
      }
    } catch {
      // Fall through
    }

    return null;
  };

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOpen((prev) => !prev);
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    setTextInput(input);
    setError(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === "Escape") {
      e.preventDefault();
      setIsOpen(false);
      setError(null);
      onBlur?.();
    }
  };

  const handleSubmit = () => {
    if (!textInput.trim()) {
      onChange(null);
      setIsOpen(false);
      onBlur?.();
      return;
    }

    const parsed = parseDate(textInput);

    if (parsed) {
      onChange(parsed.toISOString());
      setIsOpen(false);
      setError(null);
      onBlur?.();
    } else {
      setError("Invalid date format. Try: YYYY-MM-DD, tomorrow, next week");
    }
  };

  const handleBlur = () => {
    // Skip submission if Clear button was clicked
    if (clearClickedRef.current) {
      clearClickedRef.current = false;
      return;
    }
    handleSubmit();
  };

  const handleClear = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    clearClickedRef.current = true;
    onChange(null);
    setIsOpen(false);
    onBlur?.();
  };

  return (
    <div className="exocortex-property-datetime-container">
      <div
        ref={buttonRef}
        className="exocortex-property-datetime-display clickable-icon"
        onMouseDown={handleToggle}
        style={{
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          padding: "2px 6px",
          borderRadius: "3px",
        }}
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
            borderRadius: "var(--radius-m)",
            padding: "var(--size-4-3)",
            boxShadow: "var(--shadow-s)",
            marginTop: "4px",
            minWidth: "250px",
          }}
        >
          <input
            ref={inputRef}
            type="text"
            value={textInput}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            placeholder="tomorrow, 2025-01-15, next week"
            className="exocortex-property-datetime-input"
            style={{
              width: "100%",
              padding: "var(--size-4-2)",
              border: error
                ? "1px solid var(--text-error)"
                : "1px solid var(--background-modifier-border)",
              borderRadius: "var(--radius-s)",
              marginBottom: "var(--size-4-2)",
              backgroundColor: "var(--background-primary)",
              color: "var(--text-normal)",
            }}
          />

          {error && (
            <div
              style={{
                color: "var(--text-error)",
                fontSize: "var(--font-smallest)",
                marginBottom: "var(--size-4-2)",
              }}
            >
              {error}
            </div>
          )}

          <div
            style={{
              fontSize: "var(--font-smallest)",
              color: "var(--text-muted)",
              marginBottom: "var(--size-4-2)",
            }}
          >
            Examples: tomorrow, 2025-01-15, next week, in 3 days
          </div>

          <div style={{ display: "flex", gap: "var(--size-4-2)" }}>
            <button
              onMouseDown={handleClear}
              className="exocortex-property-datetime-clear mod-warning"
              style={{
                flex: 1,
                padding: "var(--size-4-2)",
                border: "1px solid var(--background-modifier-border)",
                borderRadius: "var(--radius-s)",
                backgroundColor: "var(--background-secondary)",
                color: "var(--text-normal)",
                cursor: "pointer",
              }}
            >
              Clear
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
