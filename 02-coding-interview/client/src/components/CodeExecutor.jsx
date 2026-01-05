import React, { useState, useEffect } from 'react';

function CodeExecutor({ code, language }) {
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [pyodide, setPyodide] = useState(null);

  // Load Pyodide on component mount
  useEffect(() => {
    const loadPyodide = async () => {
      try {
        const pyodideModule = await window.loadPyodide({
          indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/'
        });
        setPyodide(pyodideModule);
        console.log('Pyodide loaded successfully');
      } catch (error) {
        console.error('Failed to load Pyodide:', error);
      }
    };

    loadPyodide();
  }, []);

  const executeCode = async () => {
    setLoading(true);
    setOutput('');

    try {
      if (language === 'javascript') {
        // Execute JavaScript with better output capturing
        const logs = [];
        
        // Create a custom console that captures logs
        const customConsole = {
          log: (...args) => {
            logs.push(args.map(arg => {
              if (typeof arg === 'object') {
                return JSON.stringify(arg, null, 2);
              }
              return String(arg);
            }).join(' '));
          },
          error: (...args) => {
            logs.push('ERROR: ' + args.join(' '));
          }
        };

        try {
          // Create a function with custom console
          const func = new Function('console', code);
          func(customConsole);
          
          if (logs.length > 0) {
            setOutput(logs.join('\n'));
          } else {
            setOutput('Code executed successfully (no console output)');
          }
        } catch (error) {
          setOutput(`Error: ${error.message}\n\nStack:\n${error.stack}`);
        }
      } else if (language === 'python') {
        // Execute Python using Pyodide
        if (!pyodide) {
          setOutput('⏳ Python runtime is still loading... Please wait and try again.');
          setLoading(false);
          return;
        }

        try {
          // Capture stdout
          const result = await pyodide.runPythonAsync(`
import sys
from io import StringIO

# Capture stdout
old_stdout = sys.stdout
sys.stdout = StringIO()

try:
    # Execute user code
${code.split('\n').map(line => '    ' + line).join('\n')}
    
    # Get the output
    output = sys.stdout.getvalue()
finally:
    # Restore stdout
    sys.stdout = old_stdout

output
          `);

          if (result && result.trim()) {
            setOutput(result);
          } else {
            setOutput('Code executed successfully (no output)');
          }
        } catch (error) {
          setOutput(`Python Error: ${error.message}`);
        }
      }
    } catch (error) {
      setOutput(`Execution error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h3 style={styles.title}>Output</h3>
        <button 
          onClick={executeCode} 
          disabled={loading || (language === 'python' && !pyodide)}
          style={{
            ...styles.runButton,
            opacity: (loading || (language === 'python' && !pyodide)) ? 0.5 : 1
          }}
        >
          {loading ? '⏳ Running...' : 
           (language === 'python' && !pyodide) ? '⏳ Loading Python...' : 
           '▶️ Run Code'}
        </button>
      </div>
      <pre style={styles.output}>
        {output || 'Click "Run Code" to execute your code...\n\n' + 
         (language === 'python' && !pyodide ? '⏳ Python runtime is loading...' : 
          'Ready to run ' + language + ' code!')}
      </pre>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    background: '#1e1e1e',
    borderLeft: '1px solid #3e3e42'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 16px',
    background: '#2d2d30',
    borderBottom: '1px solid #3e3e42'
  },
  title: {
    margin: 0,
    fontSize: '14px',
    fontWeight: '600',
    color: '#ccc'
  },
  runButton: {
    padding: '6px 12px',
    background: '#4caf50',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '500',
    transition: 'opacity 0.2s'
  },
  output: {
    flex: 1,
    margin: 0,
    padding: '16px',
    color: '#d4d4d4',
    fontFamily: 'Consolas, Monaco, monospace',
    fontSize: '13px',
    overflow: 'auto',
    whiteSpace: 'pre-wrap',
    lineHeight: '1.5'
  }
};

export default CodeExecutor;