import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [
      "*.original.*",
      "test-*.html",
      "deploy-netlify.js",
      "restore-local.js",
      "lib/realtime/broadcast.ts",
      "lib/realtime/simple-websocket.ts",
      "websocket-server.js",
      ".kiro/**",
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "dist/**"
    ]
  }
];

export default eslintConfig;
