try {
  const stored = localStorage.getItem("slicerai-settings");
  if (stored) {
    const parsed = JSON.parse(stored);
    if (!parsed.version || parsed.version < 2) {
      localStorage.removeItem("slicerai-settings");
      localStorage.removeItem("slicerai-app");
      console.log("Storage antigo limpo automaticamente");
    }
  }
} catch {
  localStorage.removeItem("slicerai-settings");
  localStorage.removeItem("slicerai-app");
}

import { createStart, createMiddleware } from "@tanstack/react-start";


import { renderErrorPage } from "./lib/error-page";

const errorMiddleware = createMiddleware().server(async ({ next }) => {
  try {
    return await next();
  } catch (error) {
    if (error != null && typeof error === "object" && "statusCode" in error) {
      throw error;
    }
    console.error(error);
    return new Response(renderErrorPage(), {
      status: 500,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }
});

export const startInstance = createStart(() => ({
  requestMiddleware: [errorMiddleware],
}));
