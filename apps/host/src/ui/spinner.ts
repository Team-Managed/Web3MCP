import { isColorSupported, c } from './theme.js';

export interface Spinner {
  update: (text: string) => void;
  succeed: (text?: string) => void;
  fail: (text?: string) => void;
  info: (text?: string) => void;
  stop: () => void;
}

/**
 * Creates an animated terminal spinner inspired by Claude Code.
 * Fits within terminal columns and uses clean monochrome framing.
 *
 * @param initialText Message to display next to the spinner
 * @returns Spinner controls
 */
export function createSpinner(initialText: string): Spinner {
  const isInteractive = Boolean(process.stdout && process.stdout.isTTY && !process.env.CI);
  const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
  let frameIndex = 0;
  let text = initialText;
  let timer: NodeJS.Timeout | null = null;
  let isStopped = false;

  function formatFittedLine(): string {
    const cols = process.stdout.columns || 80;
    const maxLen = Math.max(12, cols - 6);
    const visibleText = text.length > maxLen ? text.slice(0, maxLen - 3) + '...' : text;
    return `\r\x1b[2K${c.gray}${frames[frameIndex]}${c.reset} ${visibleText}`;
  }

  if (isInteractive) {
    process.stdout.write('\x1b[?25l'); // Hide cursor
    timer = setInterval(() => {
      frameIndex = (frameIndex + 1) % frames.length;
      process.stdout.write(formatFittedLine());
    }, 80);
    process.stdout.write(formatFittedLine());
  }

  function cleanup() {
    if (isStopped) return;
    isStopped = true;
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
    if (isInteractive) {
      process.stdout.write('\r\x1b[2K\x1b[?25h'); // Clear and restore cursor
    }
  }

  return {
    update: (newText: string) => {
      text = newText;
      if (isInteractive) {
        process.stdout.write(formatFittedLine());
      }
    },
    succeed: (succeedText?: string) => {
      cleanup();
      const msg = succeedText !== undefined ? succeedText : text;
      process.stdout.write(`${c.brightGreen}✔${c.reset} ${msg}\n`);
    },
    fail: (failText?: string) => {
      cleanup();
      const msg = failText !== undefined ? failText : text;
      process.stdout.write(`${c.brightRed}✖${c.reset} ${msg}\n`);
    },
    info: (infoText?: string) => {
      cleanup();
      const msg = infoText !== undefined ? infoText : text;
      process.stdout.write(`${c.gray}ℹ${c.reset} ${msg}\n`);
    },
    stop: () => {
      cleanup();
    },
  };
}
