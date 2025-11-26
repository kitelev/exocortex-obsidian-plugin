import React, { useEffect } from "react";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { App, EventRef } from "obsidian";
import { getQueryClient, invalidateSPARQLQueries } from "./QueryClientSetup";

export interface QueryProviderProps {
  children: React.ReactNode;
  app: App;
  queryClient?: QueryClient;
}

export const QueryProvider: React.FC<QueryProviderProps> = ({
  children,
  app,
  queryClient,
}) => {
  const client = queryClient ?? getQueryClient();

  useEffect(() => {
    let eventRef: EventRef | null = null;
    let debounceTimeout: ReturnType<typeof setTimeout> | null = null;
    const DEBOUNCE_DELAY = 500;

    const handleFileChange = () => {
      if (debounceTimeout) {
        clearTimeout(debounceTimeout);
      }

      debounceTimeout = setTimeout(() => {
        invalidateSPARQLQueries();
      }, DEBOUNCE_DELAY);
    };

    eventRef = app.metadataCache.on("changed", handleFileChange);

    return () => {
      if (eventRef) {
        app.metadataCache.offref(eventRef);
      }
      if (debounceTimeout) {
        clearTimeout(debounceTimeout);
      }
    };
  }, [app, client]);

  return (
    <QueryClientProvider client={client}>
      {children}
    </QueryClientProvider>
  );
};
