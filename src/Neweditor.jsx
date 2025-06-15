import React, { useState, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { Play, Terminal, Code, FileText, Database } from 'lucide-react';

const CodeEditor = () => {
  const [language, setLanguage] = useState('javascript');
  const [code, setCode] = useState('');
  const [output, setOutput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const editorRef = useRef(null);
  const monacoRef = useRef(null);

  // Language configurations with default code templates
  const languageConfigs = {
    javascript: {
      name: 'JavaScript',
      icon: Code,
      defaultCode: `// JavaScript Code
function greet(name) {
    return \`Hello, \${name}!\`;
}

console.log(greet('World'));
console.log('This is client-side JavaScript execution');

// You can also manipulate DOM
document.body.style.backgroundColor = '#f0f8ff';`,
      isClientSide: true
    },
    python: {
      name: 'Python',
      icon: FileText,
      defaultCode: `# Python Code
def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n-1) + fibonacci(n-2)

print("Fibonacci sequence:")
for i in range(10):
    print(f"F({i}) = {fibonacci(i)}")

# List comprehension example
squares = [x**2 for x in range(1, 6)]
print(f"Squares: {squares}")`,
      isClientSide: false
    },
    java: {
      name: 'Java',
      icon: Code,
      defaultCode: `// Java Code
public class HelloWorld {
    public static void main(String[] args) {
        System.out.println("Hello, Java World!");
        
        // Array example
        int[] numbers = {1, 2, 3, 4, 5};
        int sum = 0;
        
        for (int num : numbers) {
            sum += num;
        }
        
        System.out.println("Sum of array: " + sum);
        
        // Object example
        Person person = new Person("Alice", 25);
        person.introduce();
    }
    
    static class Person {
        private String name;
        private int age;
        
        public Person(String name, int age) {
            this.name = name;
            this.age = age;
        }
        
        public void introduce() {
            System.out.println("Hi, I'm " + name + " and I'm " + age + " years old.");
        }
    }
}`,
      isClientSide: false
    },
    c: {
      name: 'C',
      icon: Terminal,
      defaultCode: `// C Code
#include <stdio.h>
#include <stdlib.h>

int factorial(int n) {
    if (n <= 1) return 1;
    return n * factorial(n - 1);
}

int main() {
    printf("Hello, C World!\\n");
    
    int num = 5;
    printf("Factorial of %d is %d\\n", num, factorial(num));
    
    // Array example
    int arr[] = {1, 2, 3, 4, 5};
    int size = sizeof(arr) / sizeof(arr[0]);
    
    printf("Array elements: ");
    for (int i = 0; i < size; i++) {
        printf("%d ", arr[i]);
    }
    printf("\\n");
    
    return 0;
}`,
      isClientSide: false
    },
    cpp: {
      name: 'C++',
      icon: Terminal,
      defaultCode: `// C++ Code
#include <iostream>
#include <vector>
#include <algorithm>

class Calculator {
private:
    std::vector<int> numbers;
    
public:
    void addNumber(int num) {
        numbers.push_back(num);
    }
    
    int sum() {
        int total = 0;
        for (int num : numbers) {
            total += num;
        }
        return total;
    }
    
    void printNumbers() {
        std::cout << "Numbers: ";
        for (int num : numbers) {
            std::cout << num << " ";
        }
        std::cout << std::endl;
    }
};

int main() {
    std::cout << "Hello, C++ World!" << std::endl;
    
    Calculator calc;
    calc.addNumber(10);
    calc.addNumber(20);
    calc.addNumber(30);
    
    calc.printNumbers();
    std::cout << "Sum: " << calc.sum() << std::endl;
    
    return 0;
}`,
      isClientSide: false
    },
    r: {
      name: 'R',
      icon: FileText,
      defaultCode: `# R Code
print("Hello, R World!")

# Vector operations
numbers <- c(1, 2, 3, 4, 5)
print(paste("Numbers:", paste(numbers, collapse = ", ")))
print(paste("Sum:", sum(numbers)))
print(paste("Mean:", mean(numbers)))

# Data frame example
data <- data.frame(
  name = c("Alice", "Bob", "Charlie"),
  age = c(25, 30, 35),
  score = c(85, 92, 78)
)

print("Data Frame:")
print(data)

# Simple function
calculate_grade <- function(score) {
  if (score >= 90) return("A")
  else if (score >= 80) return("B")
  else if (score >= 70) return("C")
  else return("F")
}

data$grade <- sapply(data$score, calculate_grade)
print("Data with grades:")
print(data)`,
      isClientSide: false
    },
    haskell: {
      name: 'Haskell',
      icon: Code,
      defaultCode: `-- Haskell Code
main :: IO ()
main = do
    putStrLn "Hello, Haskell World!"
    
    let numbers = [1..10]
    putStrLn $ "Numbers: " ++ show numbers
    putStrLn $ "Sum: " ++ show (sum numbers)
    putStrLn $ "Even numbers: " ++ show (filter even numbers)
    
    -- Factorial function
    putStrLn $ "Factorial of 5: " ++ show (factorial 5)
    
    -- Fibonacci sequence
    putStrLn $ "First 10 Fibonacci numbers: " ++ show (take 10 fibonacci)

-- Pure functions
factorial :: Integer -> Integer
factorial 0 = 1
factorial n = n * factorial (n - 1)

fibonacci :: [Integer]
fibonacci = 0 : 1 : zipWith (+) fibonacci (tail fibonacci)

-- Higher-order function example
applyTwice :: (a -> a) -> a -> a
applyTwice f x = f (f x)`,
      isClientSide: false
    },
    sql: {
      name: 'SQL',
      icon: Database,
      defaultCode: `-- SQL Code
-- Create sample tables
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY,
    name VARCHAR(50),
    email VARCHAR(100),
    age INTEGER
);

CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY,
    user_id INTEGER,
    product VARCHAR(50),
    amount DECIMAL(10,2),
    order_date DATE
);

-- Insert sample data
INSERT INTO users (name, email, age) VALUES 
('Alice Johnson', 'alice@email.com', 28),
('Bob Smith', 'bob@email.com', 35),
('Charlie Brown', 'charlie@email.com', 42);

INSERT INTO orders (user_id, product, amount, order_date) VALUES 
(1, 'Laptop', 999.99, '2024-01-15'),
(2, 'Mouse', 29.99, '2024-01-16'),
(1, 'Keyboard', 79.99, '2024-01-17'),
(3, 'Monitor', 299.99, '2024-01-18');

-- Query examples
SELECT 'Users Table:' AS info;
SELECT * FROM users;

SELECT 'Orders Table:' AS info;
SELECT * FROM orders;

SELECT 'User Orders with Details:' AS info;
SELECT u.name, u.email, o.product, o.amount, o.order_date
FROM users u
JOIN orders o ON u.id = o.user_id
ORDER BY o.order_date;

SELECT 'Total Orders by User:' AS info;
SELECT u.name, COUNT(o.id) as order_count, SUM(o.amount) as total_spent
FROM users u
LEFT JOIN orders o ON u.id = o.user_id
GROUP BY u.id, u.name;`,
      isClientSide: false
    }
  };

  // Initialize code when language changes
  useEffect(() => {
    if (languageConfigs[language]) {
      setCode(languageConfigs[language].defaultCode);
    }
  }, [language]);

  // Setup Monaco Editor with custom completions
  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    console.log(monaco);
    console.log(editor);
    
    // Register completion providers for each language
    Object.keys(languageConfigs).forEach(lang => {
        console.log(lang);
      registerCompletionProvider(monaco, lang);
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
      formatOnType: true
    });
  };

  // Register custom completion providers
  const registerCompletionProvider = (monaco, language) => {
    const completions = getCompletionsForLanguage(language);
    
    monaco.languages.registerCompletionItemProvider(language, {
      provideCompletionItems: (model, position) => {
        const word = model.getWordUntilPosition(position);
        const range = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: word.startColumn,
          endColumn: word.endColumn
        };

        return {
          suggestions: completions.map(completion => ({
            ...completion,
            range: range
          }))
        };
      }
    });
  };

  // Get completions for specific language
  const getCompletionsForLanguage = (lang) => {
    const CompletionItemKind = monacoRef.current?.languages.CompletionItemKind;
    if (!CompletionItemKind) return [];

    const completions = {
      javascript: [
        {
          label: 'console.log',
          kind: CompletionItemKind.Function,
          insertText: 'console.log(${1:message});',
          insertTextRules: monacoRef.current.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'Log a message to the console'
        },
        {
          label: 'function',
          kind: CompletionItemKind.Keyword,
          insertText: 'function ${1:name}(${2:params}) {\n\t${3:// code}\n}',
          insertTextRules: monacoRef.current.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'Create a function'
        },
        {
          label: 'if',
          kind: CompletionItemKind.Keyword,
          insertText: 'if (${1:condition}) {\n\t${2:// code}\n}',
          insertTextRules: monacoRef.current.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'If statement'
        },
        {
          label: 'for',
          kind: CompletionItemKind.Keyword,
          insertText: 'for (let ${1:i} = 0; ${1:i} < ${2:length}; ${1:i}++) {\n\t${3:// code}\n}',
          insertTextRules: monacoRef.current.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'For loop'
        }
      ],
      python: [
        {
          label: 'print',
          kind: CompletionItemKind.Function,
          insertText: 'print(${1:message})',
          insertTextRules: monacoRef.current.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'Print a message'
        },
        {
          label: 'def',
          kind: CompletionItemKind.Keyword,
          insertText: 'def ${1:function_name}(${2:params}):\n\t${3:pass}',
          insertTextRules: monacoRef.current.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'Define a function'
        },
        {
          label: 'if',
          kind: CompletionItemKind.Keyword,
          insertText: 'if ${1:condition}:\n\t${2:pass}',
          insertTextRules: monacoRef.current.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'If statement'
        },
        {
          label: 'for',
          kind: CompletionItemKind.Keyword,
          insertText: 'for ${1:item} in ${2:iterable}:\n\t${3:pass}',
          insertTextRules: monacoRef.current.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'For loop'
        }
      ],
      java: [
        {
          label: 'System.out.println',
          kind: CompletionItemKind.Function,
          insertText: 'System.out.println(${1:message});',
          insertTextRules: monacoRef.current.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'Print a line to console'
        },
        {
          label: 'public static void main',
          kind: CompletionItemKind.Function,
          insertText: 'public static void main(String[] args) {\n\t${1:// code}\n}',
          insertTextRules: monacoRef.current.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'Main method'
        },
        {
          label: 'if',
          kind: CompletionItemKind.Keyword,
          insertText: 'if (${1:condition}) {\n\t${2:// code}\n}',
          insertTextRules: monacoRef.current.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'If statement'
        }
      ],
      c: [
        {
          label: 'printf',
          kind: CompletionItemKind.Function,
          insertText: 'printf("${1:format}", ${2:args});',
          insertTextRules: monacoRef.current.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'Print formatted output'
        },
        {
          label: 'main',
          kind: CompletionItemKind.Function,
          insertText: 'int main() {\n\t${1:// code}\n\treturn 0;\n}',
          insertTextRules: monacoRef.current.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'Main function'
        },
        {
          label: 'include',
          kind: CompletionItemKind.Keyword,
          insertText: '#include <${1:header}>',
          insertTextRules: monacoRef.current.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'Include header'
        }
      ],
      cpp: [
        {
          label: 'cout',
          kind: CompletionItemKind.Function,
          insertText: 'std::cout << ${1:message} << std::endl;',
          insertTextRules: monacoRef.current.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'Output to console'
        },
        {
          label: 'main',
          kind: CompletionItemKind.Function,
          insertText: 'int main() {\n\t${1:// code}\n\treturn 0;\n}',
          insertTextRules: monacoRef.current.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'Main function'
        },
        {
          label: 'include',
          kind: CompletionItemKind.Keyword,
          insertText: '#include <${1:header}>',
          insertTextRules: monacoRef.current.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'Include header'
        }
      ],
      r: [
        {
          label: 'print',
          kind: CompletionItemKind.Function,
          insertText: 'print(${1:object})',
          insertTextRules: monacoRef.current.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'Print an object'
        },
        {
          label: 'function',
          kind: CompletionItemKind.Keyword,
          insertText: '${1:name} <- function(${2:params}) {\n\t${3:# code}\n}',
          insertTextRules: monacoRef.current.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'Create a function'
        },
        {
          label: 'data.frame',
          kind: CompletionItemKind.Function,
          insertText: 'data.frame(${1:columns})',
          insertTextRules: monacoRef.current.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'Create a data frame'
        }
      ],
      haskell: [
        {
          label: 'putStrLn',
          kind: CompletionItemKind.Function,
          insertText: 'putStrLn ${1:message}',
          insertTextRules: monacoRef.current.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'Print a line'
        },
        {
          label: 'main',
          kind: CompletionItemKind.Function,
          insertText: 'main :: IO ()\nmain = do\n\t${1:-- code}',
          insertTextRules: monacoRef.current.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'Main function'
        }
      ],
      sql: [
        {
          label: 'SELECT',
          kind: CompletionItemKind.Keyword,
          insertText: 'SELECT ${1:columns}\nFROM ${2:table}',
          insertTextRules: monacoRef.current.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'Select statement'
        },
        {
          label: 'INSERT',
          kind: CompletionItemKind.Keyword,
          insertText: 'INSERT INTO ${1:table} (${2:columns})\nVALUES (${3:values})',
          insertTextRules: monacoRef.current.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'Insert statement'
        },
        {
          label: 'CREATE TABLE',
          kind: CompletionItemKind.Keyword,
          insertText: 'CREATE TABLE ${1:table_name} (\n\t${2:column_name} ${3:data_type}\n)',
          insertTextRules: monacoRef.current.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'Create table statement'
        }
      ]
    };

    return completions[lang] || [];
  };

  // Execute code based on language type
  const executeCode = async () => {
    if (!code.trim()) {
      setOutput('No code to execute!');
      return;
    }

    setIsLoading(true);
    setOutput('Executing...');

    try {
      const config = languageConfigs[language];
      
      if (config.isClientSide) {
        // Execute JavaScript in browser
        executeClientSideCode();
      } else {
        // Simulate server-side execution
        // executeServerSideCode();
        setOutput("cant run server side code in browser, please run it in your local environment");
      }
    } catch (error) {
      setOutput(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Execute client-side JavaScript
  const executeClientSideCode = () => {
    try {
      // Capture console output
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

      // Execute the code
      const result = eval(code);
      
      // Restore console
      console.log = originalLog;
      console.error = originalError;

      // Show output
      let output = logs.length > 0 ? logs.join('\n') : '';
      if (result !== undefined) {
        output += (output ? '\n' : '') + `Result: ${result}`;
      }
      
      setOutput(output || 'Code executed successfully (no output)');
    } catch (error) {
      setOutput(`JavaScript Error: ${error.message}`);
    }
  };

  // Simulate server-side execution
  

  // Get selected text
  const getSelectedText = () => {
    if (editorRef.current) {
      const selection = editorRef.current.getSelection();
      const selectedText = editorRef.current.getModel().getValueInRange(selection);
      if (selectedText) {
        setOutput(`Selected text:\n${selectedText}`);
      } else {
        setOutput('No text selected. Please select some code first.');
      }
    }
  };

  const currentConfig = languageConfigs[language];
  const IconComponent = currentConfig.icon;

  return (
    <div className="h-screen bg-gray-900 text-white flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-blue-400">Multi-Language Code Editor</h1>
          <div className="flex items-center gap-4">
            <select 
              value={language} 
              onChange={(e) => setLanguage(e.target.value)}
              className="bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
            >
              {Object.entries(languageConfigs).map(([key, config]) => (
                <option key={key} value={key}>{config.name}</option>
              ))}
            </select>
            
            <button
              onClick={executeCode}
              disabled={isLoading}
              className="bg-green-600 hover:bg-green-700 disabled:bg-green-800 px-4 py-2 rounded flex items-center gap-2 transition-colors"
            >
              <Play size={16} />
              {isLoading ? 'Running...' : 'Run Code'}
            </button>
            
            <button
              onClick={getSelectedText}
              className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded flex items-center gap-2 transition-colors"
            >
              <FileText size={16} />
              Get Selection
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
            <span className="text-sm font-medium">{currentConfig.name}</span>
            <span className="text-xs text-gray-400">
              ({currentConfig.isClientSide ? 'Client-side' : 'Server-side'})
            </span>
          </div>
          
          <div className="flex-1">
            <Editor
              height="100%"
              language={language}
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
                Click "Run Code" to see output here...
                <br /><br />
                Features available:
                <br />• Auto-completion (Ctrl+Space)
                <br />• Multi-language support
                <br />• Code execution simulation
                <br />• Text selection tools
                <br />• Syntax highlighting
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Status Bar */}
      <div className="bg-gray-800 border-t border-gray-700 px-4 py-2 text-xs text-gray-400 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span>Language: {currentConfig.name}</span>
          <span>Lines: {code.split('\n').length}</span>
          <span>Characters: {code.length}</span>
        </div>
        <div className="flex items-center gap-4">
          <span>Monaco Editor Ready</span>
          <span className={`px-2 py-1 rounded text-xs ${
            currentConfig.isClientSide 
              ? 'bg-blue-900 text-blue-300' 
              : 'bg-purple-900 text-purple-300'
          }`}>
            {currentConfig.isClientSide ? 'Client' : 'Server'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default CodeEditor;