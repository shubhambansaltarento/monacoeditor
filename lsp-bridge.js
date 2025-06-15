const WebSocket = require('ws');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const PORT = 8080;
const wss = new WebSocket.Server({ port: PORT });

console.log('🚀 LSP Bridge server starting on port', PORT);
console.log('📁 Working directory:', __dirname);

// Global error handling
process.on('uncaughtException', (error) => {
  console.error('🔥 Uncaught Exception:', error.message);
  console.error('Stack:', error.stack);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('🔥 Unhandled Rejection at:', promise, 'reason:', reason);
});

function findJDTLauncher() {
  const jdtLsPath = path.join(__dirname, 'public', 'jdt-language-server');
  const pluginsDir = path.join(jdtLsPath, 'plugins');
  
  console.log('🔍 Looking for JDT LS at:', jdtLsPath);
  
  if (!fs.existsSync(jdtLsPath)) {
    console.error('❌ JDT Language Server directory not found:', jdtLsPath);
    return null;
  }
  
  if (!fs.existsSync(pluginsDir)) {
    console.error('❌ Plugins directory not found:', pluginsDir);
    return null;
  }
  
  const files = fs.readdirSync(pluginsDir);
  console.log('📂 Files in plugins directory:', files.slice(0, 5)); // Show first 5 files
  
  const launcherJar = files.find(file => file.startsWith('org.eclipse.equinox.launcher_'));
  
  if (!launcherJar) {
    console.error('❌ Launcher JAR not found in plugins directory');
    console.error('💡 Expected file starting with: org.eclipse.equinox.launcher_');
    return null;
  }
  
  const jarPath = path.join(pluginsDir, launcherJar);
  console.log('✅ Found launcher JAR:', jarPath);
  
  return { jdtLsPath, jarPath };
}

function getConfigDir(jdtLsPath) {
  let configDir;
  if (process.platform === 'win32') {
    configDir = path.join(jdtLsPath, 'config_win');
  } else if (process.platform === 'darwin') {
    configDir = path.join(jdtLsPath, 'config_mac');
  } else {
    configDir = path.join(jdtLsPath, 'config_linux');
  }
  
  console.log('🔧 Config directory:', configDir);
  
  if (!fs.existsSync(configDir)) {
    console.error('❌ Config directory not found:', configDir);
    return null;
  }
  
  return configDir;
}

function createWorkspace() {
  const workspacePath = path.join(__dirname, 'public', 'workspace');
  
  if (!fs.existsSync(workspacePath)) {
    try {
      fs.mkdirSync(workspacePath, { recursive: true });
      console.log('📁 Created workspace directory:', workspacePath);
    } catch (error) {
      console.error('❌ Failed to create workspace:', error.message);
      return null;
    }
  } else {
    console.log('📁 Using existing workspace:', workspacePath);
  }
  
  return workspacePath;
}

// Pre-validate setup before starting server
const jdtSetup = findJDTLauncher();
if (!jdtSetup) {
  console.error('💥 JDT Language Server setup failed. Please check installation.');
  process.exit(1);
}

const configDir = getConfigDir(jdtSetup.jdtLsPath);
if (!configDir) {
  console.error('💥 Config directory setup failed.');
  process.exit(1);
}

const workspacePath = createWorkspace();
if (!workspacePath) {
  console.error('💥 Workspace setup failed.');
  process.exit(1);
}

console.log('✅ Pre-validation complete. Ready for connections.');

wss.on('connection', (ws, req) => {
  const clientId = Math.random().toString(36).substr(2, 9);
  console.log(`\n🌟 New client connected [${clientId}] from ${req.socket.remoteAddress}`);
  
  let jdtProcess = null;
  let isJdtStarting = false;
  
  // Enhanced message handling with error protection
  function safeLog(message, ...args) {
    try {
      console.log(`[${clientId}] ${message}`, ...args);
    } catch (e) {
      console.log(`[${clientId}] ${message}`);
    }
  }
  
  function startJDTLS() {
    if (isJdtStarting) {
      safeLog('⚠️ JDT LS already starting, please wait...');
      return;
    }
    
    isJdtStarting = true;
    safeLog('🔧 Starting JDT Language Server...');
    
    const javaArgs = [
      '-Declipse.application=org.eclipse.jdt.ls.core.id1',
      '-Dosgi.bundles.defaultStartLevel=4',
      '-Declipse.product=org.eclipse.jdt.ls.core.product',
      '-Dlog.level=ALL',
      '-noverify',
      '-Xmx1G', // Reduced memory to prevent crashes
      '-jar', jdtSetup.jarPath,
      '-configuration', configDir,
      '-data', workspacePath
    ];
    
    safeLog('🔧 Java command:', 'java', javaArgs.join(' '));
    
    try {
      jdtProcess = spawn('java', javaArgs, {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { ...process.env }
      });
      
      safeLog('✅ JDT process spawned with PID:', jdtProcess.pid);
      
    } catch (error) {
      safeLog('❌ Failed to spawn JDT process:', error.message);
      isJdtStarting = false;
      ws.send(JSON.stringify({ error: 'Failed to start JDT Language Server', details: error.message }));
      return;
    }
    
    // Handle JDT process events
    jdtProcess.on('error', (err) => {
      safeLog('❌ JDT process error:', err.message);
      isJdtStarting = false;
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ error: 'JDT process error', details: err.message }));
      }
    });
    
    jdtProcess.on('spawn', () => {
      safeLog('🎉 JDT process spawned successfully');
      isJdtStarting = false;
    });
    
    jdtProcess.on('exit', (code, signal) => {
      safeLog(`🔴 JDT process exited with code: ${code}, signal: ${signal}`);
      isJdtStarting = false;
      
      if (code !== 0) {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ error: 'JDT Language Server crashed', code, signal }));
        }
      }
    });
    
    // Handle stdout (JDT LS -> Client)
    jdtProcess.stdout.on('data', (data) => {
      try {
        const message = data.toString();
        
        // Basic validation of LSP message
        if (message.includes('Content-Length:') || message.startsWith('{')) {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(message);
          }
        }
        
        // Log initialization progress
        if (message.includes('>> initialize') || message.includes('Initialized')) {
          safeLog('🎯 JDT LS initialized successfully');
        }
        
      } catch (error) {
        safeLog('❌ Error processing JDT stdout:', error.message);
      }
    });
    
    // Handle stderr (Errors)
    jdtProcess.stderr.on('data', (data) => {
      const error = data.toString();
      safeLog('🔴 JDT LS stderr:', error.substring(0, 200));
      
      // Check for common issues and provide hints
      if (error.includes('java.lang.OutOfMemoryError')) {
        safeLog('💡 Hint: Try reducing JVM memory (-Xmx1G -> -Xmx512m)');
      }
      if (error.includes('java.nio.file.AccessDeniedException')) {
        safeLog('💡 Hint: Check workspace directory permissions');
      }
      if (error.includes('ClassNotFoundException')) {
        safeLog('💡 Hint: JDT LS installation might be corrupted');
      }
    });
  }
  
  // Handle WebSocket messages (Client -> JDT LS)
  ws.on('message', (data) => {
    try {
      const message = data.toString();
      
      // Start JDT LS on first message if not already running
      if (!jdtProcess && !isJdtStarting) {
        startJDTLS();
        
        // Queue the message for when JDT starts
        setTimeout(() => {
          if (jdtProcess && jdtProcess.stdin && jdtProcess.stdin.writable) {
            jdtProcess.stdin.write(message);
          }
        }, 2000);
        
        return;
      }
      
      // Forward message to JDT LS if it's ready
      if (jdtProcess && jdtProcess.stdin && jdtProcess.stdin.writable) {
        jdtProcess.stdin.write(message);
      } else {
        safeLog('⚠️ JDT process not ready to receive messages');
      }
      
    } catch (error) {
      safeLog('❌ Error handling WebSocket message:', error.message);
    }
  });
  
  // Handle WebSocket close
  ws.on('close', (code, reason) => {
    safeLog(`❌ Client disconnected [code: ${code}]`);
    
    // Clean shutdown of JDT process
    if (jdtProcess) {
      safeLog('🧹 Cleaning up JDT process...');
      try {
        jdtProcess.kill('SIGTERM');
        
        // Force kill after 5 seconds
        setTimeout(() => {
          if (jdtProcess && !jdtProcess.killed) {
            safeLog('🔨 Force killing JDT process...');
            jdtProcess.kill('SIGKILL');
          }
        }, 5000);
        
      } catch (error) {
        safeLog('❌ Error killing JDT process:', error.message);
      }
    }
  });
  
  // Handle WebSocket errors
  ws.on('error', (error) => {
    safeLog('❌ WebSocket error:', error.message);
  });
  
  // Send initial status
  try {
    ws.send(JSON.stringify({ 
      status: 'connected', 
      message: 'LSP Bridge ready',
      clientId: clientId
    }));
  } catch (error) {
    safeLog('❌ Failed to send initial status:', error.message);
  }
});

wss.on('error', (error) => {
  console.error('🔥 WebSocket Server error:', error);
});

console.log(`🎯 LSP Bridge ready at ws://localhost:${PORT}`);
console.log('📝 Waiting for Monaco Editor to connect...');
console.log('🔍 To test: Open http://localhost:3000 in your browser');

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down LSP Bridge...');
  wss.close(() => {
    console.log('✅ WebSocket server closed');
    process.exit(0);
  });
});