#!/usr/bin/env node

import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";

interface MutationResult {
  file: string;
  mutation: string;
  testsRun: number;
  testsPassed: number;
  killed: boolean;
}

class SimpleMutationTester {
  private mutations = [
    {
      name: "Boolean Flip",
      pattern: /return true/g,
      replacement: "return false",
    },
    {
      name: "Comparison Operator",
      pattern: /===/g,
      replacement: "!==",
    },
    {
      name: "Arithmetic Operator",
      pattern: /\+/g,
      replacement: "-",
    },
    {
      name: "Boundary Value",
      pattern: />=/g,
      replacement: ">",
    },
    {
      name: "Null Check",
      pattern: /!= null/g,
      replacement: "== null",
    },
  ];

  private targetFiles = [
    "src/domain/entities/Asset.ts",
    "src/domain/value-objects/AssetId.ts",
    "src/application/use-cases/CreateAssetUseCase.ts",
  ];

  async run(): Promise<void> {
    console.log("🧬 Starting Simple Mutation Testing...\n");
    
    const results: MutationResult[] = [];
    
    for (const file of this.targetFiles) {
      const filePath = path.join(process.cwd(), file);
      
      if (!fs.existsSync(filePath)) {
        console.log(`⚠️  Skipping ${file} (not found)`);
        continue;
      }
      
      console.log(`📁 Testing ${file}...`);
      const originalContent = fs.readFileSync(filePath, "utf-8");
      
      for (const mutation of this.mutations) {
        if (!originalContent.match(mutation.pattern)) {
          continue;
        }
        
        const mutatedContent = originalContent.replace(
          mutation.pattern,
          mutation.replacement
        );
        
        if (mutatedContent === originalContent) {
          continue;
        }
        
        // Apply mutation
        fs.writeFileSync(filePath, mutatedContent);
        
        // Run tests
        const result = this.runTests();
        
        results.push({
          file,
          mutation: mutation.name,
          testsRun: result.testsRun,
          testsPassed: result.testsPassed,
          killed: result.testsPassed < result.testsRun,
        });
        
        // Restore original
        fs.writeFileSync(filePath, originalContent);
        
        const status = result.testsPassed < result.testsRun ? "✅ KILLED" : "❌ SURVIVED";
        console.log(`  ${mutation.name}: ${status}`);
      }
    }
    
    this.printReport(results);
  }

  private runTests(): { testsRun: number; testsPassed: number } {
    try {
      const output = execSync("npm test -- --silent --json", {
        encoding: "utf-8",
        stdio: ["pipe", "pipe", "pipe"],
      });
      
      const jsonMatch = output.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const result = JSON.parse(jsonMatch[0]);
        return {
          testsRun: result.numTotalTests || 0,
          testsPassed: result.numPassedTests || 0,
        };
      }
    } catch (error) {
      // Tests failed - mutation was detected
      return { testsRun: 100, testsPassed: 0 };
    }
    
    return { testsRun: 100, testsPassed: 100 };
  }

  private printReport(results: MutationResult[]): void {
    console.log("\n" + "=".repeat(50));
    console.log("📊 MUTATION TESTING REPORT");
    console.log("=".repeat(50));
    
    const killed = results.filter(r => r.killed).length;
    const survived = results.filter(r => !r.killed).length;
    const score = results.length > 0 ? (killed / results.length * 100).toFixed(1) : "0";
    
    console.log(`\nMutations Run: ${results.length}`);
    console.log(`Killed: ${killed} ✅`);
    console.log(`Survived: ${survived} ❌`);
    console.log(`\nMutation Score: ${score}%`);
    
    if (survived > 0) {
      console.log("\n⚠️  Survived Mutations (need better tests):");
      results
        .filter(r => !r.killed)
        .forEach(r => {
          console.log(`  - ${r.file}: ${r.mutation}`);
        });
    }
    
    const threshold = 60;
    if (parseFloat(score) >= threshold) {
      console.log(`\n✅ Mutation testing passed (threshold: ${threshold}%)`);
    } else {
      console.log(`\n❌ Mutation testing failed (threshold: ${threshold}%)`);
      process.exit(1);
    }
  }
}

// Run if called directly
if (require.main === module) {
  const tester = new SimpleMutationTester();
  tester.run().catch(console.error);
}