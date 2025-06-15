import React, { useState, useRef, useEffect } from 'react';
import { Play, Download, Copy, Settings, Code, Server, Globe, Maximize2, Minimize2 } from 'lucide-react';
import Editor from '@monaco-editor/react';
import axios from 'axios'; 

const MonacoCodeCompiler = () => {
  const [selectedLanguage, setSelectedLanguage] = useState('javascript');
  const [code, setCode] = useState('');
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [theme, setTheme] = useState('vs-dark');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedText, setSelectedText] = useState('');
  const [apiResponse, setApiResponse] = useState('');
  const [isApiLoading, setIsApiLoading] = useState(false);
  const editorRef = useRef(null);

  const JUDGE0_LOCAL_URL = 'http://localhost:2358';

  const languages = {
    // Client-side languages
    javascript: {
      name: 'JavaScript',
      category: 'Client-side',
      icon: <Globe className="w-4 h-4" />,
      monacoLang: 'javascript',
      template: `// JavaScript Example
console.log("Hello, World!");

// Function example
function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

console.log("Fibonacci(10):", fibonacci(10));

// Array methods
const numbers = [1, 2, 3, 4, 5];
const doubled = numbers.map(n => n * 2);
console.log("Doubled:", doubled);

// Modern ES6+ features
const greet = (name = "World") => \`Hello, \${name}!\`;
console.log(greet("Monaco Editor"));`,
      color: 'yellow'
    },
    typescript: {
      name: 'TypeScript',
      category: 'Client-side',
      icon: <Globe className="w-4 h-4" />,
      monacoLang: 'typescript',
      template: `// TypeScript Example
interface User {
  name: string;
  age: number;
  email?: string;
}

class UserService {
  private users: User[] = [];
  
  addUser(user: User): void {
    this.users.push(user);
  }
  
  getUsers(): User[] {
    return this.users;
  }
  
  findUserByName(name: string): User | undefined {
    return this.users.find(user => user.name === name);
  }
}

const userService = new UserService();
userService.addUser({ name: "John Doe", age: 30, email: "john@example.com" });
userService.addUser({ name: "Jane Smith", age: 25 });

console.log("Users:", userService.getUsers());
console.log("Found user:", userService.findUserByName("John Doe"));`,
      color: 'blue'
    },
    html: {
      name: 'HTML',
      category: 'Client-side',
      icon: <Globe className="w-4 h-4" />,
      monacoLang: 'html',
      template: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Monaco Editor HTML Example</title>
    <style>
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
        }
        .container { 
            max-width: 800px; 
            margin: 0 auto; 
            background: white;
            border-radius: 12px;
            padding: 30px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        }
        .highlight { 
            background: linear-gradient(120deg, #a8edea 0%, #fed6e3 100%);
            padding: 4px 8px;
            border-radius: 4px;
            font-weight: 500;
        }
        .btn {
            background: #667eea;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 16px;
            transition: all 0.3s ease;
        }
        .btn:hover {
            background: #764ba2;
            transform: translateY(-2px);
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 Welcome to Monaco Editor</h1>
        <p>This is a <span class="highlight">beautiful HTML</span> document with modern styling.</p>
        <button class="btn" onclick="showMessage()">Click Me!</button>
        <div id="output" style="margin-top: 20px; padding: 15px; background: #f8f9fa; border-radius: 6px;"></div>
    </div>
    
    <script>
        function showMessage() {
            const output = document.getElementById('output');
            output.innerHTML = '<h3>🎉 Hello from Monaco Editor!</h3><p>Current time: ' + new Date().toLocaleString() + '</p>';
        }
    </script>
</body>
</html>`,
      color: 'orange'
    },
    css: {
      name: 'CSS',
      category: 'Client-side',
      icon: <Globe className="w-4 h-4" />,
      monacoLang: 'css',
      template: `/* Modern CSS with Monaco Editor */
:root {
  --primary: #667eea;
  --secondary: #764ba2;
  --success: #10b981;
  --warning: #f59e0b;
  --error: #ef4444;
  --background: #f8fafc;
  --surface: #ffffff;
  --text: #1f2937;
  --text-muted: #6b7280;
  --border: #e5e7eb;
  --shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

* {
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: var(--background);
  color: var(--text);
  margin: 0;
  padding: 20px;
  line-height: 1.6;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
}

.card {
  background: var(--surface);
  border-radius: 12px;
  box-shadow: var(--shadow);
  padding: 24px;
  margin: 20px 0;
  border: 1px solid var(--border);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px -6px rgba(0, 0, 0, 0.15);
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: linear-gradient(135deg, var(--primary), var(--secondary));
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  text-decoration: none;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(102, 126, 234, 0.3);
}

.btn:active {
  transform: translateY(0);
}`,
      color: 'purple'
    },
    // Server-side languages
    python: {
      name: 'Python',
      category: 'Server-side',
      icon: <Server className="w-4 h-4" />,
      monacoLang: 'python',
      template: `# Python Example with Monaco Editor
import json
from datetime import datetime
from typing import List, Dict, Optional

class User:
    def __init__(self, name: str, age: int, email: Optional[str] = None):
        self.name = name
        self.age = age
        self.email = email
        self.created_at = datetime.now()
    
    def to_dict(self) -> Dict:
        return {
            'name': self.name,
            'age': self.age,
            'email': self.email,
            'created_at': self.created_at.isoformat()
        }
    
    def __repr__(self) -> str:
        return f"User(name='{self.name}', age={self.age})"

class UserManager:
    def __init__(self):
        self.users: List[User] = []
    
    def add_user(self, user: User) -> None:
        self.users.append(user)
        print(f"Added user: {user}")
    
    def get_adults(self) -> List[User]:
        return [user for user in self.users if user.age >= 18]
    
    def export_to_json(self) -> str:
        return json.dumps([user.to_dict() for user in self.users], indent=2)

# Usage example
manager = UserManager()
manager.add_user(User("Alice", 25, "alice@example.com"))
manager.add_user(User("Bob", 17, "bob@example.com"))
manager.add_user(User("Charlie", 30))

print(f"Total users: {len(manager.users)}")
print(f"Adults: {len(manager.get_adults())}")

# List comprehension with filtering
ages = [user.age for user in manager.users]
print(f"Ages: {ages}")
print(f"Average age: {sum(ages) / len(ages):.1f}")

# JSON export
print("\\nUsers JSON:")
print(manager.export_to_json())`,
      color: 'green'
    },
    java: {
      name: 'Java',
      category: 'Server-side',
      icon: <Server className="w-4 h-4" />,
      monacoLang: 'java',
      template: `// Java Example with Monaco Editor
import java.util.*;
import java.time.LocalDateTime;
import java.util.stream.Collectors;

public class MonacoJavaExample {
    public static void main(String[] args) {
        UserService userService = new UserService();
        
        // Add some users
        userService.addUser(new User("Alice", 25, "alice@example.com"));
        userService.addUser(new User("Bob", 17, "bob@example.com"));
        userService.addUser(new User("Charlie", 30, "charlie@example.com"));
        userService.addUser(new User("Diana", 22, "diana@example.com"));
        
        System.out.println("=== User Management System ===");
        System.out.println("Total users: " + userService.getUserCount());
        
        // Stream API examples
        List<User> adults = userService.getAdults();
        System.out.println("Adults: " + adults.size());
        
        // Find users by email domain
        List<User> exampleUsers = userService.getUsersByEmailDomain("example.com");
        System.out.println("Example.com users: " + exampleUsers.size());
        
        // Statistics
        OptionalDouble avgAge = userService.getAverageAge();
        if (avgAge.isPresent()) {
            System.out.printf("Average age: %.1f%n", avgAge.getAsDouble());
        }
        
        // Display all users
        System.out.println("\\n=== All Users ===");
        userService.getAllUsers().forEach(System.out::println);
    }
}

class User {
    private String name;
    private int age;
    private String email;
    private LocalDateTime createdAt;
    
    public User(String name, int age, String email) {
        this.name = name;
        this.age = age;
        this.email = email;
        this.createdAt = LocalDateTime.now();
    }
    
    // Getters
    public String getName() { return name; }
    public int getAge() { return age; }
    public String getEmail() { return email; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    
    @Override
    public String toString() {
        return String.format("User{name='%s', age=%d, email='%s', created=%s}", 
                           name, age, email, createdAt.toString());
    }
}

class UserService {
    private List<User> users = new ArrayList<>();
    
    public void addUser(User user) {
        users.add(user);
    }
    
    public List<User> getAllUsers() {
        return new ArrayList<>(users);
    }
    
    public int getUserCount() {
        return users.size();
    }
    
    public List<User> getAdults() {
        return users.stream()
                   .filter(user -> user.getAge() >= 18)
                   .collect(Collectors.toList());
    }
    
    public List<User> getUsersByEmailDomain(String domain) {
        return users.stream()
                   .filter(user -> user.getEmail().endsWith("@" + domain))
                   .collect(Collectors.toList());
    }
    
    public OptionalDouble getAverageAge() {
        return users.stream()
                   .mapToInt(User::getAge)
                   .average();
    }
}`,
      color: 'red'
    },
    json: {
      name: 'JSON',
      category: 'Data',
      icon: <Code className="w-4 h-4" />,
      monacoLang: 'json',
      template: `{
  "apiVersion": "v1",
  "metadata": {
    "name": "monaco-editor-example",
    "description": "A comprehensive JSON example showcasing various data structures",
    "version": "1.0.0",
    "createdAt": "2025-06-06T10:00:00Z",
    "tags": ["monaco", "editor", "json", "example"]
  },
  "users": [
    {
      "id": 1,
      "name": "Alice Johnson",
      "email": "alice@example.com",
      "age": 25,
      "isActive": true,
      "profile": {
        "avatar": "https://example.com/avatars/alice.jpg",
        "bio": "Software developer passionate about clean code",
        "location": {
          "city": "San Francisco",
          "country": "USA",
          "coordinates": {
            "lat": 37.7749,
            "lng": -122.4194
          }
        }
      },
      "preferences": {
        "theme": "dark",
        "notifications": {
          "email": true,
          "push": false,
          "sms": true
        },
        "languages": ["JavaScript", "Python", "TypeScript"]
      }
    }
  ],
  "settings": {
    "application": {
      "name": "Code Compiler Pro",
      "version": "2.1.0",
      "environment": "production"
    },
    "features": {
      "monacoEditor": {
        "enabled": true,
        "theme": "vs-dark",
        "fontSize": 14,
        "minimap": true,
        "wordWrap": "on"
      }
    }
  }
}`,
      color: 'gray'
    }
  };

  // Initialize code when component mounts or language changes
  useEffect(() => {
    if (selectedLanguage && languages[selectedLanguage]) {
      setCode(languages[selectedLanguage].template);
    }
  }, [selectedLanguage]);

  const runCode = async () => {
    setIsRunning(true);
    setOutput('');
    
    try {
      if (selectedLanguage === 'javascript') {
        // Create a safe execution environment for JavaScript
        const originalConsole = console.log;
        const logs = [];
        console.log = (...args) => {
          logs.push(args.map(arg => 
            typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
          ).join(' '));
        };
        
        try {
          // Execute the code
          // eslint-disable-next-line no-eval
          eval(code);
          setOutput(logs.join('\n') || 'Code executed successfully (no console output)');
        } catch (error) {
          setOutput(`❌ JavaScript Error: ${error.message}`);
        } finally {
          console.log = originalConsole;
        }
      } else if (selectedLanguage === 'html') {
        setOutput('✅ HTML code is ready to be saved and opened in a browser.\n\n💡 Tip: Copy the code and save it as an .html file to see it in action!');
      } else if (selectedLanguage === 'css') {
        setOutput('✅ CSS code is ready to be applied to HTML elements.\n\n💡 Tip: Copy this CSS into a <style> tag or save as a .css file and link it to your HTML.');
      } else if (selectedLanguage === 'json') {
        try {
          JSON.parse(code);
          setOutput('✅ Valid JSON format!\n\n💡 This JSON can be used for API responses, configuration files, or data storage.');
        } catch (error) {
          setOutput(`❌ JSON Validation Error: ${error.message}\n\n💡 Check for missing commas, quotes, or brackets.`);
        }
      } else {
        const lang = languages[selectedLanguage];
        const extensions = {
          typescript: 'ts',
          python: 'py',
          java: 'java',
          csharp: 'cs'
        };
        
        setOutput(`🚀 ${lang.name} Code Ready for Compilation!

📁 Save as: code.${extensions[selectedLanguage] || selectedLanguage}

🔧 Compilation Commands:
${selectedLanguage === 'typescript' ? '• npm install -g typescript\n• tsc code.ts\n• node code.js' : ''}
${selectedLanguage === 'python' ? '• python code.py\n• Or: python3 code.py' : ''}
${selectedLanguage === 'java' ? '• javac code.java\n• java MonacoJavaExample' : ''}

💡 ${lang.category} language - requires ${lang.category === 'Server-side' ? 'server-side' : 'client-side'} runtime environment.`);
      }
    } catch (error) {
      setOutput(`❌ Error: ${error.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(code).then(() => {
      setOutput(prev => `📋 Code copied to clipboard!\n\n${prev}`);
    });
  };

  const downloadCode = () => {
    const extensions = {
      javascript: 'js',
      typescript: 'ts',
      html: 'html',
      css: 'css',
      python: 'py',
      java: 'java',
      json: 'json'
    };
    
    const extension = extensions[selectedLanguage] || 'txt';
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `monaco-code.${extension}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  // Get selected text from Monaco Editor
  const getSelectedText = () => {
    if (editorRef.current) {
      const selection = editorRef.current.getSelection();
      const selectedText = editorRef.current.getModel().getValueInRange(selection);
      return selectedText;
    }
    return '';
  };

  // Copy selected text
  const copySelectedText = () => {
    const selected = getSelectedText();
    if (selected) {
      navigator.clipboard.writeText(selected).then(() => {
        setOutput(prev => `📋 Selected text copied to clipboard!\nSelected: ${selected.split('\n').length} lines\n\n${prev}`);
      });
    } else {
      setOutput(prev => `⚠️ No text selected in editor.\n\n${prev}`);
    }
  };

  const submitCode = async (formData) => {
    const options = {
        method: "POST",
        url: 'http://localhost:2358/submissions',
        params: { base64_encoded: "true", fields: "*" },
        headers: {
            "content-type": "application/json",
            "Content-Type": "application/json",
        },
        data: formData,
    };

    try {
        const { data } = await axios.request(options);

        console.log(data)

        return { success: true, data };
    } catch (err) {
        return { success: false, err }
    }
}


async function createSubmission(sourceCode, languageId, stdin = '') {
    const submissionData = {
        source_code: btoa(sourceCode), // Base64 encode
        language_id: languageId,
        stdin: btoa(stdin),
        // Optional parameters
        expected_output: null,
        cpu_time_limit: 2,
        memory_limit: 128000,
        wall_time_limit: 5,
        compiler_options: null,
        command_line_arguments: null
    };

    try {
        const response = await fetch(`${JUDGE0_LOCAL_URL}/submissions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(submissionData)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        console.log('Submission created:', result);
        return result.token;
    } catch (error) {
        console.error('Error creating submission:', error);
        return null;
    }
}

  // Mock API call with selected text
  const makeApiCall = async (endpoint = 'analyze') => {
    const selected = getSelectedText();
    console.log("selected", selected);
    if (!selected.trim()) {
      setOutput(prev => `⚠️ Please select some code in the editor first.\n\n${prev}`);
      return;
    }

    let formData = {
      source_code: btoa(selected), // Base64 encode the source code
        language_id: 62,
        stdin: btoa(''), // Baz
    }

    // submitCode(formData)



    setIsApiLoading(true);
    setApiResponse('');

    try {
      createSubmission(selected, 62, '')
      // Simulate different API endpoints
      const apiEndpoints = {
        analyze: {
          name: 'Code Analysis API',
          description: 'Analyzes code quality and suggests improvements'
        },
        explain: {
          name: 'Code Explanation API', 
          description: 'Explains what the selected code does'
        },
        optimize: {
          name: 'Code Optimization API',
          description: 'Suggests optimizations for the selected code'
        },
        debug: {
          name: 'Debug Assistant API',
          description: 'Helps identify potential bugs in the code'
        }
      };

      const api = apiEndpoints[endpoint];
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Mock API response based on selected code
      const mockResponse = {
        success: true,
        endpoint: endpoint,
        selectedCode: selected,
        lineCount: selected.split('\n').length,
        charCount: selected.length,
        language: languages[selectedLanguage]?.name,
        analysis: generateMockAnalysis(selected, endpoint),
        timestamp: new Date().toISOString()
      };

      setApiResponse(JSON.stringify(mockResponse, null, 2));
      setOutput(`✅ API Call Successful to ${api.name}!\n\n📊 Analysis Results:\n${mockResponse.analysis}\n\n📋 Selected Code (${mockResponse.lineCount} lines, ${mockResponse.charCount} chars):\n${selected.substring(0, 200)}${selected.length > 200 ? '...' : ''}`);

    } catch (error) {
      setApiResponse(`Error: ${error.message}`);
      setOutput(`❌ API call failed: ${error.message}`);
    } finally {
      setIsApiLoading(false);
    }
  };

  // Generate mock analysis based on code content and endpoint
  const generateMockAnalysis = (code, endpoint) => {
    const codeLines = code.split('\n').length;
    const hasLoops = /for|while|forEach/.test(code);
    const hasFunctions = /function|def|class|=>/.test(code);
    const hasComments = /\/\/|#|\/\*/.test(code);

    switch (endpoint) {
      case 'analyze':
        return `Code Quality Score: ${hasComments ? '85' : '70'}/100
• ${codeLines} lines of code
• ${hasFunctions ? 'Good' : 'Fair'} function structure
• ${hasComments ? 'Well documented' : 'Needs more comments'}
• ${hasLoops ? 'Contains loops - check for optimization' : 'No complex loops detected'}`;

      case 'explain':
        return `Code Explanation:
• This ${selectedLanguage} code snippet contains ${codeLines} lines
• ${hasFunctions ? 'Defines functions/methods for reusable logic' : 'Contains procedural code'}
• ${hasLoops ? 'Uses iteration patterns for data processing' : 'No iteration patterns detected'}
• Purpose: ${hasFunctions ? 'Modular programming approach' : 'Sequential execution'}`;

      case 'optimize':
        return `Optimization Suggestions:
• ${hasLoops ? 'Consider using built-in array methods for better performance' : 'Code structure looks efficient'}
• ${code.length > 500 ? 'Consider breaking into smaller functions' : 'Good function size'}
• ${hasComments ? 'Documentation is good' : 'Add more descriptive comments'}
• Memory usage: ${codeLines > 20 ? 'Consider memory optimization' : 'Looks efficient'}`;

      case 'debug':
        return `Debug Analysis:
• No obvious syntax errors detected
• ${hasLoops ? 'Check loop conditions for infinite loops' : 'No loop-related issues'}
• ${hasFunctions ? 'Verify function parameters and return values' : 'Check variable scoping'}
• Potential issues: ${code.includes('var') ? 'Consider using let/const instead of var' : 'No major issues found'}`;

      default:
        return 'Analysis completed successfully';
    }
  };

  const clientSideLanguages = Object.entries(languages).filter(([_, lang]) => lang.category === 'Client-side');
  const serverSideLanguages = Object.entries(languages).filter(([_, lang]) => lang.category === 'Server-side');
  const dataLanguages = Object.entries(languages).filter(([_, lang]) => lang.category === 'Data');

  return (
    <div className={`min-h-screen ${theme === 'vs-dark' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-900'}`}>
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
            <Code className="w-8 h-8" />
            Monaco Code Editor Compiler
          </h1>
          <p className="text-gray-500">Professional code editing with Monaco Editor (VS Code's editor)</p>
        </div>

        <div className={`grid ${isFullscreen ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-4'} gap-6`}>
          {/* Language Selection */}
          {!isFullscreen && (
            <div className={`${theme === 'vs-dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg p-4 shadow-lg`}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Languages</h2>
                <button
                  onClick={() => setTheme(theme === 'vs-dark' ? 'vs-light' : 'vs-dark')}
                  className="p-2 rounded-lg hover:bg-gray-700 transition-colors"
                  title="Toggle Theme"
                >
                  <Settings className="w-4 h-4" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-green-400 mb-2 flex items-center gap-2">
                    <Globe className="w-4 h-4" />
                    Client-side
                  </h3>
                  <div className="space-y-1">
                    {clientSideLanguages.map(([key, lang]) => (
                      <button
                        key={key}
                        onClick={() => setSelectedLanguage(key)}
                        className={`w-full text-left p-2 rounded-lg transition-colors flex items-center gap-2 ${
                          selectedLanguage === key
                            ? 'bg-blue-600 text-white'
                            : theme === 'vs-dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                        }`}
                      >
                        {lang.icon}
                        {lang.name}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-purple-400 mb-2 flex items-center gap-2">
                    <Server className="w-4 h-4" />
                    Server-side
                  </h3>
                  <div className="space-y-1">
                    {serverSideLanguages.map(([key, lang]) => (
                      <button
                        key={key}
                        onClick={() => setSelectedLanguage(key)}
                        className={`w-full text-left p-2 rounded-lg transition-colors flex items-center gap-2 ${
                          selectedLanguage === key
                            ? 'bg-blue-600 text-white'
                            : theme === 'vs-dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                        }`}
                      >
                        {lang.icon}
                        {lang.name}
                      </button>
                    ))}
                  </div>
                </div>

                {dataLanguages.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-blue-400 mb-2 flex items-center gap-2">
                      <Code className="w-4 h-4" />
                      Data
                    </h3>
                    <div className="space-y-1">
                      {dataLanguages.map(([key, lang]) => (
                        <button
                          key={key}
                          onClick={() => setSelectedLanguage(key)}
                          className={`w-full text-left p-2 rounded-lg transition-colors flex items-center gap-2 ${
                            selectedLanguage === key
                              ? 'bg-blue-600 text-white'
                              : theme === 'vs-dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                          }`}
                        >
                          {lang.icon}
                          {lang.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Monaco Editor */}
          <div className={`${isFullscreen ? 'col-span-1' : 'lg:col-span-3'} space-y-6`}>
            <div className={`${theme === 'vs-dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-lg overflow-hidden`}>
              <div className="flex items-center justify-between p-4 border-b border-gray-700">
                <div className="flex items-center gap-2">
                  {languages[selectedLanguage]?.icon}
                  <h2 className="text-lg font-semibold">{languages[selectedLanguage]?.name}</h2>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    languages[selectedLanguage]?.category === 'Client-side' 
                      ? 'bg-green-100 text-green-800' 
                      : languages[selectedLanguage]?.category === 'Server-side'
                      ? 'bg-purple-100 text-purple-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {languages[selectedLanguage]?.category}
                  </span>
                  <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                    Monaco Editor
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={toggleFullscreen}
                    className="p-2 rounded-lg hover:bg-gray-700 transition-colors"
                    title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
                  >
                    {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={copyCode}
                    className="p-2 rounded-lg hover:bg-gray-700 transition-colors"
                    title="Copy All Code"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    onClick={copySelectedText}
                    className="p-2 rounded-lg hover:bg-gray-700 transition-colors"
                    title="Copy Selected Text"
                  >
                    <Copy className="w-4 h-4" />
                    <span className="text-xs ml-1">Sel</span>
                  </button>
                  <button
                    onClick={downloadCode}
                    className="p-2 rounded-lg hover:bg-gray-700 transition-colors"
                    title="Download Code"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <button
                    onClick={runCode}
                    disabled={isRunning}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    <Play className="w-4 h-4" />
                    {isRunning ? 'Running...' : 'Run'}
                  </button>
                </div>
              </div>
              <div className="relative">
                <Editor
                  height={isFullscreen ? 'calc(100vh - 200px)' : '400px'}
                  language={languages[selectedLanguage]?.monacoLang || 'javascript'}
                  value={code}
                  theme={theme}
                  onChange={(value) => setCode(value || '')}
                  onMount={(editor, monaco) => {
                    editorRef.current = editor;
                    
                    // Track text selection
                    editor.onDidChangeCursorSelection(() => {
                      const selection = editor.getSelection();
                      const selectedText = editor.getModel().getValueInRange(selection);
                      setSelectedText(selectedText);
                    });
                  }}
                  options={{
                    fontSize: 14,
                    minimap: { enabled: true },
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    wordWrap: 'on',
                    lineNumbers: 'on',
                    renderWhitespace: 'selection',
                    contextmenu: true,
                    folding: true,
                    foldingStrategy: 'auto',
                    showFoldingControls: 'always',
                    unfoldOnClickAfterEndOfLine: false,
                    fixedOverflowWidgets: true
                  }}
                />
              </div>
            </div>

            {/* API Actions for Selected Text */}
            {selectedText && (
              <div className={`${theme === 'vs-dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-lg p-4`}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold">🎯 Selected Text Actions</h3>
                  <span className="text-sm text-gray-500">
                    {selectedText.split('\n').length} lines, {selectedText.length} chars
                  </span>
                </div>
                <div className="flex flex-wrap gap-2 mb-3">
                  <button
                    onClick={() => makeApiCall('analyze')}
                    disabled={isApiLoading}
                    className="flex items-center gap-2 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                  >
                    🔍 Analyze Code
                  </button>
                  <button
                    onClick={() => makeApiCall('explain')}
                    disabled={isApiLoading}
                    className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    📖 Explain Code
                  </button>
                  <button
                    onClick={() => makeApiCall('optimize')}
                    disabled={isApiLoading}
                    className="flex items-center gap-2 px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50"
                  >
                    ⚡ Optimize
                  </button>
                  <button
                    onClick={() => makeApiCall('debug')}
                    disabled={isApiLoading}
                    className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                  >
                    🐛 Debug Help
                  </button>
                </div>
                {isApiLoading && (
                  <div className="flex items-center gap-2 text-blue-500">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                    <span className="text-sm">Making API call...</span>
                  </div>
                )}
                <div className="text-xs text-gray-500 bg-gray-100 rounded p-2 max-h-20 overflow-y-auto">
                  <strong>Selected:</strong> {selectedText.substring(0, 150)}{selectedText.length > 150 ? '...' : ''}
                </div>
              </div>
            )}

            {/* Output */}
            <div className={`${theme === 'vs-dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-lg`}>
              <div className="p-4 border-b border-gray-700">
                <h2 className="text-lg font-semibold">Output</h2>
              </div>
              <div className="p-4">
                <pre className={`font-mono text-sm ${
                  theme === 'vs-dark' ? 'text-gray-300' : 'text-gray-700'
                } whitespace-pre-wrap`}>
                  {output || 'Click "Run" to execute your code and see output here...'}
                </pre>
              </div>
            </div>

            {/* API Response */}
            {apiResponse && (
              <div className={`${theme === 'vs-dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-lg`}>
                <div className="p-4 border-b border-gray-700">
                  <h2 className="text-lg font-semibold">📡 API Response</h2>
                </div>
                <div className="p-4">
                  <pre className={`font-mono text-xs ${
                    theme === 'vs-dark' ? 'text-gray-300' : 'text-gray-700'
                  } whitespace-pre-wrap bg-gray-100 p-3 rounded border max-h-40 overflow-y-auto`}>
                    {apiResponse}
                  </pre>
                </div>
              </div>
            )}

          
          </div>
        </div>
      </div>
    </div>
  );
};

export default MonacoCodeCompiler;