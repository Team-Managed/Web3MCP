import React, { useCallback, useState } from 'react';
import path from 'node:path';
import { Box, Text, useInput } from 'ink';
import { TextInput } from '@inkjs/ui';

export type Provider = 'openai' | 'anthropic' | 'gemini' | 'groq' | 'ollama';
export type Settings = {
  provider: Provider;
  model: string;
  apiKey: string;
  walletPath: string;
  rpcUrl: string;
};
type Field = 'walletPath' | 'rpcUrl';

export function SettingsPanel({ settings, walletAddress, walletPaths = [], error, field, onSave, onDone }: {
  settings: Settings;
  walletAddress: string;
  walletPaths?: string[];
  error: string;
  field: Field;
  onSave: (field: Field, value: string) => boolean;
  onDone: () => void;
}) {
  const [input, setInput] = useState('');
  const [selected, setSelected] = useState(0);
  const [selectionActive, setSelectionActive] = useState(false);
  const changeInput = useCallback((value: string) => { setInput(value); setSelected(0); setSelectionActive(false); }, []);
  const matches = field === 'walletPath' ? walletPaths.filter(value => !input || value.toLowerCase().includes(input.toLowerCase()) || path.basename(value).toLowerCase().includes(input.toLowerCase())) : [];
  const choices = (settings.walletPath && !input ? ['', ...matches] : matches).slice(0, 8);
  useInput((_input, key) => {
    if (key.escape) onDone();
    if (field === 'walletPath' && key.downArrow) { setSelected(value => (value + 1) % Math.max(choices.length, 1)); setSelectionActive(true); }
    if (field === 'walletPath' && key.upArrow) { setSelected(value => (value + Math.max(choices.length, 1) - 1) % Math.max(choices.length, 1)); setSelectionActive(true); }
  });
  const save = (value: string) => {
    const entered = value.trim();
    const chosen = field === 'walletPath' && choices.length && (!entered || selectionActive) ? choices[selected] : entered;
    if (onSave(field, chosen)) onDone();
  };
  return <Box flexDirection="column" borderStyle="round" borderColor="cyan" paddingX={1}>
    <Text bold color="cyan">{field === 'walletPath' ? 'Wallet keypair' : 'Solana RPC'}</Text>
    <Text>Wallet {walletAddress} · RPC {settings.rpcUrl}</Text>
    {error && <Text color="red">{error}</Text>}
    <Text>{field === 'walletPath' ? 'Choose a detected wallet or type another keypair path.' : 'Enter a Solana RPC URL.'}</Text>
    <TextInput key={field} defaultValue={field === 'walletPath' ? '' : settings[field]}
      onChange={changeInput} onSubmit={save} />
    {field === 'walletPath' && choices.map((value, index) => <Text key={value || 'disconnect'}
      color={index === selected ? 'cyan' : undefined}>{index === selected ? '❯ ' : '  '}{value ? `${path.basename(value)}  ${path.dirname(value)}` : 'Disconnect wallet (read only)'}</Text>)}
    {field === 'walletPath' && matches.length > choices.length && <Text dimColor>Type to filter more wallet paths.</Text>}
    <Text dimColor>{field === 'walletPath' ? '↑ ↓ select · Enter connect · Esc cancel' : 'Enter saves · Esc cancels'}</Text>
  </Box>;
}
