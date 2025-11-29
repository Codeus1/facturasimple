import React from "react";

interface PageLoadingProps {
  message?: string;
}

export const PageLoading: React.FC<PageLoadingProps> = ({
  message = "Cargando...",
}) => (
  <div className="p-8 text-muted-foreground">{message}</div>
);
