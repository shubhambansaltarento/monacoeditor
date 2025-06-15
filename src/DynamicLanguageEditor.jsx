import React, { useState, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { Play, Terminal, Code, FileText, Database, Download, RefreshCw } from 'lucide-react';

const DynamicLanguageEditor = () => {
  const [language, setLanguage] = useState('javascript');
  const [code, setCode] = useState('');
  const [output, setOutput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [languages, setLanguages] = useState({});
  const [languageConfigs, setLanguageConfigs] = useState({});
  const [isLoadingConfigs, setIsLoadingConfigs] = useState(true);
  const editorRef = useRef(null);
  const monacoRef = useRef(null);

  // Simplified configuration files structure without default templates
  const configFiles = {
    // Main language registry
    'languages.json': {
      javascript: {
        name: 'JavaScript',
        icon: 'Code',
        isClientSide: true,
        monacoId: 'javascript',
        extensions: ['.js', '.jsx', '.mjs', '.es6'],
        aliases: ['JavaScript', 'js', 'javascript'],
        configFile: 'javascript/language-configuration.json',
        snippetsFile: 'javascript/snippets.json'
      },
      typescript: {
        name: 'TypeScript',
        icon: 'Code',
        isClientSide: true,
        monacoId: 'typescript',
        extensions: ['.ts', '.tsx'],
        aliases: ['TypeScript', 'ts', 'typescript'],
        configFile: 'typescript/language-configuration.json',
        snippetsFile: 'typescript/snippets.json'
      },
      python: {
        name: 'Python',
        icon: 'FileText',
        isClientSide: false,
        monacoId: 'python',
        extensions: ['.py', '.pyi', '.pyc', '.pyd', '.pyo', '.pyw', '.pyz'],
        aliases: ['Python', 'py', 'python'],
        configFile: 'python/language-configuration.json',
        snippetsFile: 'python/snippets.json'
      },
      java: {
        name: 'Java',
        icon: 'Code',
        isClientSide: false,
        monacoId: 'java',
        extensions: ['.java'],
        aliases: ['Java', 'java'],
        configFile: 'java/language-configuration.json',
        snippetsFile: 'java/snippets.json'
      },
      cpp: {
        name: 'C++',
        icon: 'Terminal',
        isClientSide: false,
        monacoId: 'cpp',
        extensions: ['.cpp', '.cc', '.cxx', '.hpp', '.hh', '.hxx'],
        aliases: ['C++', 'Cpp', 'cpp'],
        configFile: 'cpp/language-configuration.json',
        snippetsFile: 'cpp/snippets.json'
      },
      sql: {
        name: 'SQL',
        icon: 'Database',
        isClientSide: false,
        monacoId: 'sql',
        extensions: ['.sql'],
        aliases: ['SQL', 'sql'],
        configFile: 'sql/language-configuration.json',
        snippetsFile: 'sql/snippets.json'
      }
    },

    // JavaScript configuration
    'javascript/language-configuration.json': {
      comments: {
        lineComment: '//',
        blockComment: ['/*', '*/']
      },
      brackets: [
        ['{', '}'],
        ['[', ']'],
        ['(', ')']
      ],
      autoClosingPairs: [
        { open: '{', close: '}' },
        { open: '[', close: ']' },
        { open: '(', close: ')' },
        { open: '"', close: '"', notIn: ['string'] },
        { open: "'", close: "'", notIn: ['string', 'comment'] },
        { open: '`', close: '`', notIn: ['string', 'comment'] }
      ],
      surroundingPairs: [
        { open: '{', close: '}' },
        { open: '[', close: ']' },
        { open: '(', close: ')' },
        { open: '"', close: '"' },
        { open: "'", close: "'" },
        { open: '`', close: '`' }
      ],
      folding: {
        markers: {
          start: new RegExp('^\\s*//\\s*#?region\\b'),
          end: new RegExp('^\\s*//\\s*#?endregion\\b')
        }
      }
    },

    'javascript/snippets.json': [
      {
        label: 'console.log',
        kind: 'Function',
        insertText: 'console.log(${1:message});',
        documentation: 'Outputs a message to the web console',
        category: 'console'
      },
      {
        label: 'function',
        kind: 'Snippet',
        insertText: 'function ${1:name}(${2:params}) {\n\t${3:// function body}\n\treturn ${4:value};\n}',
        documentation: 'Creates a function declaration',
        category: 'functions'
      },
      {
        label: 'arrow function',
        kind: 'Snippet',
        insertText: 'const ${1:name} = (${2:params}) => {\n\t${3:// function body}\n\treturn ${4:value};\n};',
        documentation: 'Creates an arrow function',
        category: 'functions'
      },
      {
        label: 'if statement',
        kind: 'Snippet',
        insertText: 'if (${1:condition}) {\n\t${2:// code}\n}',
        documentation: 'If statement',
        category: 'control'
      },
      {
        label: 'for loop',
        kind: 'Snippet',
        insertText: 'for (let ${1:i} = 0; ${1:i} < ${2:length}; ${1:i}++) {\n\t${3:// code}\n}',
        documentation: 'For loop',
        category: 'control'
      },
      {
        label: 'try-catch',
        kind: 'Snippet',
        insertText: 'try {\n\t${1:// code}\n} catch (${2:error}) {\n\tconsole.error(${2:error});\n}',
        documentation: 'Try-catch block',
        category: 'error'
      }
    ],

    // TypeScript configuration
    'typescript/language-configuration.json': {
      comments: {
        lineComment: '//',
        blockComment: ['/*', '*/']
      },
      brackets: [
        ['{', '}'],
        ['[', ']'],
        ['(', ')']
      ],
      autoClosingPairs: [
        { open: '{', close: '}' },
        { open: '[', close: ']' },
        { open: '(', close: ')' },
        { open: '"', close: '"', notIn: ['string'] },
        { open: "'", close: "'", notIn: ['string', 'comment'] },
        { open: '`', close: '`', notIn: ['string', 'comment'] }
      ]
    },

    'typescript/snippets.json': [
      {
        label: 'interface',
        kind: 'Snippet',
        insertText: 'interface ${1:InterfaceName} {\n\t${2:property}: ${3:type};\n}',
        documentation: 'TypeScript interface',
        category: 'types'
      },
      {
        label: 'type',
        kind: 'Snippet',
        insertText: 'type ${1:TypeName} = ${2:type};',
        documentation: 'TypeScript type alias',
        category: 'types'
      }
    ],

    // Python configuration
    'python/language-configuration.json': {
      comments: {
        lineComment: '#',
        blockComment: ['"""', '"""']
      },
      brackets: [
        ['{', '}'],
        ['[', ']'],
        ['(', ')']
      ],
      autoClosingPairs: [
        { open: '{', close: '}' },
        { open: '[', close: ']' },
        { open: '(', close: ')' },
        { open: '"', close: '"', notIn: ['string'] },
        { open: "'", close: "'", notIn: ['string', 'comment'] }
      ],
      indentationRules: {
        increaseIndentPattern: new RegExp('^(\\s*).*(:)\\s*$'),
        decreaseIndentPattern: new RegExp('^\\s*(return|break|continue|raise|pass)\\b.*$')
      }
    },

    'python/snippets.json': [
      {
        label: 'print',
        kind: 'Function',
        insertText: 'print(${1:message})',
        documentation: 'Print a message',
        category: 'builtin'
      },
      {
        label: 'def',
        kind: 'Snippet',
        insertText: 'def ${1:function_name}(${2:params}):\n\t${3:pass}',
        documentation: 'Define a function',
        category: 'functions'
      },
      {
        label: 'class',
        kind: 'Snippet',
        insertText: 'class ${1:ClassName}:\n\tdef __init__(self${2:, args}):\n\t\t${3:pass}',
        documentation: 'Define a class',
        category: 'classes'
      },
      {
        label: 'if',
        kind: 'Snippet',
        insertText: 'if ${1:condition}:\n\t${2:pass}',
        documentation: 'If statement',
        category: 'control'
      },
      {
        label: 'for',
        kind: 'Snippet',
        insertText: 'for ${1:item} in ${2:iterable}:\n\t${3:pass}',
        documentation: 'For loop',
        category: 'control'
      }
    ],

    

    // C++ configuration
    'cpp/language-configuration.json': {
      comments: {
        lineComment: '//',
        blockComment: ['/*', '*/']
      },
      brackets: [
        ['{', '}'],
        ['[', ']'],
        ['(', ')']
      ],
      autoClosingPairs: [
        { open: '{', close: '}' },
        { open: '[', close: ']' },
        { open: '(', close: ')' },
        { open: '"', close: '"', notIn: ['string'] },
        { open: "'", close: "'", notIn: ['string', 'comment'] }
      ]
    },

    'cpp/snippets.json': [
      {
        label: 'cout',
        kind: 'Function',
        insertText: 'std::cout << ${1:message} << std::endl;',
        documentation: 'Output to console',
        category: 'io'
      },
      {
        label: 'main',
        kind: 'Snippet',
        insertText: 'int main() {\n\t${1:// code}\n\treturn 0;\n}',
        documentation: 'Main function',
        category: 'main'
      }
    ],

    // SQL configuration
    'sql/language-configuration.json': {
      comments: {
        lineComment: '--',
        blockComment: ['/*', '*/']
      },
      brackets: [
        ['(', ')']
      ],
      autoClosingPairs: [
        { open: '(', close: ')' },
        { open: '"', close: '"', notIn: ['string'] },
        { open: "'", close: "'", notIn: ['string', 'comment'] }
      ]
    },

    'sql/snippets.json': [
      {
        label: 'SELECT',
        kind: 'Snippet',
        insertText: 'SELECT ${1:columns}\nFROM ${2:table}\nWHERE ${3:condition};',
        documentation: 'SELECT statement',
        category: 'query'
      },
      {
        label: 'INSERT',
        kind: 'Snippet',
        insertText: 'INSERT INTO ${1:table} (${2:columns})\nVALUES (${3:values});',
        documentation: 'INSERT statement',
        category: 'dml'
      }
    ]
  };

  // Simulate loading configurations from JSON files
  const loadLanguageConfigurations = async () => {
    setIsLoadingConfigs(true);
    try {
      // Simulate API calls to load JSON files
      await new Promise(resolve => setTimeout(resolve, 500)); // Reduced delay
      
      let mainConfig = configFiles['languages.json'];
      const loadedLanguages = {};
      const loadedConfigs = {};

      // console.log(mainConfig)

      
      //   mainConfig.java.configFile = await import('../src/languages/java/language-configuration.json');
      //   mainConfig.java.snippetsFile = await import('../src/languages/java/snippets.json');


      // Load each language configuration
      for (const [langKey, langInfo] of Object.entries(mainConfig)) {
        // console.log(`Loading configuration for ${langKey}...`);
        // console.log(langInfo);
        loadedLanguages[langKey] = {
          ...langInfo,
          icon: getIconComponent(langInfo.icon)
        };

        // configFile: 'javascript/language-configuration.json',
        // snippetsFile: 'javascript/snippets.json'
        // Load language-specific files
        let config = {}
        let snippets = [];
        if(configFiles[langInfo.configFile] == 'javascript/language-configuration.json'){
          config =  await import('../src/languages/java/language-configuration.json');
          // config = await aconfig.json();
        }else{
          config = configFiles[langInfo.configFile] || {};
        }

        if(configFiles[langInfo.snippetsFile] == 'javascript/snippets.json'){
          snippets = await import('../src/languages/java/snippets.json');
        }else{
          snippets = configFiles[langInfo.snippetsFile] || [];
        }
        // const config = configFiles[langInfo.configFile] || {};
        console.log(langKey,config)
        loadedConfigs[langKey] = {
          configuration: config,
          snippets: snippets
        };
      }

      setLanguages(loadedLanguages);
      setLanguageConfigs(loadedConfigs);
      
    } catch (error) {
      console.error('Error loading language configurations:', error);
      setOutput('Error loading language configurations: ' + error.message);
    } finally {
      setIsLoadingConfigs(false);
    }
  };

  // Get icon component from string
  const getIconComponent = (iconName) => {
    const icons = {
      Code,
      FileText,
      Terminal,
      Database
    };
    return icons[iconName] || Code;
  };

  // Load configurations on component mount
  useEffect(() => {
    loadLanguageConfigurations();
  }, []);

  // Setup Monaco Editor with loaded configurations
  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    
    // Register language configurations
    Object.entries(languageConfigs).forEach(([langKey, config]) => {
      if (config.configuration) {
        // Register language configuration
        monaco.languages.setLanguageConfiguration(langKey, config.configuration);
      }
      
      if (config.snippets && config.snippets.length > 0) {
        // Register completion provider
        registerCompletionProvider(monaco, langKey, config.snippets);
      }
    });

    // Configure editor options
    editor.updateOptions({
      fontSize: 14,
      minimap: { enabled: true },
      scrollBeyondLastLine: false,
      automaticLayout: true,
      tabSize: 2,
      insertSpaces: true,
      wordWrap: 'on',
      lineNumbers: 'on',
      renderLineHighlight: 'line',
      selectOnLineNumbers: true,
      matchBrackets: 'always',
      autoIndent: 'full',
      formatOnPaste: true,
      formatOnType: true,
      suggestOnTriggerCharacters: true,
      acceptSuggestionOnEnter: 'on',
      tabCompletion: 'on',
      quickSuggestions: {
        other: true,
        comments: true,
        strings: true
      }
    });
  };

  // Register completion provider using loaded snippets
  const registerCompletionProvider = (monaco, languageId, snippets) => {
    monaco.languages.registerCompletionItemProvider(languageId, {
      provideCompletionItems: (model, position) => {
        const word = model.getWordUntilPosition(position);
        const range = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: word.startColumn,
          endColumn: word.endColumn
        };

        const suggestions = snippets.map(snippet => ({
          label: snippet.label,
          kind: monaco.languages.CompletionItemKind[snippet.kind] || monaco.languages.CompletionItemKind.Snippet,
          insertText: snippet.insertText,
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: snippet.documentation,
          range: range,
          sortText: snippet.category || 'z'
        }));

        return { suggestions };
      }
    });
  };

  // Execute code (client-side only for demo)
  const executeCode = async () => {
    if (!code.trim()) {
      setOutput('No code to execute!');
      return;
    }

    setIsLoading(true);
    setOutput('Executing...');

    try {
      const currentLang = languages[language];
      
      if (currentLang && currentLang.isClientSide && language === 'javascript') {
        executeJavaScript();
      } else {
        setOutput(`Cannot execute ${currentLang ? currentLang.name : language} code in browser environment.\nThis would typically be executed on a server or in a proper runtime environment.`);
      }
    } catch (error) {
      setOutput(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Execute JavaScript code
  const executeJavaScript = () => {
    try {
      const originalLog = console.log;
      const originalError = console.error;
      const logs = [];

      console.log = (...args) => {
        logs.push(args.map(arg => 
          typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
        ).join(' '));
        originalLog(...args);
      };

      console.error = (...args) => {
        logs.push('ERROR: ' + args.map(arg => String(arg)).join(' '));
        originalError(...args);
      };

      const result = eval(code);
      
      console.log = originalLog;
      console.error = originalError;

      let output = logs.length > 0 ? logs.join('\n') : '';
      if (result !== undefined) {
        output += (output ? '\n' : '') + `Result: ${result}`;
      }
      
      setOutput(output || 'Code executed successfully (no output)');
    } catch (error) {
      setOutput(`JavaScript Error: ${error.message}`);
    }
  };

  // Reload configurations
  const reloadConfigurations = () => {
    setCode(''); // Clear the editor
    loadLanguageConfigurations();
  };

  // Export current configuration
  const exportConfig = () => {
    const configToExport = {
      languages: languages,
      configurations: languageConfigs
    };
    
    const blob = new Blob([JSON.stringify(configToExport, null, 2)], { 
      type: 'application/json' 
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'language-configurations.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Clear editor
  const clearEditor = () => {
    setCode('');
    setOutput('');
  };

  if (isLoadingConfigs) {
    return (
      <div className="h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="animate-spin mx-auto mb-4" size={48} />
          <h2 className="text-xl font-semibold mb-2">Loading Language Configurations</h2>
          <p className="text-gray-400">Loading JSON configuration files...</p>
        </div>
      </div>
    );
  }

  const currentLanguage = languages[language];
  const IconComponent = currentLanguage?.icon || Code;

  return (
    <div className="h-screen bg-gray-900 text-white flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-blue-400">Dynamic Language Editor</h1>
          <div className="flex items-center gap-4">
            <select 
              value={language} 
              onChange={(e) => setLanguage(e.target.value)}
              className="bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
            >
              {Object.entries(languages).map(([key, config]) => (
                <option key={key} value={key}>{config.name}</option>
              ))}
            </select>
            
            <button
              onClick={executeCode}
              disabled={isLoading || !code.trim()}
              className="bg-green-600 hover:bg-green-700 disabled:bg-green-800 disabled:opacity-50 px-4 py-2 rounded flex items-center gap-2 transition-colors"
            >
              <Play size={16} />
              {isLoading ? 'Running...' : 'Run Code'}
            </button>
            
            <button
              onClick={clearEditor}
              className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded flex items-center gap-2 transition-colors"
            >
              Clear
            </button>
            
            <button
              onClick={reloadConfigurations}
              className="bg-yellow-600 hover:bg-yellow-700 px-4 py-2 rounded flex items-center gap-2 transition-colors"
            >
              <RefreshCw size={16} />
              Reload
            </button>
            
            <button
              onClick={exportConfig}
              className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded flex items-center gap-2 transition-colors"
            >
              <Download size={16} />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Editor Panel */}
        <div className="flex-1 flex flex-col">
          <div className="bg-gray-800 px-4 py-2 border-b border-gray-700 flex items-center gap-2">
            <IconComponent size={16} className="text-blue-400" />
            <span className="text-sm font-medium">{currentLanguage?.name}</span>
            <span className="text-xs text-gray-400">
              ({currentLanguage?.isClientSide ? 'Client-side' : 'Server-side'})
            </span>
            <span className="text-xs bg-gray-700 px-2 py-1 rounded">
              Extensions: {currentLanguage?.extensions?.join(', ')}
            </span>
          </div>
          
          <div className="flex-1">
            <Editor
              height="100%"
              language={currentLanguage?.monacoId || language}
              value={code}
              onChange={setCode}
              onMount={handleEditorDidMount}
              theme="vs-dark"
              options={{
                fontSize: 14,
                minimap: { enabled: true },
                scrollBeyondLastLine: false,
                automaticLayout: true,
                tabSize: 2,
                insertSpaces: true,
                wordWrap: 'on',
                lineNumbers: 'on',
                renderLineHighlight: 'line',
                selectOnLineNumbers: true,
                matchBrackets: 'always',
                autoIndent: 'full',
                formatOnPaste: true,
                formatOnType: true,
                suggestOnTriggerCharacters: true,
                acceptSuggestionOnEnter: 'on',
                tabCompletion: 'on',
                quickSuggestions: {
                  other: true,
                  comments: true,
                  strings: true
                }
              }}
            />
          </div>
        </div>

        {/* Output Panel */}
        <div className="w-1/3 bg-gray-800 border-l border-gray-700 flex flex-col">
          <div className="bg-gray-700 px-4 py-2 border-b border-gray-600 flex items-center gap-2">
            <Terminal size={16} className="text-green-400" />
            <span className="text-sm font-medium">Output Console</span>
          </div>
          
          <div className="flex-1 p-4 font-mono text-sm overflow-auto">
            {output ? (
              <pre className="whitespace-pre-wrap text-green-300">{output}</pre>
            ) : (
              <div className="text-gray-500 italic">
                Write your code and click "Run Code" to see output here...
                <br /><br />
                <strong>Features:</strong>
                <br />• JSON-based language configurations
                <br />• Auto-completion from snippets
                <br />• Language-specific settings
                <br />• Hot-reload configurations
                <br />• Export/import config files
                <br />• Monaco Editor integration
                <br /><br />
                <strong>Available Languages:</strong>
                <br />{Object.values(languages).map(lang => `• ${lang.name}`).join('\n')}
                <br /><br />
                <strong>Shortcuts:</strong>
                <br />• Ctrl+Space: Auto-complete
                <br />• Ctrl+/: Toggle comment
                <br />• Ctrl+Z: Undo
                <br />• Ctrl+Y: Redo
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Configuration Info Panel */}
      <div className="bg-gray-800 border-t border-gray-700 p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div>
            <h4 className="font-semibold text-blue-400 mb-1">Current Language</h4>
            <p>Name: {currentLanguage?.name}</p>
            <p>Monaco ID: {currentLanguage?.monacoId}</p>
            <p>Aliases: {currentLanguage?.aliases?.join(', ')}</p>
          </div>
          
          <div>
            <h4 className="font-semibold text-green-400 mb-1">Configuration</h4>
            <p>Snippets: {languageConfigs[language]?.snippets?.length || 0} loaded</p>
            <p>Auto-complete: {languageConfigs[language]?.snippets?.length ? 'Enabled' : 'Disabled'}</p>
            <p>Language config: {languageConfigs[language]?.configuration ? 'Loaded' : 'None'}</p>
          </div>
          
          <div>
            <h4 className="font-semibold text-purple-400 mb-1">Editor Stats</h4>
            <p>Lines: {code.split('\n').length}</p>
            <p>Characters: {code.length}</p>
            <p>Words: {code.split(/\s+/).filter(w => w.length > 0).length}</p>
          </div>
        </div>
      </div>

      {/* Status Bar */}
      <div className="bg-gray-900 border-t border-gray-700 px-4 py-2 text-xs text-gray-400 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span>Dynamic Editor Ready</span>
          <span className="text-green-400">● Configurations Loaded</span>
          <span className={`${code.trim() ? 'text-blue-400' : 'text-gray-500'}`}>
            {code.trim() ? '● Code Ready' : '○ No Code'}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span>Monaco Editor</span>
          <span className={`px-2 py-1 rounded text-xs ${
            currentLanguage?.isClientSide 
              ? 'bg-blue-900 text-blue-300' 
              : 'bg-purple-900 text-purple-300'
          }`}>
            {currentLanguage?.isClientSide ? 'Client-side' : 'Server-side'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default DynamicLanguageEditor;