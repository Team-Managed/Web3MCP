/**
 * Minimalist, typography-first terminal styling inspired by Claude Code.
 * Zero cyan usage, clean monochrome foundation with subdued semantic accents.
 */

export const isColorSupported =
  Boolean(process.stdout && process.stdout.isTTY) &&
  !process.env.NO_COLOR &&
  process.env.TERM !== 'dumb';

export const c = {
  reset: isColorSupported ? '\x1b[0m' : '',
  bold: isColorSupported ? '\x1b[1m' : '',
  dim: isColorSupported ? '\x1b[2m' : '',
  italic: isColorSupported ? '\x1b[3m' : '',
  underline: isColorSupported ? '\x1b[4m' : '',

  // Monochrome & Clean Accents (No Cyan)
  black: isColorSupported ? '\x1b[30m' : '',
  white: isColorSupported ? '\x1b[37m' : '',
  brightWhite: isColorSupported ? '\x1b[97m' : '',
  gray: isColorSupported ? '\x1b[90m' : '',

  // Status Accents
  green: isColorSupported ? '\x1b[32m' : '',
  brightGreen: isColorSupported ? '\x1b[92m' : '',
  yellow: isColorSupported ? '\x1b[33m' : '',
  brightYellow: isColorSupported ? '\x1b[93m' : '',
  red: isColorSupported ? '\x1b[31m' : '',
  brightRed: isColorSupported ? '\x1b[91m' : '',
  purple: isColorSupported ? '\x1b[35m' : '',
  brightPurple: isColorSupported ? '\x1b[95m' : '',

  // Inverted Pill / Highlight
  inverse: isColorSupported ? '\x1b[7m' : '',
  bgGray: isColorSupported ? '\x1b[100m' : '',
};

/**
 * Strips all ANSI escape sequences from a string to measure visible character length.
 */
export function stripAnsi(str: string): string {
  // eslint-disable-next-line no-control-regex
  return str.replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '');
}

/**
 * Pads a string with spaces until its VISIBLE character width matches the target width.
 */
export function padVisible(text: string, targetWidth: number): string {
  const visibleLen = stripAnsi(text).length;
  if (visibleLen >= targetWidth) {
    return text;
  }
  return text + ' '.repeat(targetWidth - visibleLen);
}

export const theme = {
  brand: (str: string) => `${c.bold}${c.brightWhite}${str}${c.reset}`,
  bullet: () => `${c.bold}${c.brightWhite}●${c.reset}`,
  accent: (str: string) => `${c.bold}${c.brightWhite}${str}${c.reset}`,
  dim: (str: string) => `${c.gray}${str}${c.reset}`,
  bold: (str: string) => `${c.bold}${str}${c.reset}`,
  code: (str: string) => `${c.purple}${str}${c.reset}`,
  success: (str: string) => `${c.brightGreen}${str}${c.reset}`,
  warning: (str: string) => `${c.brightYellow}${str}${c.reset}`,
  error: (str: string) => `${c.brightRed}${str}${c.reset}`,

  // Clean subdued badges (monochrome / subtle tag)
  readBadge: () => `${c.gray}[read]${c.reset}`,
  writeBadge: () => `${c.yellow}[write]${c.reset}`,
  signerBadge: () => `${c.bold}SIGNER${c.reset}`,
  writableBadge: () => `${c.yellow}WRITABLE${c.reset}`,
  readonlyBadge: () => `${c.gray}READONLY${c.reset}`,
  successBadge: () => `${c.brightGreen}SUCCESS${c.reset}`,
  failedBadge: () => `${c.brightRed}FAILED${c.reset}`,
};

/**
 * Converts markdown formatting into clean terminal typography without leaving
 * noisy raw symbols (###, **, `, LaTeX math) in terminal output.
 */
export function renderTerminalMarkdown(markdown: string): string {
  if (!markdown) return '';

  const lines = markdown.split('\n');
  const rendered = lines.map((line) => {
    // Horizontal divider ---
    if (/^---+\s*$/.test(line)) {
      return `${c.gray}────────────────────────────────────────────────────────────────${c.reset}`;
    }

    // Markdown headers (### Header, ## Header, # Header) -> Clean bold title
    const headingMatch = line.match(/^(#{1,4})\s+(.*)$/);
    if (headingMatch) {
      const headingText = headingMatch[2].replace(/\*\*/g, '').trim();
      return `\n${c.bold}${c.brightWhite}${headingText}${c.reset}`;
    }

    // Bullet lists: * or -
    let processed = line.replace(/^\s*[\*\-]\s+/, `  • `);

    // Numbered lists: 1. 2.
    processed = processed.replace(/^(\s*\d+\.)\s+/, `$1 `);

    // Bold tags **text** -> clean bold without asterisks
    processed = processed.replace(/\*\*(.*?)\*\*/g, `${c.bold}$1${c.reset}`);

    // Inline code `code` -> clean highlighted purple/bold
    processed = processed.replace(/`([^`]+)`/g, `${c.purple}$1${c.reset}`);

    // LaTeX math: $1\text{ SOL} = 1,000,000,000\text{ lamports}$ -> clean text
    processed = processed.replace(/\$([^\$]+)\$/g, (_, math) => {
      return math.replace(/\\text\{([^}]+)\}/g, '$1');
    });

    return processed;
  });

  return rendered.join('\n');
}
