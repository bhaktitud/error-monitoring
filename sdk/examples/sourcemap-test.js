// Script manual untuk menguji integrasi source map
const { 
  init, 
  captureException, 
  transformStackTrace, 
  uploadSourceMap 
} = require('../dist/index.js');

// Inisialisasi SDK dengan sourcemap enabled
init({
  dsn: 'test-dsn',
  apiUrl: 'http://localhost:3000',
  environment: 'development',
  release: '1.0.0',
  sdk: {
    useSourceMaps: true
  }
});

// Fungsi yang mensimulasikan error dengan stack trace
async function testSourceMapTransform() {
  console.log('= Testing Source Map Transform =');
  
  // Stack trace buatan
  const fakeStackTrace = `Error: Test error
    at functionA (http://localhost:3000/app.js:10:15)
    at functionB (http://localhost:3000/app.js:20:10)
    at Object.<anonymous> (http://localhost:3000/app.js:30:5)`;
    
  console.log('Original stack trace:');
  console.log(fakeStackTrace);
  
  // Gunakan transformStackTrace langsung
  try {
    console.log('\nTransformed stack trace:');
    const transformed = await transformStackTrace(fakeStackTrace);
    console.log(transformed);
  } catch (err) {
    console.error('Error during transform:', err);
  }
}

// Fungsi untuk menguji upload source map
async function testSourceMapUpload() {
  console.log('\n= Testing Source Map Upload =');
  
  const fakeSourceMap = {
    version: 3,
    sources: ['original.js'],
    names: ['functionA', 'functionB'],
    mappings: 'AAAA,SAASA,SAAQ;QACbC;' // Mappings bohongan
  };
  
  try {
    const result = await uploadSourceMap({
      dsn: 'test-dsn',
      release: '1.0.0',
      sourceMap: fakeSourceMap,
      sourceFile: 'app.js'
    });
    
    console.log('Source map upload result:', result);
  } catch (err) {
    console.error('Error during source map upload:', err);
  }
}

// Fungsi untuk menguji capture exception dengan source map
async function testCaptureWithSourceMap() {
  console.log('\n= Testing Exception Capture with Source Map =');
  
  try {
    // Buat error dengan stack trace buatan
    const error = new Error('Test error with source map');
    error.stack = `Error: Test error with source map
    at functionA (http://localhost:3000/app.js:10:15)
    at functionB (http://localhost:3000/app.js:20:10)
    at Object.<anonymous> (http://localhost:3000/app.js:30:5)`;
    
    // Capture error
    await captureException(error);
    console.log('Exception captured with source map');
  } catch (err) {
    console.error('Error during exception capture:', err);
  }
}

// Jalankan semua test
async function runTests() {
  try {
    await testSourceMapTransform();
    await testSourceMapUpload();
    await testCaptureWithSourceMap();
    console.log('\n= All tests completed =');
  } catch (err) {
    console.error('Test execution failed:', err);
  }
}

runTests(); 