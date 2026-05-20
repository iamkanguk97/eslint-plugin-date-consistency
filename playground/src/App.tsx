import { useState, useEffect, useCallback } from 'react';
import type { Linter } from 'eslint';
import Header from './components/Header';
import OptionsPanel from './components/OptionsPanel';
import EditorPane from './components/EditorPane';
import ResultPanel from './components/ResultPanel';
import ExampleButtons from './components/ExampleButtons';
import { lint, type PluginOptions } from './utils/linter';
import { buildShareUrl, getSharedState } from './utils/share';

const DEFAULT_CODE = `import dayjs from 'dayjs';

// ⚠ Replace new Date() with your date library
const now = new Date();
const today = dayjs().format('YYYY-MM-DD');
`;

function loadInitialState(): { code: string; options: PluginOptions } {
  const shared = getSharedState();
  if (shared) return shared;
  return { code: DEFAULT_CODE, options: {} };
}

export default function App() {
  const initial = loadInitialState();
  const [code, setCode] = useState(initial.code);
  const [options, setOptions] = useState<PluginOptions>(initial.options);
  const [messages, setMessages] = useState<Linter.LintMessage[]>([]);
  const [activeLabel, setActiveLabel] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    try {
      setMessages(lint(code, options));
    } catch {
      setMessages([]);
    }
  }, [code, options]);

  const handleExampleSelect = useCallback(
    (exCode: string, exOptions: PluginOptions, label: string) => {
      setCode(exCode);
      setOptions(exOptions);
      setActiveLabel(label);
    },
    [],
  );

  const handleCodeChange = useCallback((c: string) => {
    setCode(c);
    setActiveLabel('');
  }, []);

  const handleOptionsChange = useCallback((o: PluginOptions) => {
    setOptions(o);
    setActiveLabel('');
  }, []);

  const handleShare = useCallback(() => {
    const url = buildShareUrl({ code, options });
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [code, options]);

  return (
    <div className="app">
      <Header />
      <OptionsPanel options={options} onChange={handleOptionsChange} />
      <div className="main-area">
        <EditorPane code={code} onChange={handleCodeChange} messages={messages} />
        <ResultPanel messages={messages} />
      </div>
      <div className="bottom-bar">
        <ExampleButtons activeLabel={activeLabel} onSelect={handleExampleSelect} />
        <button className="share-btn" onClick={handleShare}>
          {copied ? '✓ Copied!' : '🔗 Share'}
        </button>
      </div>
    </div>
  );
}
