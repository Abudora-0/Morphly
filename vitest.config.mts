import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const alias = {
  "@": fileURLToPath(new URL(".", import.meta.url)),
};

// Two projects rather than one shared environment: the lib tests exercise
// generators and Node-only APIs and would be slowed (and subtly changed) by
// running under jsdom, while the component tests need a DOM.
export default defineConfig({
  resolve: { alias },
  test: {
    projects: [
      {
        resolve: { alias },
        test: {
          name: "lib",
          environment: "node",
          include: ["lib/**/*.test.ts"],
        },
      },
      {
        resolve: { alias },
        test: {
          name: "components",
          environment: "jsdom",
          include: ["components/**/*.test.tsx"],
          setupFiles: ["./vitest.setup.components.ts"],
        },
      },
    ],
  },
});
