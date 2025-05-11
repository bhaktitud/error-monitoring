import prisma from '../models/prisma';

/**
 * Fungsi untuk menghapus semua data dari database
 * Berguna untuk keperluan testing untuk memastikan database
 * dalam keadaan bersih sebelum menjalankan test
 */
async function resetDatabase() {
  console.log('🗑️ Menghapus semua data dari database...');
  
  try {
    // Hapus data dari semua tabel sesuai urutan dependensi
    // Untuk menghindari constraint error
    
    // Hapus WebhookDelivery (bergantung pada Webhook)
    await prisma.webhookDelivery.deleteMany();
    console.log('✅ WebhookDelivery dihapus');
    
    // Hapus Webhook (bergantung pada Project)
    await prisma.webhook.deleteMany();
    console.log('✅ Webhook dihapus');
    
    // Hapus ErrorGroupComment (bergantung pada ErrorGroup dan ProjectMember)
    await prisma.errorGroupComment.deleteMany();
    console.log('✅ ErrorGroupComment dihapus');
    
    // Hapus Event (bergantung pada ErrorGroup dan Project)
    await prisma.event.deleteMany();
    console.log('✅ Event dihapus');
    
    // Hapus ErrorGroup (bergantung pada Project dan ProjectMember)
    await prisma.errorGroup.deleteMany();
    console.log('✅ ErrorGroup dihapus');
    
    // Hapus ProjectMember (bergantung pada Project dan User)
    await prisma.projectMember.deleteMany();
    console.log('✅ ProjectMember dihapus');
    
    // Hapus Project (bergantung pada User)
    await prisma.project.deleteMany();
    console.log('✅ Project dihapus');
    
    // Hapus PlanHistory (bergantung pada User)
    await prisma.planHistory.deleteMany();
    console.log('✅ PlanHistory dihapus');
    
    // Hapus User (tidak bergantung pada tabel lain setelah PlanHistory dihapus)
    await prisma.user.deleteMany();
    console.log('✅ User dihapus');
    
    console.log('🎉 Database berhasil dikosongkan!');
  } catch (error) {
    console.error('❌ Gagal menghapus data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Jika file ini dijalankan langsung (bukan diimpor)
if (require.main === module) {
  resetDatabase()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('Error:', error);
      process.exit(1);
    });
}

export default resetDatabase; 