import React, { useCallback, useEffect, useRef, useState } from 'react';
import os from 'node:os';
import path from 'node:path';
import { Connection, type Keypair } from '@solana/web3.js';
import { Box, Static, Text, render, useApp, useInput } from 'ink';
import { PasswordInput, Select, Spinner, TextInput } from '@inkjs/ui';
import { Web3McpSdk } from '@web3mcp/sdk';
import { Web3McpAgent } from '../agent/index.js';
import { listAvailableModels } from '../llm/index.js';
import { loadKeypairFromFile } from '../wallet/index.js';
import type { ApprovalRequest, AgentProgressEvent } from '../agent/loop.js';
import { extractProgramReference, resolveProgramReference } from './program-ref.js';
import { SettingsPanel, type Provider, type Settings } from './settings.js';
import type { CredentialStore } from './credentials.js';
import type { Preferences } from './preferences.js';
import { discoverWalletPaths } from './wallet-paths.js';

type Line = { id: number; role: 'you' | 'agent' | 'system'; text: string };
type PendingApproval = { request: ApprovalRequest; resolve: (approved: boolean) => void };
const COMMANDS = [
  ['/model', 'Configure provider, key, and model'],
  ['/wallet', 'Connect a local keypair'],
  ['/rpc', 'Set Solana RPC URL'],
  ['/tools', 'Show discovered program tools'],
  ['/balance', 'Show wallet balance'],
  ['/clear', 'Clear visible chat; keep model context'],
  ['/help', 'Show commands'],
  ['/back', 'Return to chat'],
  ['/exit', 'Exit'],
] as const;

export function safeReviewText(value: unknown, limit = 240): string {
  const clean = String(value ?? '').replace(/[\x00-\x1f\x7f-\x9f\u202a-\u202e\u2066-\u2069]/g, ' ');
  return clean.length > limit ? `${clean.slice(0, limit)}… [truncated]` : clean;
}

export function TransactionReview({ request, walletAddress, onDecision }: { request: ApprovalRequest; walletAddress?: string; onDecision: (approved: boolean) => void }) {
  const logs = Array.isArray(request.simulation?.logs) ? request.simulation.logs : [];
  useInput((input, key) => {
    if (input.toLowerCase() === 's') onDecision(true);
    else if (input.toLowerCase() === 'n' || key.return || key.escape || (key.ctrl && input === 'c')) onDecision(false);
  });
  return <Box marginTop={1} flexDirection="column" borderStyle="round" borderColor="yellow" paddingX={1}>
    <Text bold color="yellow">Transaction approval required</Text>
    {walletAddress && <Text>Signing wallet {safeReviewText(walletAddress)}</Text>}
    <Text>Tool {safeReviewText(request.tool)}  ·  Program {safeReviewText(request.programId)}</Text>
    <Text wrap="wrap">Arguments {safeReviewText(JSON.stringify(request.arguments), Infinity)}</Text>
    <Text wrap="wrap">Claimed effects {safeReviewText(request.effects?.summary || 'State change')}{request.effects?.financial ? ' (financial)' : ''}</Text>
    <Text wrap="wrap">Instruction data {request.instruction?.data?.toString('hex') || 'none'}</Text>
    {request.accounts.map((account, index) => <Text key={index} wrap="wrap">{safeReviewText(account.name)}: {safeReviewText(account.pubkey)} {account.isSigner ? 'signer ' : ''}{account.isWritable ? 'writable' : 'read only'}</Text>)}
    <Text>Simulation {request.simulation?.err ? 'FAILED' : 'passed'}  ·  {request.simulation?.unitsConsumed ?? '?'} compute units</Text>
    <Text>Validator logs ({Math.min(logs.length, 8)} of {logs.length})</Text>
    {logs.slice(0, 8).map((log: string, index: number) => <Text key={index} wrap="wrap">  {safeReviewText(log)}</Text>)}
    <Text>Estimated fee {request.estimatedFeeLamports == null ? 'unavailable' : `${request.estimatedFeeLamports} lamports`}</Text>
    <Text wrap="wrap">Message SHA-256 {request.messageHash}</Text>
    <Text bold>Press s to sign this transaction with the selected keypair; n or Enter rejects.</Text>
  </Box>;
}

export interface ChatOptions {
  sdk?: Web3McpSdk;
  programId?: string;
  rpcUrl: string;
  model?: string;
  provider?: Provider;
  apiKey?: string;
  credentialStore?: CredentialStore;
  walletPath?: string;
  walletPaths?: string[];
  signer?: Keypair | null;
  onSettingsChange?: (settings: Preferences) => void;
}

export function ChatScreen({ sdk: initialSdk, programId, rpcUrl, model = '', provider = 'openai', apiKey = '', credentialStore, walletPath = '', walletPaths, signer: initialSigner = null, onSettingsChange }: ChatOptions) {
  const { exit } = useApp();
  const [settings, setSettings] = useState<Settings>({ provider, model, apiKey, walletPath, rpcUrl });
  const settingsLoaded = useRef(false);
  const [runtimeSdk, setRuntimeSdk] = useState(() => initialSdk || new Web3McpSdk({ connection: new Connection(rpcUrl, 'confirmed') }));
  const sdkRef = useRef(runtimeSdk);
  const activationRef = useRef(0);
  const abortRef = useRef<AbortController | null>(null);
  const broadcastingRef = useRef(false);
  const [signer, setSigner] = useState<Keypair | null>(initialSigner);
  const [detectedWallets, setDetectedWallets] = useState(() => walletPaths || discoverWalletPaths());
  const [view, setView] = useState<'settings' | 'chat' | 'commands' | 'models' | 'model-provider' | 'model-key' | 'model-manual'>('chat');
  const [settingField, setSettingField] = useState<'walletPath' | 'rpcUrl'>('walletPath');
  const [modelDraft, setModelDraft] = useState<{ provider: Provider; apiKey: string; newKey: boolean }>({ provider, apiKey, newKey: false });
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [settingsError, setSettingsError] = useState('');
  const [lines, setLines] = useState<Line[]>([]);
  const [activeProgram, setActiveProgram] = useState<string | null>(null);
  const [agent, setAgent] = useState<Web3McpAgent | null>(null);
  const [status, setStatus] = useState(programId ? 'Discovering program tools' : 'Type / for commands');
  const [toolCount, setToolCount] = useState(0);
  const [busy, setBusy] = useState(false);
  const [stream, setStream] = useState('');
  const [approval, setApproval] = useState<PendingApproval | null>(null);
  const [inputKey, setInputKey] = useState(0);
  const [draft, setDraft] = useState('');
  const [slashSelected, setSlashSelected] = useState(0);
  const [slashSelectionActive, setSlashSelectionActive] = useState(false);
  const slashMatches = /^\/\S*$/.test(draft) ? COMMANDS.filter(([name]) => name.startsWith(draft)) : [];
  const customOpenAiBaseURL = process.env.OPENAI_BASE_URL && new URL(process.env.OPENAI_BASE_URL).origin !== 'https://api.openai.com'
    ? process.env.OPENAI_BASE_URL : undefined;
  const credentialName = (selected: Provider): string =>
    selected === 'openai' && customOpenAiBaseURL ? `openai-compatible:${customOpenAiBaseURL}` : selected;
  const selectedCommand = slashMatches[slashSelected]?.[0];
  const changeDraft = useCallback((value: string) => {
    setDraft(value);
    setSlashSelected(0);
    setSlashSelectionActive(false);
  }, []);

  const addLine = (role: Line['role'], text: string) => {
    setLines(previous => [...previous, { id: previous.length, role, text }]);
  };

  useEffect(() => {
    if (!settingsLoaded.current) { settingsLoaded.current = true; return; }
    try { onSettingsChange?.({ provider: settings.provider, model: settings.model,
      walletPath: settings.walletPath, rpcUrl: settings.rpcUrl }); }
    catch (error) { addLine('system', `Could not save settings: ${error instanceof Error ? error.message : String(error)}`); }
  }, [settings.provider, settings.model, settings.walletPath, settings.rpcUrl]);

  async function activateProgram(nextProgram: string, targetSdk = runtimeSdk): Promise<{ programId: string; toolNames: string[] }> {
    const activation = ++activationRef.current;
    setStatus('Discovering program tools');
    await targetSdk.discover(nextProgram);
    if (targetSdk !== sdkRef.current || activation !== activationRef.current) throw new Error('Program discovery was superseded; retry on the current endpoint.');
    const tools = targetSdk.getTools(nextProgram);
    setActiveProgram(nextProgram);
    setToolCount(tools.length);
    setStatus('Ready');
    addLine('system', `Program ${nextProgram}: discovered ${tools.length} tools.`);
    return { programId: nextProgram, toolNames: tools.map(tool => tool.name) };
  }

  useEffect(() => {
    const startSdk = runtimeSdk;
    const startActivation = activationRef.current + 1;
    if (programId) void activateProgram(programId, startSdk).catch(error => {
      if (startSdk !== sdkRef.current || startActivation !== activationRef.current) return;
      setStatus('Discovery failed');
      addLine('system', error instanceof Error ? error.message : String(error));
    });
  }, []);
  useEffect(() => () => approval?.resolve(false), [approval]);
  useEffect(() => () => abortRef.current?.abort(), []);
  useEffect(() => {
    if (agent && activeProgram && agent.programId !== activeProgram) agent.setProgramId(activeProgram);
  }, [agent, activeProgram]);

  function requestExit(interrupted = false) {
    if (broadcastingRef.current) { addLine('system', 'Transaction submission is in progress. Wait for its signature or failure before exiting.'); return; }
    activationRef.current++;
    abortRef.current?.abort();
    approval?.resolve(false);
    exit();
    if (interrupted && process.stdin.isTTY) setTimeout(() => process.exit(130), 1000).unref();
  }

  function finishApproval(approved: boolean) {
    approval?.resolve(approved);
    setApproval(null);
    addLine('system', approved ? 'Signing the reviewed transaction with the selected keypair.' : 'Transaction rejected. No signature requested.');
  }

  function saveSetting(field: keyof Settings, raw: string): boolean {
    const value = raw.trim();
    try {
      if (field === 'walletPath') {
        const resolved = value ? path.resolve(value.startsWith('~/') ? path.join(os.homedir(), value.slice(2)) : value) : '';
        const nextSigner = resolved ? loadKeypairFromFile(resolved) : null;
        setSigner(nextSigner);
        setSettings(previous => ({ ...previous, walletPath: resolved }));
        agent?.setSigner(nextSigner);
      } else if (field === 'rpcUrl') {
        const endpoint = new URL(value);
        if (!['http:', 'https:'].includes(endpoint.protocol)) throw new Error('RPC URL must use HTTP or HTTPS.');
        const nextSdk = new Web3McpSdk({ connection: new Connection(value, 'confirmed') });
        activationRef.current++;
        sdkRef.current = nextSdk;
        setRuntimeSdk(nextSdk);
        setSettings(previous => ({ ...previous, rpcUrl: value }));
        setActiveProgram(null);
        setToolCount(0);
        setAgent(null);
        setStatus('RPC updated; mention a program');
      }
      setSettingsError('');
      return true;
    } catch (error) {
      setSettingsError(error instanceof Error ? error.message : String(error));
      return false;
    }
  }

  async function chooseProvider(nextProvider: Provider) {
    let storedKey = nextProvider === settings.provider ? settings.apiKey : '';
    try {
      if (!storedKey && credentialStore && nextProvider !== 'ollama') storedKey = await credentialStore.get(credentialName(nextProvider));
    } catch {
      setSettingsError('System credential store could not be read. Enter a key for this session.');
    }
    const envKey = nextProvider === 'openai' && customOpenAiBaseURL ? process.env.OPENAI_COMPAT_API_KEY : process.env[`${nextProvider.toUpperCase()}_API_KEY`];
    const nextDraft = { provider: nextProvider, apiKey: storedKey || envKey || '', newKey: false };
    setModelDraft(nextDraft);
    if (nextProvider === 'ollama') void showModels(nextDraft);
    else setView('model-key');
  }

  async function showModels(nextDraft: typeof modelDraft) {
    setView('chat');
    setBusy(true);
    setStatus('Loading provider models');
    try {
      const found = await listAvailableModels({ provider: nextDraft.provider, model: settings.model,
        apiKey: nextDraft.apiKey || undefined,
        baseURL: nextDraft.provider === 'openai' ? customOpenAiBaseURL : undefined });
      if (!found.length) throw new Error('The provider returned no models.');
      setAvailableModels(found);
      setView('models');
      setStatus(`${found.length} models available`);
    } catch (error) {
      setSettingsError(`Model listing failed: ${error instanceof Error ? error.message : String(error)}`);
      setView('model-manual');
    } finally {
      setBusy(false);
    }
  }

  async function finishModel(nextModel: string, nextDraft = modelDraft) {
    const selected = nextModel.trim();
    if (!selected) { setSettingsError('Enter a model name.'); return; }
    if (nextDraft.newKey && credentialStore) {
      try { await credentialStore.set(credentialName(nextDraft.provider), nextDraft.apiKey); }
      catch { addLine('system', 'System credential store could not save the API key. It is available only for this session.'); }
    }
    setSettings(previous => ({ ...previous, provider: nextDraft.provider, apiKey: nextDraft.apiKey, model: selected }));
    setAgent(null);
    setSettingsError('');
    setView('chat');
    setStatus('Ready');
  }

  async function command(value: string) {
    const [name, ...args] = value.split(/\s+/);
    setView('chat');
    if (name === '/back') return;
    if (name === '/exit' || name === '/quit') { requestExit(); return; }
    if (name === '/help') { addLine('system', COMMANDS.map(([cmd, label]) => `${cmd}  ${label}`).join('\n') + '\n/model <id>  Enter a model ID manually'); return; }
    if (name === '/model' && args.length) { await finishModel(args.join(' '), { provider: settings.provider, apiKey: settings.apiKey, newKey: false }); return; }
    if (name === '/model') { setSettingsError(''); setView('model-provider'); return; }
    const field = ({ '/wallet': 'walletPath', '/rpc': 'rpcUrl' } as Record<string, 'walletPath' | 'rpcUrl'>)[name];
    if (field) {
      if (field === 'walletPath' && !walletPaths) setDetectedWallets(discoverWalletPaths());
      setSettingField(field);
      setSettingsError('');
      setView('settings');
      return;
    }
    if (name === '/tools') {
      const tools = activeProgram ? runtimeSdk.getTools(activeProgram) : [];
      addLine('system', tools.length ? tools.map(tool => `${safeReviewText(tool.name)}: ${safeReviewText(tool.description)}`).join('\n') : 'No program loaded. Mention a program ID or .sns name in chat.');
      return;
    }
    if (name === '/balance') {
      if (!signer) { addLine('system', 'Connect a wallet with /wallet first.'); return; }
      try {
        const lamports = await runtimeSdk.connection.getBalance(signer.publicKey);
        addLine('system', `Wallet ${signer.publicKey.toBase58()}: ${lamports / 1e9} SOL on ${new URL(settings.rpcUrl).hostname}`);
      } catch (error) { addLine('system', error instanceof Error ? error.message : String(error)); }
      return;
    }
    if (name === '/clear') { setLines([]); if (process.stdout.isTTY) process.stdout.write('\u001b[2J\u001b[H'); setStatus('Visible chat cleared; model context kept'); return; }
    addLine('system', `Unknown command ${name}. Type / for the command menu.`);
  }

  useInput((input, key) => {
    if (key.ctrl && input === 'c') { requestExit(true); return; }
    if (approval) return;
    if (busy) return;
    if (view === 'chat' && slashMatches.length && (key.upArrow || key.downArrow)) {
      setSlashSelected(value => (value + (key.downArrow ? 1 : slashMatches.length - 1)) % slashMatches.length);
      setSlashSelectionActive(true);
      return;
    }
    if (key.tab && view === 'chat' && draft.length > 1 && slashMatches.length > 0) {
      setDraft(selectedCommand || slashMatches[0][0]);
      setSlashSelected(0);
      setInputKey(value => value + 1);
      return;
    }
    if (key.escape && (view === 'commands' || view === 'models' || view === 'model-provider' || view === 'model-key' || view === 'model-manual')) { setView('chat'); return; }
    if (key.ctrl && input === 't' && view === 'chat') {
      const tools = activeProgram ? runtimeSdk.getTools(activeProgram) : [];
      addLine('system', tools.length ? tools.map(tool => `${safeReviewText(tool.name)}: ${safeReviewText(tool.description)}`).join('\n') : 'No program loaded. Mention a program ID or .sns name in chat.');
    }
  });

  async function submit(input: string) {
    const message = input.trim();
    setInputKey(value => value + 1);
    setDraft('');
    setSlashSelected(0);
    setSlashSelectionActive(false);
    if (!message || busy) return;
    if (message === '/') { setView('commands'); return; }
    if (message.startsWith('/')) { await command(message); return; }
    addLine('you', message);
    if (!settings.model) { addLine('system', 'Choose a model with /model before chatting.'); return; }
    if (settings.provider !== 'ollama' && !settings.apiKey && !process.env[`${settings.provider.toUpperCase()}_API_KEY`] &&
        !(settings.provider === 'openai' && process.env.OPENAI_BASE_URL)) {
      addLine('system', `Set your ${settings.provider} API key with /model before chatting.`);
      return;
    }
    setBusy(true);
    const controller = new AbortController();
    abortRef.current = controller;
    setStatus('Thinking');
    setStream('');
    try {
      const ready = agent || new Web3McpAgent({
        host: runtimeSdk, signer, programId: activeProgram || undefined,
        model: settings.model, provider: settings.provider, apiKey: settings.apiKey || undefined,
        llmOptions: settings.provider === 'openai' && customOpenAiBaseURL ? { baseURL: customOpenAiBaseURL } : undefined,
        onApprovalRequest: request => new Promise<boolean>(resolve => setApproval({ request, resolve })),
        onDiscoverProgram: async inputReference => {
          const reference = extractProgramReference(inputReference);
          if (!reference) throw new Error('Provide a valid Solana program ID or .sns name.');
          const resolved = await resolveProgramReference(reference);
          return activateProgram(resolved);
        },
      });
      if (!agent) setAgent(ready);
      const result = await ready.prompt(message, token => setStream(previous => previous + token), (event: AgentProgressEvent) => {
        if (event.type === 'discovery_result') setStatus(`Discovered ${event.toolNames.length} tools`);
        if (event.type === 'tool_call') addLine('system', `${event.kind === 'accountRead' ? 'Reading' : 'Preparing'} ${event.tool}`);
        if (event.type === 'simulation_result') addLine('system', `Simulation ${event.success ? 'succeeded' : 'failed'} for ${event.tool}`);
        if (event.type === 'broadcasting') broadcastingRef.current = true;
        if (event.type === 'tool_result' && !event.success) { broadcastingRef.current = false; addLine('system', `${event.tool}: ${event.summary || 'failed'}`); }
        if (event.type === 'broadcast_confirmed') { broadcastingRef.current = false; addLine('system', `Confirmed ${event.signature}${event.explorerUrl ? `\n${event.explorerUrl}` : ''}`); }
      }, controller.signal);
      if (result) addLine('agent', result);
      setStatus('Ready');
    } catch (error) {
      setStatus('Error');
      addLine('system', error instanceof Error ? error.message : String(error));
    } finally {
      if (abortRef.current === controller) abortRef.current = null;
      broadcastingRef.current = false;
      setBusy(false);
      setStream('');
    }
  }

  const walletAddress = signer?.publicKey.toBase58() || 'read only';
  if (view === 'settings') return <SettingsPanel key={settingField} settings={settings} walletAddress={walletAddress}
    walletPaths={detectedWallets} field={settingField} error={settingsError} onSave={saveSetting} onDone={() => setView('chat')} />;
  if (view === 'commands') return <Box flexDirection="column" borderStyle="round" borderColor="cyan" paddingX={1}>
    <Text bold color="cyan">Web3MCP Compatible Host commands</Text>
    <Select visibleOptionCount={12} options={COMMANDS.map(([value, label]) => ({ label: `${value}  ${label}`, value }))}
      onChange={value => { void command(value); }} />
    <Text dimColor>Use ↑ ↓ and Enter. Ctrl+C exits.</Text>
  </Box>;
  if (view === 'model-provider') return <Box flexDirection="column" borderStyle="round" borderColor="cyan" paddingX={1}>
    <Text bold color="cyan">Choose model provider</Text>
    <Select options={(['openai', 'anthropic', 'gemini', 'groq', 'ollama'] as Provider[]).map(value => ({ label: value, value }))}
      onChange={value => { void chooseProvider(value as Provider); }} />
    <Text dimColor>Use ↑ ↓ and Enter. Esc returns to chat.</Text>
  </Box>;
  if (view === 'model-key') return <Box flexDirection="column" borderStyle="round" borderColor="cyan" paddingX={1}>
    <Text bold color="cyan">API key for {modelDraft.provider}</Text>
    <Text>{modelDraft.apiKey ? 'Press Enter to reuse the configured key, or enter a new one.' : customOpenAiBaseURL && modelDraft.provider === 'openai' ? 'Enter a key for this endpoint, or press Enter if it needs none.' : 'Enter an API key. Input is masked.'}</Text>
    {settingsError && <Text color="red">{settingsError}</Text>}
    <PasswordInput key={modelDraft.provider} placeholder="API key" onSubmit={value => {
      const entered = value.trim();
      const nextDraft = entered ? { ...modelDraft, apiKey: entered, newKey: true } : modelDraft;
      if (!nextDraft.apiKey && !(customOpenAiBaseURL && nextDraft.provider === 'openai')) { setSettingsError('Enter an API key.'); return; }
      setModelDraft(nextDraft);
      setSettingsError('');
      void showModels(nextDraft);
    }} />
    <Text dimColor>Esc cancels without changing your current model.</Text>
  </Box>;
  if (view === 'model-manual') return <Box flexDirection="column" borderStyle="round" borderColor="cyan" paddingX={1}>
    <Text bold color="cyan">Enter a model ID for {modelDraft.provider}</Text>
    {settingsError && <Text color="yellow">{settingsError}</Text>}
    <TextInput placeholder="Model ID" onSubmit={value => { void finishModel(value); }} />
    <Text dimColor>Esc cancels without changing your current model.</Text>
  </Box>;
  if (view === 'models') return <Box flexDirection="column" borderStyle="round" borderColor="cyan" paddingX={1}>
    <Text bold color="cyan">Models visible to {modelDraft.provider}</Text>
    <Text dimColor>Listed by the provider; chat tool support is checked when used.</Text>
    <Select visibleOptionCount={10} options={[...availableModels.map(value => ({ label: value, value })), { label: 'Enter model ID manually', value: '__manual__' }]}
      onChange={value => { if (value === '__manual__') setView('model-manual'); else void finishModel(value); }} />
    <Text dimColor>Use ↑ ↓ and Enter. Esc cancels.</Text>
  </Box>;

  return <Box flexDirection="column" paddingX={1}>
    <Box flexDirection="column" borderStyle="round" borderColor="cyan" paddingX={1}>
      <Text bold color="cyan">Web3MCP Compatible Host</Text>
      <Text dimColor>Program {activeProgram || 'mention an ID or .sns name in chat'} · Tools {toolCount}</Text>
      <Text dimColor>RPC {new URL(settings.rpcUrl).hostname} · Wallet {walletAddress}</Text>
      <Text dimColor>Model {settings.model || 'not set'} ({settings.provider})</Text>
    </Box>
    <Static items={lines}>{line => <Box key={line.id} marginTop={1} flexDirection="column">
      <Text bold color={line.role === 'you' ? 'green' : line.role === 'agent' ? 'cyan' : 'yellow'}>{line.role === 'you' ? 'You' : line.role === 'agent' ? 'Agent' : 'System'}</Text>
      <Text wrap="wrap">{line.text}</Text>
    </Box>}</Static>
    {busy && !approval && <Box marginTop={1} flexDirection="column"><Spinner label={status}/>{stream && <Text wrap="wrap">{stream}</Text>}</Box>}
    {approval && <TransactionReview request={approval.request} walletAddress={walletAddress} onDecision={finishApproval} />}
    {!busy && !approval && <Box marginTop={1}><Text color="green">› </Text><TextInput key={inputKey} placeholder="Ask about a program, or type / for commands"
      defaultValue={draft}
      suggestions={draft.length > 1 && selectedCommand ? [selectedCommand, ...slashMatches.map(([name]) => name).filter(name => name !== selectedCommand)] : []}
      onChange={changeDraft}
      onSubmit={value => { void submit(slashSelectionActive ? selectedCommand || value : value); }}/></Box>}
    {slashMatches.length > 0 && !busy && !approval && <Box flexDirection="column" marginLeft={3}>
      {slashMatches.map(([name, description], index) => <Text key={name} color={index === slashSelected && slashSelectionActive ? 'cyan' : undefined}
        dimColor={index !== slashSelected || !slashSelectionActive}>{index === slashSelected && slashSelectionActive ? '❯ ' : '  '}{name}  {description}</Text>)}
      <Text dimColor>{draft === '/' ? '↑ ↓ select · Enter opens commands or runs selection.' : '↑ ↓ select · Tab completes · Enter runs selection.'}</Text>
    </Box>}
    {!approval && <Text dimColor>{status} · / Commands · Ctrl+C Exit</Text>}
  </Box>;
}

export function startChat(options: ChatOptions) {
  return render(<ChatScreen {...options} />, { exitOnCtrlC: false });
}
