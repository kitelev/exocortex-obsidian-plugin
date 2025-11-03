import { Command } from "commander";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";
import {
  InMemoryTripleStore,
  SPARQLParser,
  AlgebraTranslator,
  AlgebraOptimizer,
  AlgebraSerializer,
  BGPExecutor,
  NoteToRDFConverter,
  type SolutionMapping,
} from "@exocortex/core";
import { FileSystemVaultAdapter } from "../adapters/FileSystemVaultAdapter.js";
import { TableFormatter } from "../formatters/TableFormatter.js";
import { JsonFormatter } from "../formatters/JsonFormatter.js";

export interface SparqlQueryOptions {
  vault: string;
  format: "table" | "json" | "csv";
  explain?: boolean;
  stats?: boolean;
  noOptimize?: boolean;
}

export function sparqlQueryCommand(): Command {
  return new Command("query")
    .description("Execute SPARQL query against Obsidian vault")
    .argument("<query>", "SPARQL query string or path to .sparql file")
    .option("--vault <path>", "Path to Obsidian vault", process.cwd())
    .option("--format <type>", "Output format: table|json|csv", "table")
    .option("--explain", "Show optimized query plan")
    .option("--stats", "Show execution statistics")
    .option("--no-optimize", "Disable query optimization")
    .action(async (queryArg: string, options: SparqlQueryOptions) => {
      try {
        const startTime = Date.now();

        const queryString = loadQuery(queryArg);

        const vaultPath = resolve(options.vault);
        if (!existsSync(vaultPath)) {
          console.error(`❌ Error: Vault not found: ${vaultPath}`);
          process.exit(1);
        }

        console.log(`📦 Loading vault: ${vaultPath}...`);
        const loadStartTime = Date.now();

        const vaultAdapter = new FileSystemVaultAdapter(vaultPath);
        const converter = new NoteToRDFConverter(vaultAdapter);
        const triples = await converter.convertVault();

        const tripleStore = new InMemoryTripleStore();
        await tripleStore.addAll(triples);

        const loadDuration = Date.now() - loadStartTime;
        console.log(`✅ Loaded ${triples.length} triples in ${loadDuration}ms\n`);

        console.log(`🔍 Parsing SPARQL query...`);
        const parser = new SPARQLParser();
        const ast = parser.parse(queryString);

        console.log(`🔄 Translating to algebra...`);
        const translator = new AlgebraTranslator();
        let algebra = translator.translate(ast);

        if (options.noOptimize) {
          console.log(`⚠️  Query optimization disabled\n`);
        } else {
          const optimizer = new AlgebraOptimizer();
          algebra = optimizer.optimize(algebra);
        }

        if (options.explain) {
          console.log(`📊 Query Plan:`);
          const serializer = new AlgebraSerializer();
          console.log(serializer.toString(algebra));
          console.log();
        }

        console.log(`🎯 Executing query...`);
        const execStartTime = Date.now();

        const results = await executeQuery(algebra, tripleStore);

        const execDuration = Date.now() - execStartTime;
        const totalDuration = Date.now() - startTime;

        console.log(`✅ Found ${results.length} result(s) in ${execDuration}ms\n`);

        if (results.length > 0) {
          formatResults(results, options.format);
        } else {
          console.log("No results found.");
        }

        if (options.stats) {
          console.log(`\n📊 Execution Statistics:`);
          console.log(`  Vault loading: ${loadDuration}ms`);
          console.log(`  Query execution: ${execDuration}ms`);
          console.log(`  Total time: ${totalDuration}ms`);
          console.log(`  Triples scanned: ${triples.length}`);
          console.log(`  Results returned: ${results.length}`);
        }
      } catch (error) {
        if (error instanceof Error) {
          console.error(`❌ Error: ${error.message}`);
          if (error.stack) {
            console.error(error.stack);
          }
        } else {
          console.error(`❌ Unknown error:`, error);
        }
        process.exit(1);
      }
    });
}

function loadQuery(queryArg: string): string {
  if (queryArg.includes("SELECT") || queryArg.includes("CONSTRUCT")) {
    return queryArg;
  }

  const filePath = resolve(queryArg);
  if (existsSync(filePath)) {
    return readFileSync(filePath, "utf-8");
  }

  return queryArg;
}

async function executeQuery(
  algebra: any,
  tripleStore: InMemoryTripleStore
): Promise<SolutionMapping[]> {
  // Extract LIMIT from Slice operation before descending to BGP
  let limit: number | undefined = undefined;
  let operation = algebra;

  // Walk down the algebra tree, extracting LIMIT
  while (operation.type !== "bgp") {
    if (operation.type === "slice" && operation.limit !== undefined) {
      limit = operation.limit;
    }

    if ("input" in operation) {
      operation = operation.input;
    } else {
      throw new Error(`Cannot execute operation type: ${operation.type}`);
    }
  }

  const executor = new BGPExecutor(tripleStore);
  const results = await executor.executeAll(operation);

  // Apply LIMIT if present
  if (limit !== undefined) {
    return results.slice(0, limit);
  }

  return results;
}

function formatResults(results: SolutionMapping[], format: string): void {
  switch (format) {
    case "json":
      const jsonFormatter = new JsonFormatter();
      console.log(jsonFormatter.format(results));
      break;

    case "table":
    default:
      const tableFormatter = new TableFormatter();
      console.log(tableFormatter.format(results));
      break;
  }
}
