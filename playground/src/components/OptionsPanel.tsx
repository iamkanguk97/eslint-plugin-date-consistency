import type { PluginOptions } from '../utils/linter';

interface Props {
  options: PluginOptions;
  onChange: (options: PluginOptions) => void;
}

const DEFAULT_LIBS = ['dayjs', 'date-fns', 'moment', 'luxon'];

export default function OptionsPanel({ options, onChange }: Props) {
  const libs = options.libs ?? DEFAULT_LIBS;

  function toggle(key: keyof PluginOptions) {
    onChange({ ...options, [key]: !options[key as keyof typeof options] });
  }

  function toggleLib(lib: string) {
    const current = libs;
    const next = current.includes(lib)
      ? current.filter((l) => l !== lib)
      : [...current, lib];
    onChange({ ...options, libs: next });
  }

  return (
    <div className="options-panel">
      <div className="options-section">
        <span className="options-label">no-new-date-with-lib options</span>
        <div className="options-row">
          <label className="option-toggle">
            <input
              type="checkbox"
              checked={!!options.banNativeDate}
              onChange={() => toggle('banNativeDate')}
            />
            <span>banNativeDate</span>
          </label>
          <label className="option-toggle">
            <input
              type="checkbox"
              checked={!!options.checkStaticMethods}
              onChange={() => toggle('checkStaticMethods')}
            />
            <span>checkStaticMethods</span>
          </label>
          <label className="option-toggle">
            <input
              type="checkbox"
              checked={!!options.allowAsArgument}
              onChange={() => toggle('allowAsArgument')}
            />
            <span>allowAsArgument</span>
          </label>
        </div>
      </div>
      <div className="options-section">
        <span className="options-label">libs (watched libraries)</span>
        <div className="options-row">
          {DEFAULT_LIBS.map((lib) => (
            <label key={lib} className="option-toggle">
              <input
                type="checkbox"
                checked={libs.includes(lib)}
                onChange={() => toggleLib(lib)}
              />
              <span>{lib}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
