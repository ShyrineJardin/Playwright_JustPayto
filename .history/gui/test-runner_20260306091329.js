#!/usr/bin/env node
const express = require('express');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');
const app = express();

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

let currentTestRun = null;

// Get all available tests from all test directories
app.get('/api/tests', (req, res) => {
  const testType = req.query.type || 'e2e'; 
  const typeMap = {
    'e2e': 'e2e_tests',
    'integration': 'intergration_tests',
    'unit': 'unit_tests'
  };
  
  const testDir = path.join(__dirname, '..', typeMap[testType]);
  const tests = [];

  if (!fs.existsSync(testDir)) {
    return res.json([]);
  }

  function walkDir(dir, prefix = '') {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        walkDir(fullPath, prefix ? `${prefix}/${file}` : file);
      } else if (file.endsWith('.spec.js')) {
        // Store relative path from test directory
        const relativePath = path.relative(testDir, fullPath).replace(/\\/g, '/');
        tests.push({
          name: prefix ? `${prefix}/${file.replace('.spec.js', '')}` : file.replace('.spec.js', ''),
          path: `${typeMap[testType]}/${relativePath}`,
          displayName: file.replace('.spec.js', ''),
          type: testType
        });
      }
    });
  }

  walkDir(testDir);
  res.json(tests);
});

// Check if ZAP is reachable
app.get('/api/zap-status', (req, res) => {
  const net = require('net');
  const host = req.query.host || 'localhost';
  const port = parseInt(req.query.port) || 8080;

  const socket = new net.Socket();
  let resolved = false;

  socket.setTimeout(3000);

  socket.connect(port, host, () => {
    if (!resolved) {
      resolved = true;
      socket.destroy();
      res.json({ reachable: true, host, port });
    }
  });

  socket.on('error', (err) => {
    if (!resolved) {
      resolved = true;
      socket.destroy();
      res.json({ reachable: false, host, port, message: `ZAP not reachable at ${host}:${port}. Make sure ZAP is open.` });
    }
  });

  socket.on('timeout', () => {
    if (!resolved) {
      resolved = true;
      socket.destroy();
      res.json({ reachable: false, host, port, message: `Connection timed out at ${host}:${port}.` });
    }
  });
});

// Run a specific test
app.post('/api/run-test', (req, res) => {
  const { 
    testPath, 
    browser = 'chromium-desktop', 
    device = 'desktop', 
    headed = true,
    zapEnabled = false,
    zapHost = 'localhost',
    zapPort = 8080
  } = req.body;

  if (currentTestRun) {
    return res.json({ 
      success: false, 
      message: 'A test is already running. Please wait for it to complete.' 
    });
  }

  // Clean the testPath - it comes with forward slashes from the frontend
  const cleanPath = testPath.startsWith('/') ? testPath.substring(1) : testPath;
  const testFile = path.join(__dirname, '..', cleanPath);

  if (!fs.existsSync(testFile)) {
    return res.json({ 
      success: false, 
      message: `Test file not found: ${testFile}` 
    });
  }

  // Build environment variables, injecting ZAP proxy if enabled
  const envVars = { ...process.env };
  if (zapEnabled) {
    envVars.ZAP_ENABLED = 'true';
    envVars.ZAP_HOST = zapHost;
    envVars.ZAP_PORT = String(zapPort);
    // Set proxy env vars that Playwright/Node recognizes
    envVars.HTTP_PROXY = `http://${zapHost}:${zapPort}`;
    envVars.HTTPS_PROXY = `http://${zapHost}:${zapPort}`;
  } else {
    envVars.ZAP_ENABLED = 'false';
    delete envVars.HTTP_PROXY;
    delete envVars.HTTPS_PROXY;
  }

  const stdio = headed ? ['inherit', 'pipe', 'pipe'] : 'pipe';

  currentTestRun = {
    process: spawn('powershell', ['-Command', `npx playwright test ${cleanPath} --project=${browser} ${headed ? '--headed' : ''}`], {
      cwd: path.join(__dirname, '..'),
      stdio: stdio,
      shell: true,
      detached: false,
      env: envVars
    }),
    output: zapEnabled ? `🛡️ ZAP Security Proxy ENABLED (${zapHost}:${zapPort})\n📡 All browser traffic will be intercepted by ZAP\n${'─'.repeat(60)}\n\n` : '',
    startTime: new Date(),
    testFile: cleanPath,
    headed: headed,
    device: device,
    zapEnabled: zapEnabled
  };

  // Capture output from both stdout and stderr
  if (currentTestRun.process.stdout) {
    currentTestRun.process.stdout.on('data', (data) => {
      currentTestRun.output += data.toString();
    });
  }

  if (currentTestRun.process.stderr) {
    currentTestRun.process.stderr.on('data', (data) => {
      currentTestRun.output += data.toString();
    });
  }

  currentTestRun.process.on('close', (code) => {
    currentTestRun.exitCode = code;
    currentTestRun.endTime = new Date();
    
    if (headed && currentTestRun.output === '🌐 Browser window should be opening...\n\n📌 The test is running in headed mode - watch the browser window\n\nTest will continue in the background. You can close the browser when done.') {
      currentTestRun.output += `\n\n✅ Test completed with exit code: ${code}`;
    }

    if (zapEnabled) {
      currentTestRun.output += `\n\n🛡️ ZAP scan complete. Check ZAP dashboard at http://${zapHost}:${zapPort} for security findings.`;
    }
  });

  res.json({ 
    success: true, 
    message: `Test started: ${testPath}`,
    testFile: testPath,
    zapEnabled
  });
});

// Get test status
app.get('/api/test-status', (req, res) => {
  if (!currentTestRun) {
    return res.json({ 
      status: 'idle',
      message: 'No test running'
    });
  }

  const isRunning = !currentTestRun.exitCode && currentTestRun.exitCode !== 0;

  res.json({
    status: isRunning ? 'running' : 'completed',
    message: currentTestRun.testFile,
    output: currentTestRun.output,
    exitCode: currentTestRun.exitCode,
    duration: currentTestRun.endTime 
      ? Math.round((currentTestRun.endTime - currentTestRun.startTime) / 1000) + 's'
      : 'in progress...',
    startTime: currentTestRun.startTime
  });
});

// Stop running test
app.post('/api/stop-test', (req, res) => {
  if (currentTestRun && currentTestRun.process) {
    currentTestRun.process.kill();
    res.json({ success: true, message: 'Test stopped' });
  } else {
    res.json({ success: false, message: 'No test is running' });
  }
});

// Clear test history
app.post('/api/clear-test', (req, res) => {
  currentTestRun = null;
  res.json({ success: true, message: 'Test history cleared' });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`\n`);
  console.log(`╔════════════════════════════════════════╗`);
  console.log(`║   Playwright Test Runner GUI Ready!    ║`);
  console.log(`║                                        ║`);
  console.log(`║   🌐 Open your browser:                ║`);
  console.log(`║   http://localhost:${PORT}                ║`);
  console.log(`║                                        ║`);
  console.log(`║   Close this window to stop server     ║`);
  console.log(`╚════════════════════════════════════════╝`);
  console.log(`\n`);
});

// Auto-open browser on Windows
if (process.platform === 'win32') {
  setTimeout(() => {
    require('child_process').exec(`start http://localhost:${PORT}`);
  }, 1000);
}