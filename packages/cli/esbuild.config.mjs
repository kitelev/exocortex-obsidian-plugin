import esbuild from "esbuild";
import { readFileSync } from "fs";

const packageJson = JSON.parse(readFileSync("./package.json", "utf-8"));

const banner = `// ${packageJson.name} v${packageJson.version}
// ${packageJson.description}
// License: ${packageJson.license}
`;

const prod = process.argv[2] === "production";

await esbuild.build({
  entryPoints: ["src/index.ts"],
  bundle: true,
  platform: "node",
  target: "node18",
  format: "cjs",
  outfile: "dist/index.js",
  banner: {
    js: banner,
  },
  minify: prod,
  sourcemap: !prod,
  treeShaking: true,
  keepNames: true,
  external: [
    // Node.js built-ins (not bundled)
    "fs",
    "path",
    "os",
    "util",
    "events",
    "stream",
    "readline",
    "child_process",
    "crypto",
    "url",
    "http",
    "https",
    "net",
    "tls",
    "zlib",
    "buffer",
    "string_decoder",
    "assert",
    "tty",
    "constants",
    "module",
    "worker_threads",
    "perf_hooks",
    "async_hooks",
    "v8",
    "vm",
    "inspector",
    "process",
  ],
  define: {
    "process.env.NODE_ENV": prod ? '"production"' : '"development"',
    "__CLI_VERSION__": JSON.stringify(packageJson.version),
  },
  logLevel: "info",
});

console.log(`✅ CLI built successfully (${prod ? "production" : "development"})`);
