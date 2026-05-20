import type { LintMessage } from '../utils/linter';

interface Props {
  messages: LintMessage[];
}

export default function ResultPanel({ messages }: Props) {
  return (
    <div className="result-panel">
      <div className="pane-header">
        Lint Results
        {messages.length > 0 && (
          <span className="result-count">{messages.length}</span>
        )}
      </div>
      <div className="result-list">
        {messages.length === 0 ? (
          <div className="result-empty">
            <span className="result-empty-icon">✓</span>
            <span>No issues found</span>
          </div>
        ) : (
          messages.map((msg, i) => (
            <div key={i} className="result-item">
              <div className="result-location">Line {msg.line}, Col {msg.column}</div>
              <div className="result-rule">{msg.ruleId}</div>
              <div className="result-message">{msg.message}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
