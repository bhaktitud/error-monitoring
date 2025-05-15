"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
var _express = _interopRequireDefault(require("express"));
var _sdk = require("@lograven/sdk");
// Initialize LogRaven
console.log("Initializing LogRaven...");
(0, _sdk.init)({
  dsn: '6369f64f-261b-4b3e-bd7c-309127deaf3a',
  environment: 'development',
  release: 'example-0.1.0',
  apiUrl: 'http://localhost:3000'
});

// Create Express app
console.log("Creating Express application...");
const app = (0, _express.default)();
app.use(_express.default.json());

// Debug middleware
app.use((req, res, next) => {
  console.log(`[DEBUG] Received ${req.method} request to ${req.path}`);
  next();
});

// Add LogRaven request tracker
console.log("Adding LogRaven request tracker...");
app.use((0, _sdk.logRavenRequestTracker)());

// Define routes
console.log("Defining routes...");

// Home route
app.get('/', (req, res) => {
  console.log("[DEBUG] Home route handler executed");
  res.send('LogRaven Express Example - Home');
});

// Error route with try/catch
app.get('/error', (req, res) => {
  console.log("[DEBUG] Error route handler executed");
  try {
    throw new Error('Contoh error dengan try/catch di Express');
  } catch (error) {
    console.log("[DEBUG] Caught error:", error.message);
    (0, _sdk.captureException)(error);
    res.status(500).send('Error ditangkap: ' + error.message);
  }
});

// Error route without try/catch (should be handled by middleware)
app.get('/uncaught', (req, res) => {
  console.log("[DEBUG] Uncaught error route handler executed");
  // This error should be caught by the LogRaven error handler
  throw new Error('Contoh error tanpa try/catch di Express');
});

// Test route
app.get('/test', (req, res) => {
  console.log("[DEBUG] Test route handler executed");
  res.send('Test route is working properly');
});

// Add LogRaven error handler
console.log("Adding LogRaven error handler...");
app.use((0, _sdk.logRavenErrorHandler)());

// Generic error handler (should be after LogRaven's)
app.use((err, req, res, next) => {
  console.log("[DEBUG] Express generic error handler executed:", err.message);
  res.status(500).send('Server error: ' + err.message);
});

// Start server
const server = app.listen(5555, () => {
  console.log('---------------------------------------');
  console.log('Server is running on http://localhost:5555');
  console.log('Available routes:');
  console.log('- GET / - Home page');
  console.log('- GET /test - Test route');
  console.log('- GET /error - Error with try/catch');
  console.log('- GET /uncaught - Uncaught error (middleware)');
  console.log('---------------------------------------');
});
//# sourceMappingURL=index.js.map