/**
 * Modul generator error untuk pengujian
 * File ini akan digunakan untuk generate error dan test source map
 */

/**
 * Fungsi untuk menghasilkan error berdasarkan tipe yang ditentukan
 * @param {string} errorType - Tipe error yang ingin dihasilkan
 */
function generateTestError(errorType) {
  switch (errorType) {
    case 'reference':
      // ReferenceError: mencoba mengakses variabel yang tidak ada
      return generateReferenceError();

    case 'type':
      // TypeError: mencoba mengakses properti dari null
      return generateTypeError();

    case 'range':
      // RangeError: mencoba membuat array dengan ukuran negatif
      return generateRangeError();

    case 'syntax':
      // SyntaxError: mencoba mengevaluasi kode dengan sintaks tidak valid
      return generateSyntaxError();

    case 'deep':
      // Error nested: error dari stack function yang sangat dalam
      return generateDeepStackError(0);

    case 'database':
      // Error yang terkait dengan database
      return generateDatabaseError();

    case 'async':
      // Error dalam promise/async
      return generateAsyncError();

    default:
      // Error generic
      throw new Error(`Error generik: ${errorType || 'unknown'}`);
  }
}

/**
 * Menghasilkan ReferenceError
 */
function generateReferenceError() {
  // Mencoba mengakses variabel yang tidak didefinisikan
  const value = undefinedVariable + 10; // undefinedVariable tidak didefinisikan
  return value;
}

/**
 * Menghasilkan TypeError
 */
function generateTypeError() {
  // Mencoba mengakses properti dari null
  const obj = null;
  return obj.property;
}

/**
 * Menghasilkan RangeError
 */
function generateRangeError() {
  // Mencoba membuat array dengan ukuran negatif
  return new Array(-1);
}

/**
 * Menghasilkan SyntaxError
 */
function generateSyntaxError() {
  // Mencoba mengevaluasi kode dengan sintaks tidak valid
  eval('var x = {;}'); // Sintaks tidak valid
}

/**
 * Menghasilkan error dengan stack yang dalam
 * @param {number} depth - Kedalaman rekursi
 */
function generateDeepStackError(depth) {
  if (depth >= 10) {
    throw new Error(`Error dari stack depth ${depth}`);
  }
  return nestedFunction(depth + 1);
}

/**
 * Fungsi rekursif untuk membuat stack yang dalam
 * @param {number} depth - Kedalaman rekursi
 */
function nestedFunction(depth) {
  return generateDeepStackError(depth);
}

/**
 * Menghasilkan error yang terkait dengan database
 */
function generateDatabaseError() {
  const tableName = 'users';
  const operation = 'SELECT';
  
  throw Object.assign(
    new Error(`Database error: gagal melakukan ${operation} pada tabel ${tableName}`),
    {
      code: 'DATABASE_ERROR',
      component: 'DatabaseService',
      operation: operation,
      tableName: tableName,
      sql: `${operation} * FROM ${tableName} WHERE id = ?`,
      params: ['user_id_123']
    }
  );
}

/**
 * Menghasilkan error dalam promise
 */
async function generateAsyncError() {
  return Promise.reject(new Error('Error dalam async/promise'));
}

module.exports = {
  generateTestError
}; 