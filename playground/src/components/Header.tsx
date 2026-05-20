export default function Header() {
  return (
    <header className="header">
      <div className="header-left">
        <span className="header-icon">📅</span>
        <div>
          <h1 className="header-title">eslint-plugin-date-consistency</h1>
          <p className="header-subtitle">Interactive Playground</p>
        </div>
      </div>
      <div className="header-badges">
        <a
          href="https://www.npmjs.com/package/eslint-plugin-date-consistency"
          target="_blank"
          rel="noreferrer"
          className="badge-link"
        >
          <img
            src="https://img.shields.io/npm/v/eslint-plugin-date-consistency.svg"
            alt="npm version"
          />
        </a>
        <a
          href="https://github.com/iamkanguk97/eslint-plugin-date-consistency"
          target="_blank"
          rel="noreferrer"
          className="badge-link"
        >
          <img
            src="https://img.shields.io/badge/GitHub-181717?logo=github&logoColor=white"
            alt="GitHub"
          />
        </a>
        <a
          href="https://img.shields.io/badge/license-MIT-blue"
          target="_blank"
          rel="noreferrer"
          className="badge-link"
        >
          <img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT License" />
        </a>
      </div>
    </header>
  );
}
