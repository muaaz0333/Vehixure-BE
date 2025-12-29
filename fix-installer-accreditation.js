import { AppDataSource } from './src/plugins/typeorm.js';
import { User } from './src/entities/User.js';

async function fixInstallerAccreditation() {
  try {
    // Initialize database connection
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
      console.log('Database connection initialized');
    }

    const userRepo = AppDataSource.getRepository(User);
    
    // Find the installer user
    const installerId = '4183f64b-b9c4-4361-a234-6420c013dbbc';
    const installer = await userRepo.findOne({
      where: { id: installerId }
    });

    if (!installer) {
      console.log('❌ Installer not found with ID:', installerId);
      return;
    }

    console.log('📋 Current installer details:');
    console.log('- ID:', installer.id);
    console.log('- Email:', installer.email);
    console.log('- Full Name:', installer.fullName);
    console.log('- Partner Role:', installer.partnerRole);
    console.log('- Is Accredited Installer:', installer.isAccreditedInstaller);
    console.log('- Mobile Number:', installer.mobileNumber);

    if (installer.isAccreditedInstaller) {
      console.log('✅ Installer is already accredited');
      return;
    }

    // Update the installer to be accredited
    installer.isAccreditedInstaller = true;
    
    // Also ensure they have the correct partner role
    if (installer.partnerRole !== 'ACCOUNT_INSTALLER') {
      installer.partnerRole = 'ACCOUNT_INSTALLER';
      console.log('🔧 Updated partner role to ACCOUNT_INSTALLER');
    }

    await userRepo.save(installer);

    console.log('✅ Successfully updated installer accreditation');
    console.log('📋 Updated installer details:');
    console.log('- Is Accredited Installer:', installer.isAccreditedInstaller);
    console.log('- Partner Role:', installer.partnerRole);

  } catch (error) {
    console.error('❌ Error fixing installer accreditation:', error);
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
      console.log('Database connection closed');
    }
  }
}

// Run the fix
fixInstallerAccreditation();