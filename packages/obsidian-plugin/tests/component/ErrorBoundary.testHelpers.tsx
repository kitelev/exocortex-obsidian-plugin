import React from "react";

/**
 * Component that throws an error for testing
 */
export const ThrowError: React.FC<{ shouldThrow?: boolean; error?: Error }> = ({
  shouldThrow = true,
  error = new Error("Test error"),
}) => {
  if (shouldThrow) {
    throw error;
  }
  return <div>No error</div>;
};

/**
 * Working component for testing
 */
export const WorkingComponent: React.FC = () => {
  return <div data-testid="working-component">Component works!</div>;
};

/**
 * Toggle error component for retry testing
 */
export const ToggleError: React.FC<{ shouldThrow: boolean }> = ({ shouldThrow }) => {
  if (shouldThrow) {
    throw new Error("Toggle error");
  }
  return <div data-testid="success">Success!</div>;
};
