import React, { useState, useRef, useEffect } from 'react';
import Editor from '@monaco-editor/react';

const defaultJavaCode = `public class TestCompletion {
    public static void main(String[] args) {
        System.out.println("Test LSP completion");
        
        // Test 1: Type after the dot below
        String message = "hello";
        message.
        
        // Test 2: Try System.
        System.
        
        // Test 3: Try creating new objects
        java.util.List<String> list = new java.util.ArrayList<>();
        list.
    }
}`;

const DebugPanel = ({ logs, lspStatus }) => {
  return (
    <div style={{
      height: '200px',
      backgroundColor: '#1e1e1e',
      color: '#fff',
      padding: '10px',
      fontSize: '12px',
      fontFamily: 'monospace',
      overflow: 'auto',
      borderTop: '1px solid #3e3e42'
    }}>
      <div style={{ marginBottom: '10px', fontWeight: 'bold' }}>
        LSP Status: <span style={{ color: lspStatus.status === 'connected' ? '#10b981' : '#ef4444' }}>
          {lspStatus.status}
        </span> - {lspStatus.message}
      </div>
      <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>Debug Log:</div>
      {logs.map((log, index) => (
        <div key={index} style={{ marginBottom: '2px', color: log.type === 'error' ? '#ef4444' : '#10b981' }}>
          [{new Date(log.timestamp).toLocaleTimeString()}] {log.message}
        </div>
      ))}
    </div>
  );
};

const DebugMonacoEditor = () => {
  const [code, setCode] = useState(defaultJavaCode);
  const [isEditorReady, setIsEditorReady] = useState(false);
  const [lspStatus, setLspStatus] = useState({ status: 'disconnected', message: 'Not connected' });
  const [debugLogs, setDebugLogs] = useState([]);
  const editorRef = useRef(null);
  const wsRef = useRef(null);

  const addLog = (message, type = 'info') => {
    setDebugLogs(prev => [...prev, { message, type, timestamp: Date.now() }].slice(-20));
  };

  const connectToLSP = () => {
    addLog('Attempting to connect to LSP bridge...');
    setLspStatus({ status: 'connecting', message: 'Connecting...' });

    try {
      const ws = new WebSocket('ws://localhost:8080');
      wsRef.current = ws;

      ws.onopen = () => {
        addLog('WebSocket connected successfully');
        setLspStatus({ status: 'connecting', message: 'WebSocket connected, initializing LSP...' });
        
        // Send initialize request
        const initRequest = {
          jsonrpc: '2.0',
          id: 1,
          method: 'initialize',
          params: {
            processId: null,
            clientInfo: { name: 'Monaco Editor' },
            rootUri: null,
            capabilities: {
              textDocument: {
                completion: {
                  completionItem: {
                    snippetSupport: true
                  }
                },
                hover: {},
                signatureHelp: {},
                definition: {},
                references: {},
                documentSymbol: {},
                workspaceSymbol: {},
                codeAction: {},
                codeLens: {},
                formatting: {},
                rangeFormatting: {},
                onTypeFormatting: {},
                rename: {},
                documentLink: {},
                executeCommand: {},
                diagnostic: {}
              }
            }
          }
        };
        
        const message = `Content-Length: ${JSON.stringify(initRequest).length}\r\n\r\n${JSON.stringify(initRequest)}`;
        ws.send(message);
        addLog('Sent initialize request');
      };

      ws.onmessage = (event) => {
        const data = event.data;
        addLog(`Received message: ${data.substring(0, 100)}...`);
        
        try {
          // Parse LSP response
          const jsonPart = data.split('\r\n\r\n')[1];
          if (jsonPart) {
            const response = JSON.parse(jsonPart);
            
            if (response.id === 1 && response.result) {
              addLog('LSP initialized successfully!');
              setLspStatus({ status: 'connected', message: 'Connected and ready' });
              
              // Send initialized notification
              const initializedNotif = {
                jsonrpc: '2.0',
                method: 'initialized',
                params: {}
              };
              const initMessage = `Content-Length: ${JSON.stringify(initializedNotif).length}\r\n\r\n${JSON.stringify(initializedNotif)}`;
              ws.send(initMessage);
            }
            
            if (response.result && response.result.items) {
              addLog(`Received ${response.result.items.length} completion suggestions`);
            }
          }
        } catch (e) {
          addLog(`Failed to parse response: ${e.message}`, 'error');
        }
      };

      ws.onerror = (error) => {
        addLog(`WebSocket error: ${error}`, 'error');
        setLspStatus({ status: 'error', message: 'WebSocket error' });
      };

      ws.onclose = () => {
        addLog('WebSocket connection closed', 'error');
        setLspStatus({ status: 'disconnected', message: 'Connection closed' });
      };

    } catch (error) {
      addLog(`Connection failed: ${error.message}`, 'error');
      setLspStatus({ status: 'error', message: 'Connection failed' });
    }
  };

  const testCompletion = () => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      addLog('WebSocket not connected', 'error');
      return;
    }

    addLog('Testing completion at cursor position...');
    
    const editor = editorRef.current;
    const position = editor.getPosition();
    const model = editor.getModel();
    
    const completionRequest = {
      jsonrpc: '2.0',
      id: Date.now(),
      method: 'textDocument/completion',
      params: {
        textDocument: {
          uri: 'file:///test.java'
        },
        position: {
          line: position.lineNumber - 1,
          character: position.column - 1
        }
      }
    };
    
    const message = `Content-Length: ${JSON.stringify(completionRequest).length}\r\n\r\n${JSON.stringify(completionRequest)}`;
    wsRef.current.send(message);
    addLog('Sent completion request');
  };

  const handleEditorDidMount = (editor, monaco) => {
    console.log('📝 Monaco Editor mounted');
    editorRef.current = editor;
    setIsEditorReady(true);
    addLog('Monaco Editor ready');

    // Configure Java language
    monaco.languages.setLanguageConfiguration('java', {
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
        { open: '"', close: '"' },
        { open: "'", close: "'" }
      ]
    });

    editor.focus();
    addLog('Java language configuration applied');
  };

  const handleEditorChange = (value) => {
    if (value !== undefined) {
      setCode(value);
    }
  };

  useEffect(() => {
    // Auto-connect when editor is ready
    if (isEditorReady) {
      setTimeout(connectToLSP, 1000);
    }
  }, [isEditorReady]);

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{
        backgroundColor: '#1e1e1e',
        color: 'white',
        padding: '12px 20px',
        fontSize: '18px',
        fontWeight: '600',
        borderBottom: '1px solid #3e3e42',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <span>Monaco Editor + Java LSP (Debug Mode)</span>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            onClick={connectToLSP}
            style={{
              backgroundColor: '#007acc',
              color: 'white',
              border: 'none',
              padding: '6px 12px',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Reconnect LSP
          </button>
          <button 
            onClick={testCompletion}
            style={{
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              padding: '6px 12px',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Test Completion
          </button>
        </div>
      </div>
      
      {/* Editor */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ flex: 1 }}>
          <Editor
            height="100%"
            defaultLanguage="java"
            value={code}
            onChange={handleEditorChange}
            onMount={handleEditorDidMount}
            theme="vs-dark"
            options={{
              fontSize: 14,
              minimap: { enabled: true },
              scrollBeyondLastLine: false,
              automaticLayout: true,
              wordWrap: 'on',
              suggestOnTriggerCharacters: true,
              acceptSuggestionOnCommitCharacter: true,
              acceptSuggestionOnEnter: 'on'
            }}
          />
        </div>
        
        {/* Debug Panel */}
        <DebugPanel logs={debugLogs} lspStatus={lspStatus} />
      </div>
      
      {/* Instructions */}
      <div style={{
        backgroundColor: '#252526',
        color: '#cccccc',
        padding: '8px 20px',
        fontSize: '12px',
        borderTop: '1px solid #3e3e42'
      }}>
        <strong>Debug Steps:</strong> 
        1. Check LSP Status above 
        2. Position cursor after a dot (e.g., "message.") 
        3. Click "Test Completion" 
        4. Watch debug log for responses
      </div>
    </div>
  );
};

export default DebugMonacoEditor;