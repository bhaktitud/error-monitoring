import resetDatabase from './reset-db';
import seedDatabase from './db-seed';

/**
 * Fungsi untuk reset database dan kemudian mengisi dengan data testing
 * Berguna untuk mempersiapkan lingkungan testing
 */
async function resetAndSeedDatabase() {
  console.log('🔄 Memulai reset dan seed database...');
  
  try {
    // Reset database
    await resetDatabase();
    
    // Seed database
    await seedDatabase();
    
    console.log('✨ Reset dan seed database selesai!');
  } catch (error) {
    console.error('❌ Gagal reset dan seed database:', error);
    throw error;
  }
}

// Jika file ini dijalankan langsung (bukan diimpor)
if (require.main === module) {
  resetAndSeedDatabase()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('Error:', error);
      process.exit(1);
    });
}

export default resetAndSeedDatabase; 