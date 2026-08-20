import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

// Testing Library only auto-cleans when Vitest globals are enabled, and this
// project keeps them off, so unmount explicitly between tests.
afterEach(() => {
  cleanup();
  window.localStorage.clear();
});
