import type { PluginOptions } from '../utils/linter';

interface Example {
  label: string;
  code: string;
  options: PluginOptions;
}

const EXAMPLES: Example[] = [
  {
    label: 'dayjs',
    code: `import dayjs from 'dayjs';

// ⚠ new Date() should be replaced with dayjs()
const now = new Date();
const formatted = dayjs().format('YYYY-MM-DD');
`,
    options: {},
  },
  {
    label: 'date-fns',
    code: `import { format } from 'date-fns';

// ⚠ new Date() should be replaced with date-fns utilities
const now = new Date();
const formatted = format(new Date(), 'yyyy-MM-dd');
`,
    options: {},
  },
  {
    label: 'moment (deprecated)',
    code: `// ⚠ moment is in maintenance mode
import moment from 'moment';

const now = moment().format('YYYY-MM-DD');
`,
    options: {},
  },
  {
    label: 'banNativeDate',
    code: `// ⚠ new Date() is banned even without a date library
const now = new Date();
const ts = Date.now();
`,
    options: { banNativeDate: true, checkStaticMethods: true },
  },
  {
    label: 'checkStaticMethods',
    code: `import dayjs from 'dayjs';

// ⚠ Date.now() and Date.UTC() are also flagged
const ts = Date.now();
const utc = Date.UTC(2024, 0, 1);
`,
    options: { checkStaticMethods: true },
  },
  {
    label: 'allowAsArgument',
    code: `import dayjs from 'dayjs';

// ✓ new Date() inside a function call is allowed
const d = dayjs(new Date());

// ⚠ standalone new Date() is still flagged
const bad = new Date();
`,
    options: { allowAsArgument: true },
  },
];

interface Props {
  onSelect: (code: string, options: PluginOptions, label: string) => void;
  activeLabel: string;
}

export default function ExampleButtons({ onSelect, activeLabel }: Props) {
  return (
    <div className="example-bar">
      <span className="example-label">Examples:</span>
      {EXAMPLES.map((ex) => (
        <button
          key={ex.label}
          className={`example-btn${activeLabel === ex.label ? ' active' : ''}`}
          onClick={() => onSelect(ex.code, ex.options, ex.label)}
        >
          {ex.label}
        </button>
      ))}
    </div>
  );
}
