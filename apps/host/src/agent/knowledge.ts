import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export interface SolanaKnowledgeDomains {
  overview: string;
  accountModel: string;
  tokenModel: string;
  transactionMechanics: string;
  defiPatterns: string;
  errorRecovery: string;
  securityAwareness: string;
}

export interface SolanaKnowledge {
  domains: SolanaKnowledgeDomains;
  combinedText: string;
}

const DOMAIN_FILES: Record<keyof SolanaKnowledgeDomains, string> = {
  overview: 'KNOWLEDGE.md',
  accountModel: 'account-model.md',
  tokenModel: 'token-model.md',
  transactionMechanics: 'transaction-mechanics.md',
  defiPatterns: 'defi-patterns.md',
  errorRecovery: 'error-recovery.md',
  securityAwareness: 'security-awareness.md',
};

let cachedKnowledge: SolanaKnowledge | null = null;

/**
 * Resolves the absolute path to the apps/host/knowledge directory.
 * Searches relative to current module, process working directory, and standard fallbacks.
 *
 * @param customDir Optional custom directory path override
 * @returns Resolved absolute directory path
 */
export function resolveKnowledgeDirectory(customDir?: string): string {
  if (customDir && fs.existsSync(customDir)) {
    return path.resolve(customDir);
  }

  const candidates: string[] = [];

  // Try relative to import.meta.url if available
  try {
    const currentFile = fileURLToPath(import.meta.url);
    const currentDir = path.dirname(currentFile);
    candidates.push(
      path.resolve(currentDir, '../../knowledge'),
      path.resolve(currentDir, '../knowledge'),
      path.resolve(currentDir, '../../../knowledge'),
      path.resolve(currentDir, '../../../apps/host/knowledge')
    );
  } catch {
    // If import.meta is unavailable, ignore
  }

  // Try relative to process.cwd()
  const cwd = process.cwd();
  candidates.push(
    path.resolve(cwd, 'apps/host/knowledge'),
    path.resolve(cwd, 'knowledge'),
    path.resolve(cwd, '../knowledge')
  );

  for (const candidate of candidates) {
    if (fs.existsSync(candidate) && fs.existsSync(path.join(candidate, 'KNOWLEDGE.md'))) {
      return candidate;
    }
  }

  // Fallback to default relative path
  return path.resolve(cwd, 'apps/host/knowledge');
}

/**
 * Loads all Solana operational knowledge markdown files from disk.
 *
 * @param customDir Optional directory containing the knowledge files
 * @param useCache Whether to return cached results if available (default: true)
 * @returns Structured domain knowledge and concatenated prompt string
 */
export function loadSolanaKnowledge(customDir?: string, useCache = true): SolanaKnowledge {
  if (useCache && cachedKnowledge && !customDir) {
    return cachedKnowledge;
  }

  const knowledgeDir = resolveKnowledgeDirectory(customDir);

  const domains: SolanaKnowledgeDomains = {
    overview: '',
    accountModel: '',
    tokenModel: '',
    transactionMechanics: '',
    defiPatterns: '',
    errorRecovery: '',
    securityAwareness: '',
  };

  for (const [key, filename] of Object.entries(DOMAIN_FILES) as [keyof SolanaKnowledgeDomains, string][]) {
    const filePath = path.join(knowledgeDir, filename);
    if (fs.existsSync(filePath)) {
      domains[key] = fs.readFileSync(filePath, 'utf-8').trim();
    } else {
      domains[key] = `[Knowledge file ${filename} not found in ${knowledgeDir}]`;
    }
  }

  const combinedText = formatSolanaKnowledgeForPrompt(domains);
  const result: SolanaKnowledge = { domains, combinedText };

  if (useCache && !customDir) {
    cachedKnowledge = result;
  }

  return result;
}

/**
 * Formats loaded domain knowledge documents into a unified, high-signal system prompt block.
 * Strips duplicate YAML frontmatter headers to save prompt tokens.
 *
 * @param domains Loaded domain texts
 * @returns Formatted prompt section
 */
export function formatSolanaKnowledgeForPrompt(domains: SolanaKnowledgeDomains): string {
  function stripFrontmatter(text: string): string {
    return text.replace(/^---[\s\S]*?---\s*/, '').trim();
  }

  return `### Solana Domain Operational Knowledge

${stripFrontmatter(domains.overview)}

---

${stripFrontmatter(domains.accountModel)}

---

${stripFrontmatter(domains.tokenModel)}

---

${stripFrontmatter(domains.transactionMechanics)}

---

${stripFrontmatter(domains.defiPatterns)}

---

${stripFrontmatter(domains.errorRecovery)}

---

${stripFrontmatter(domains.securityAwareness)}`;
}
