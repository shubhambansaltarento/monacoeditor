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

  // Function to dynamically import language configuration files
  const loadExternalConfigFile = async (filePath) => {
    try {
      // Dynamic import with webpack's import() for React apps
    
      const module = await import('../src/languages/' + filePath);
    //   const module = await import('../src/languages/javascript/language-configuration.json');
        console.log(`Loaded configuration from ../src/languages/${filePath}`);
      return module.default || module;
    } catch (error) {
      console.warn(`Could not load ../src/languages/${filePath}:`, error.message);
      return null;
    }
  };

  // Function to load the main languages registry
  const loadLanguagesRegistry = async () => {
    try {
      // Import the main languages.json file
      const registry = await import('../src/languages/languages.json');
      console.log('Loaded languages registry:', registry);

      return registry.default || registry;
    } catch (error) {
      console.error('Error loading languages registry from src/languages/languages.json:', error);
      throw new Error('Languages registry not found. Please ensure src/languages/languages.json exists.');
    }
  };

  // Load configurations from external JSON files in src/languages/
  const loadLanguageConfigurations = async () => {
    setIsLoadingConfigs(true);
    setOutput('Loading language configurations from src/languages/...');
    
    try {
      // Load the main languages registry
      const mainConfig = await loadLanguagesRegistry();
      const loadedLanguages = {};
      const loadedConfigs = {};
      const loadResults = [];

      // Load each language configuration
      for (const [langKey, langInfo] of Object.entries(mainConfig)) {
        loadResults.push(`Loading ${langInfo.name}...`);
        
        loadedLanguages[langKey] = {
          ...langInfo,
          icon: getIconComponent(langInfo.icon)
        };

        // Load language-specific configuration files
        const [config, snippets] = await Promise.all([
          loadExternalConfigFile(langInfo.configFile),
          loadExternalConfigFile(langInfo.snippetsFile)
        ]);

        // console.log(`Loaded ${langInfo.name} configuration:`, config);
        console.log(`Loaded ${langInfo.name} snippets:`, snippets);

        // Store the loaded configurations
        loadedConfigs[langKey] = {
          configuration: config || {},
          snippets: Array.isArray(snippets) ? snippets : []
        };

        // Track loading results
        const configStatus = config ? '✓' : '✗';
        const snippetsStatus = snippets ? `✓ (${snippets.length} snippets)` : '✗';
        loadResults.push(`  ${langInfo.name}: Config ${configStatus}, Snippets ${snippetsStatus}`);
      }

      setLanguages(loadedLanguages);
      setLanguageConfigs(loadedConfigs);
      
      const successMessage = [
        'Successfully loaded language configurations!',
        '',
        'Loading Results:',
        ...loadResults,
        '',
        `Total languages loaded: ${Object.keys(loadedLanguages).length}`,
        'Ready to code! 🚀'
      ].join('\n');
      
      setOutput(successMessage);
      
    } catch (error) {
      console.error('Error loading language configurations:', error);
      const errorMessage = [
        'Error loading language configurations:',
        error.message,
        '',
        'Please check:',
        '1. src/languages/languages.json exists',
        '2. Language subfolders exist (javascript/, python/, etc.)',
        '3. Configuration files are valid JSON',
        '4. File paths match the registry entries',
        '',
        'Expected structure:',
        'src/languages/',
        '├── languages.json',
        '├── javascript/',
        '│   ├── language-configuration.json',
        '│   └── snippets.json',
        '└── [other languages...]'
      ].join('\n');
      
      setOutput(errorMessage);
    } finally {
      setIsLoadingConfigs(false);
    }
  };

  // Handle regex patterns properly for Monaco Editor
  const processLanguageConfiguration = (config) => {
    if (!config) return config;
    
    // Process folding markers if they exist
    if (config.folding && config.folding.markers) {
      const markers = config.folding.markers;
      if (typeof markers.start === 'string') {
        markers.start = new RegExp(markers.start);
      }
      if (typeof markers.end === 'string') {
        markers.end = new RegExp(markers.end);
      }
    }
    
    // Process indentation rules if they exist
    if (config.indentationRules) {
      const rules = config.indentationRules;
      if (typeof rules.increaseIndentPattern === 'string') {
        rules.increaseIndentPattern = new RegExp(rules.increaseIndentPattern);
      }
      if (typeof rules.decreaseIndentPattern === 'string') {
        rules.decreaseIndentPattern = new RegExp(rules.decreaseIndentPattern);
      }
    }
    
    return config;
  };

  // Load configurations on component mount
  useEffect(() => {
    loadLanguageConfigurations();
  }, []);

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

  // Setup Monaco Editor with loaded configurations from external files
  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    
    // Register language configurations from external files
    Object.entries(languageConfigs).forEach(([langKey, config]) => {
      if (config.configuration) {
        // Process configuration to handle regex patterns
        const processedConfig = processLanguageConfiguration(config.configuration);
        
        // Register language configuration with Monaco
        try {
          monaco.languages.setLanguageConfiguration(langKey, processedConfig);
          console.log(`✓ Registered configuration for ${langKey}`);
        } catch (error) {
          console.warn(`Failed to register configuration for ${langKey}:`, error);
        }
      }
      
      if (config.snippets && Array.isArray(config.snippets) && config.snippets.length > 0) {
        // Register completion provider with snippets from external files
        try {
          registerCompletionProvider(monaco, langKey, config.snippets);
          console.log(`✓ Registered ${config.snippets.length} snippets for ${langKey}`);
        } catch (error) {
          console.warn(`Failed to register snippets for ${langKey}:`, error);
        }
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

  // Register completion provider using snippets from external files
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

        const suggestions = snippets.map(snippet => {
          // Validate snippet structure
          if (!snippet.label || !snippet.insertText) {
            console.warn('Invalid snippet format:', snippet);
            return null;
          }

          return {
            label: snippet.label,
            kind: monaco.languages.CompletionItemKind[snippet.kind] || monaco.languages.CompletionItemKind.Snippet,
            insertText: snippet.insertText,
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: snippet.documentation || snippet.label,
            range: range,
            sortText: snippet.category || 'z',
            detail: snippet.category ? `${snippet.category} - ${snippet.label}` : snippet.label
          };
        }).filter(Boolean); // Remove null entries

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

  // Reload configurations from external files
  const reloadConfigurations = () => {
    setCode(''); // Clear the editor
    setOutput('Reloading configurations from src/languages/...');
    loadLanguageConfigurations();
  };

  // Export current configuration (including external file structure)
  const exportConfig = () => {
    const configToExport = {
      metadata: {
        exportDate: new Date().toISOString(),
        totalLanguages: Object.keys(languages).length,
        totalSnippets: Object.values(languageConfigs).reduce((total, config) => total + (config.snippets?.length || 0), 0)
      },
      languages: languages,
      configurations: languageConfigs
    };
    
    const blob = new Blob([JSON.stringify(configToExport, null, 2)], { 
      type: 'application/json' 
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `language-configurations-export-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    setOutput('Configuration exported successfully! 📁');
  };

  // Clear editor
  const clearEditor = () => {
    setCode('');
    setOutput('');
  };

        

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
                <strong>External Configuration:</strong>
                <br />• Loading from src/languages/ folder
                <br />• JSON-based language configurations
                <br />• Auto-completion from external snippets
                <br />• Language-specific settings
                <br />• Hot-reload configurations
                <br />• Export/import config files
                <br /><br />
                <strong>Available Languages:</strong>
                <br />{Object.values(languages).map(lang => `• ${lang.name}`).join('\n')}
                <br /><br />
                <strong>File Structure Expected:</strong>
                <br />• src/languages/languages.json
                <br />• src/languages/javascript/language-configuration.json
                <br />• src/languages/javascript/snippets.json
                <br />• src/languages/[language]/...
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