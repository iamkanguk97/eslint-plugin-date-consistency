import { useEffect, useRef } from 'react';
import Editor, { type Monaco } from '@monaco-editor/react';
import type { editor } from 'monaco-editor';
import type { LintMessage } from '../utils/linter';

interface Props {
  code: string;
  onChange: (code: string) => void;
  messages: LintMessage[];
}

export default function EditorPane({ code, onChange, messages }: Props) {
  const monacoRef = useRef<Monaco | null>(null);
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);

  useEffect(() => {
    const monaco = monacoRef.current;
    const ed = editorRef.current;
    if (!monaco || !ed) return;
    const model = ed.getModel();
    if (!model) return;
    const markers = messages.map((m) => ({
      startLineNumber: m.line,
      startColumn: m.column,
      endLineNumber: m.endLine ?? m.line,
      endColumn: m.endColumn ?? m.column + 1,
      message: m.message,
      severity: monaco.MarkerSeverity.Warning,
    }));
    monaco.editor.setModelMarkers(model, 'eslint', markers);
  }, [messages]);

  return (
    <div className="editor-pane">
      <div className="pane-header">Code Editor</div>
      <Editor
        height="100%"
        defaultLanguage="javascript"
        value={code}
        onChange={(v) => onChange(v ?? '')}
        theme="vs-dark"
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          lineNumbers: 'on',
          scrollBeyondLastLine: false,
          wordWrap: 'on',
          tabSize: 2,
        }}
        beforeMount={(monaco) => { monacoRef.current = monaco; }}
        onMount={(editor) => { editorRef.current = editor; }}
      />
    </div>
  );
}
