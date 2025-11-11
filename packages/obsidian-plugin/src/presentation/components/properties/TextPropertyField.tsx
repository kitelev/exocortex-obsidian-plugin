import React, { useState, useEffect, useRef } from "react";

export interface TextPropertyFieldProps {
  value: string;
  onChange: (newValue: string) => void;
  onBlur?: () => void;
}

export const TextPropertyField: React.FC<TextPropertyFieldProps> = ({
  value,
  onChange,
  onBlur,
}) => {
  const [localValue, setLocalValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);
  const cancelledRef = useRef(false);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalValue(e.target.value);
  };

  const handleBlur = () => {
    if (cancelledRef.current) {
      cancelledRef.current = false;
      onBlur?.();
      return;
    }

    if (localValue !== value) {
      onChange(localValue);
    }
    onBlur?.();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      inputRef.current?.blur();
    }
    if (e.key === "Escape") {
      e.preventDefault();
      cancelledRef.current = true;
      setLocalValue(value);
      inputRef.current?.blur();
    }
  };

  return (
    <input
      ref={inputRef}
      type="text"
      className="exocortex-property-text-input"
      value={localValue}
      onChange={handleChange}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      placeholder="Enter value..."
      style={{ width: "100%" }}
    />
  );
};
