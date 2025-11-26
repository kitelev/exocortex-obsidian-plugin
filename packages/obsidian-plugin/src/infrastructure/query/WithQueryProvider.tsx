import React from "react";
import { App } from "obsidian";
import { QueryProvider } from "./QueryProvider";

export interface WithQueryProviderProps {
  app: App;
  children?: React.ReactNode;
}

export const WithQueryProvider: React.FC<WithQueryProviderProps> = ({
  app,
  children,
}) => {
  return (
    <QueryProvider app={app}>
      {children}
    </QueryProvider>
  );
};

export function wrapWithQueryProvider(
  app: App,
  component: React.ReactElement
): React.ReactElement {
  return React.createElement(WithQueryProvider, { app, children: component });
}
