const WebSocket = require('ws');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const wss = new WebSocket.Server({ port: 8080 });
console.log('🚀 LSP Bridge server starting on port 8080...');

let messageId = 0;

wss.on('connection', (ws) => {
  console.log('✅ Client connected to LSP bridge');
  
  const jdtLsPath = path.join(__dirname, 'public', 'jdt-language-server');
  const pluginsDir = path.join(jdtLsPath, 'plugins');
  
  if (!fs.existsSync(pluginsDir)) {
    console.error('❌ JDT Language Server not found at:', jdtLsPath);
    ws.close();
    return;
  }
  
  const launcherJar = fs.readdirSync(pluginsDir)
    .find(file => file.startsWith('org.eclipse.equinox.launcher_'));
  
  if (!launcherJar) {
    console.error('❌ Launcher JAR not found in plugins directory');
    ws.close();
    return;
  }
  
  const jarPath = path.join(pluginsDir, launcherJar);
  
  let configDir;
  if (process.platform === 'win32') {
    configDir = path.join(jdtLsPath, 'config_win');
  } else if (process.platform === 'darwin') {
    configDir = path.join(jdtLsPath, 'config_mac');
  } else {
    configDir = path.join(jdtLsPath, 'config_linux');
  }
  
  console.log('🔧 Starting JDT Language Server...');
  console.log('JAR:', jarPath);
  console.log('Config:', configDir);
  console.log('Workspace:', path.join(__dirname, 'public', 'workspace'));
  
  const javaArgs = [
    '-Declipse.application=org.eclipse.jdt.ls.core.id1',
    '-Dosgi.bundles.defaultStartLevel=4',
    '-Declipse.product=org.eclipse.jdt.ls.core.product',
    '-Dlog.level=ALL',
    '-noverify',
    '-Xmx2G',
    '-jar', jarPath,
    '-configuration', configDir,
    '-data', path.join(__dirname, 'public', 'workspace')
  ];
  
  const jdtProcess = spawn('java', javaArgs, {
    stdio: ['pipe', 'pipe', 'pipe']
  });
  
  let isJdtReady = false;
  
  jdtProcess.on('error', (err) => {
    console.error('❌ Failed to start JDT process:', err);
    ws.close();
  });
  
  // Handle WebSocket messages (Client -> JDT LS)
  ws.on('message', (data) => {
    const message = data.toString();
    messageId++;
    
    console.log(`\n📤 [${messageId}] Client -> JDT LS:`);
    
    try {
      const jsonMessage = JSON.parse(message);
      console.log('Method:', jsonMessage.method || 'N/A');
      console.log('ID:', jsonMessage.id || 'N/A');
      if (jsonMessage.params) {
        console.log('Params:', JSON.stringify(jsonMessage.params).substring(0, 200) + '...');
      }
    } catch (e) {
      console.log('Raw message:', message.substring(0, 200) + '...');
    }
    
    if (isJdtReady) {
      jdtProcess.stdin.write(message);
    } else {
      console.log('⚠️ JDT not ready yet, queuing message...');
    }
  });
  
  // Handle JDT LS output (JDT LS -> Client)
  jdtProcess.stdout.on('data', (data) => {
    const message = data.toString();
    
    console.log(`\n📥 JDT LS -> Client:`);
    
    try {
      // LSP messages are separated by Content-Length headers
      const lines = message.split('\n');
      for (const line of lines) {
        if (line.trim().startsWith('{')) {
          const jsonMessage = JSON.parse(line.trim());
          console.log('Method:', jsonMessage.method || 'Response');
          console.log('ID:', jsonMessage.id || 'N/A');
          
          // Check for initialization complete
          if (jsonMessage.method === 'window/logMessage' && 
              jsonMessage.params && 
              jsonMessage.params.message.includes('>> initialize')) {
            console.log('🎉 JDT Language Server initialized!');
            isJdtReady = true;
          }
          
          // Log completion responses
          if (jsonMessage.result && jsonMessage.result.items) {
            console.log(`Found ${jsonMessage.result.items.length} completion items`);
          }
        }
      }
    } catch (e) {
      console.log('Raw output:', message.substring(0, 200) + '...');
    }
    
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(message);
    }
  });
  
  jdtProcess.stderr.on('data', (data) => {
    const error = data.toString();
    console.error('🔴 JDT LS Error:', error);
    
    // Check for common issues
    if (error.includes('ClassNotFoundException')) {
      console.error('💡 Tip: JDT LS might be corrupted. Try re-downloading it.');
    }
    if (error.includes('java.nio.file.AccessDeniedException')) {
      console.error('💡 Tip: Check workspace folder permissions.');
    }
  });
  
  // Cleanup
  ws.on('close', () => {
    console.log('❌ Client disconnected');
    jdtProcess.kill('SIGTERM');
  });
  
  jdtProcess.on('exit', (code) => {
    console.log(`🔴 JDT Language Server exited with code: ${code}`);
    if (code !== 0) {
      console.error('💡 Tip: Check Java version (needs Java 11+) and JDT LS installation');
    }
  });
});

console.log('🎯 LSP Bridge ready. Connect from http://localhost:3000');