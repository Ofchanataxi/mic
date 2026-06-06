import Editor from '@monaco-editor/react';

const languageMap = {
  javascript: 'javascript',
  js: 'javascript',
  typescript: 'typescript',
  python: 'python',
  java: 'java',
  csharp: 'csharp',
  'c#': 'csharp',
  cpp: 'cpp',
  'c++': 'cpp',
};

export default function MonacoCodeEditor({ language = 'javascript', value, onChange }) {
  const normalizedLanguage = languageMap[String(language || 'javascript').toLowerCase()] || 'javascript';
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200">
      <Editor
        height="360px"
        language={normalizedLanguage}
        value={value}
        theme="vs-dark"
        onChange={(nextValue) => onChange(nextValue || '')}
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          scrollBeyondLastLine: false,
          wordWrap: 'on',
          automaticLayout: true,
        }}
      />
    </div>
  );
}
