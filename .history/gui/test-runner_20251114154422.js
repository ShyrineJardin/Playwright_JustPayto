#!/usr/bin/env node

/**
 * Playwright Test Runner GUI
 * Non-technical QA staff can use this to run tests via a web interface
 */

const express = require('express');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');
const app = express();

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

let currentTestRun = null;

// Get all available tests
app.get('/api/tests', (req, res) => {
  const testDir = path.join(__dirname, '..', 'e2e_tests');
  const tests = [];

  function walkDir(dir, prefix = '') {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        walkDir(fullPath, prefix ? `${prefix}/${file}` : file);
      } else if (file.endsWith('.spec.js')) {
        // Store relative path from e2e_tests directory
        const relativePath = path.relative(testDir, fullPath).replace(/\\/g, '/');
        tests.push({
          name: prefix ? `${prefix}/${file.replace('.spec.js', '')}` : file.replace('.spec.js', ''),
          path: `e2e_tests/${relativePath}`,
          displayName: file.replace('.spec.js', '')
        });
      }
    });
  }

  walkDir(testDir);
  res.json(tests);
});

// Run a specific test
app.post('/api/run-test', (req, res) => {
  const { testPath, browser = 'chromium', headed = true } = req.body;

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

  // For headed mode, spawn in a way that displays the browser
  // For headless, capture output
  // In both cases, we want to capture output for the GUI to display
  const stdio = headed ? ['inherit', 'pipe', 'pipe'] : 'pipe';

  currentTestRun = {
    process: spawn('powershell', ['-Command', `npx playwright test ${cleanPath} --project=${browser} ${headed ? '--headed' : ''}`], {
      cwd: path.join(__dirname, '..'),
      stdio: stdio,
      shell: true,
      detached: false,
      env: { ...process.env }  // Pass all environment variables to child process
    }),
    output: '',
    startTime: new Date(),
    testFile: cleanPath,
    headed: headed
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
  });

  res.json({ 
    success: true, 
    message: `Test started: ${testPath}`,
    testFile: testPath
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
  console.log(`║   🌐 Open your browser:               ║`);
  console.log(`║   http://localhost:${PORT}                   ║`);
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
