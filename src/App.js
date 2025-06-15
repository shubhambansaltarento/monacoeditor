import logo from './logo.svg';
import './App.css';
import Newtest from './Newtest';
import MonacoCodeCompiler from './MonacoCodeCompiler';
import StableMonacoEditor from './MonacoJavaEditor';
import CodeEditor from './Neweditor';
// import DynamicLanguageEditor from './DynamicLanguageEditor';
// import DynamicLanguageEditor from './Test';
import DynamicLanguageEditor from './Test2';



function App() {
  return (
    <div className="App">
      {/* <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header> */}
      <DynamicLanguageEditor />
   {/* <CodeEditor /> */}
   {/* <MonacoCodeCompiler /> */}
   {/* <TestCodeCompler /> */}
   {/* <Newtest /> */}
    </div>
  );
}

export default App;
