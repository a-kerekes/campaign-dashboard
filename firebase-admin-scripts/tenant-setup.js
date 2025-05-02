// tenant-setup.js
// Run this script using Node.js to initialize your multi-tenant system

const admin = require('firebase-admin');

// Initialize with your service account
// Download service account key from: Firebase Console → Project Settings → Service Accounts
const serviceAccount = require('./service-account-key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function initializeMultiTenantSystem() {
  try {
    // 1. Update all existing users to have a tenants array
    console.log('Updating existing users with tenants array...');
    const usersSnapshot = await db.collection('users').get();
    
    const batch = db.batch();
    let userUpdates = 0;
    
    usersSnapshot.forEach(doc => {
      if (!doc.data().tenants) {
        batch.update(doc.ref, { tenants: [] });
        userUpdates++;
      }
    });
    
    if (userUpdates > 0) {
      await batch.commit();
      console.log(`Updated ${userUpdates} users with tenants array`);
    } else {
      console.log('All users already have tenants array');
    }
    
    // 2. Find an admin user to assign as tenant creator
    const adminUserSnapshot = await db.collection('users')
      .where('role', '==', 'admin')
      .limit(1)
      .get();
    
    let adminUserId;
    
    if (adminUserSnapshot.empty) {
      console.log('No admin user found. Specify an admin user ID manually:');
      // If no admin user is found, you can manually specify an admin UID here
      adminUserId = process.argv[2] || '';
      
      if (!adminUserId) {
        throw new Error('No admin user ID provided. Run script with admin user ID as argument');
      }
      
      // Verify the user exists
      const adminUser = await db.collection('users').doc(adminUserId).get();
      if (!adminUser.exists) {
        throw new Error(`User with ID ${adminUserId} does not exist`);
      }
      
      // Set the user as admin if not already
      if (adminUser.data().role !== 'admin') {
        await db.collection('users').doc(adminUserId).update({ role: 'admin' });
        console.log(`Updated user ${adminUserId} to have admin role`);
      }
    } else {
      const adminUser = adminUserSnapshot.docs[0];
      adminUserId = adminUser.id;
      console.log(`Found admin user: ${adminUser.data().email} (${adminUserId})`);
    }
    
    // 3. Create specific tenants for Sweetflexx and KCM
    await createTenantsWithMetaAccounts(adminUserId);
    
    // 4. Create domain mappings
    await createDomainMappings();
    
    console.log('Multi-tenant system initialization completed successfully!');
    
  } catch (error) {
    console.error('Error initializing multi-tenant system:', error);
  }
}

async function createTenantsWithMetaAccounts(adminUserId) {
  try {
    console.log(`Creating tenants with Meta ad accounts...`);
    
    // Define tenants to create
    const tenants = [
      {
        name: 'Sweetflexx',
        metaAdAccountId: 'act_123456789', // Replace with actual Meta ad account ID
        domain: 'sweetflexx.com'
      },
      {
        name: 'Keeping Current Matters',
        metaAdAccountId: 'act_987654321', // Replace with actual Meta ad account ID
        domain: 'keepingcurrentmatters.com'
      }
    ];
    
    for (const tenant of tenants) {
      // Check if tenant already exists by name
      const existingTenantSnapshot = await db.collection('tenants')
        .where('name', '==', tenant.name)
        .limit(1)
        .get();
      
      let tenantId;
      
      if (!existingTenantSnapshot.empty) {
        // Tenant exists, update it
        const tenantDoc = existingTenantSnapshot.docs[0];
        tenantId = tenantDoc.id;
        
        await db.collection('tenants').doc(tenantId).update({
          metaAdAccountId: tenant.metaAdAccountId,
          updatedAt: new Date().toISOString()
        });
        
        console.log(`Updated existing tenant ${tenant.name} with ID: ${tenantId}`);
      } else {
        // Create new tenant
        const tenantRef = db.collection('tenants').doc();
        tenantId = tenantRef.id;
        
        await tenantRef.set({
          name: tenant.name,
          metaAdAccountId: tenant.metaAdAccountId,
          createdAt: new Date().toISOString(),
          createdBy: adminUserId
        });
        
        console.log(`Created tenant ${tenant.name} with ID: ${tenantId}`);
        
        // Add the admin user to the tenant
        await db.collection('users').doc(adminUserId).update({
          tenants: admin.firestore.FieldValue.arrayUnion(tenantId)
        });
        
        console.log(`Added admin user ${adminUserId} to tenant ${tenant.name}`);
        
        // Create a sample campaign subcollection
        await tenantRef.collection('campaigns').doc().set({
          name: `Sample ${tenant.name} Campaign`,
          createdAt: new Date().toISOString(),
          status: 'draft'
        });
        
        console.log(`Created sample campaign in tenant ${tenant.name}`);
      }
      
      // Store tenant ID for domain mapping
      tenant.id = tenantId;
    }
    
    return tenants;
    
  } catch (error) {
    console.error('Error creating tenants with Meta accounts:', error);
    throw error;
  }
}

async function createDomainMappings() {
  try {
    console.log('Creating domain to tenant mappings...');
    
    // Check if domainMappings collection exists
    const domainCollectionExists = await db.collection('domainMappings').limit(1).get();
    
    if (!domainCollectionExists.empty) {
      // First, clear existing mappings
      const existingMappings = await db.collection('domainMappings').get();
      
      // Delete in batches if there are many
      const batch = db.batch();
      let deleteCount = 0;
      
      existingMappings.forEach(doc => {
        batch.delete(doc.ref);
        deleteCount++;
        
        // Commit batch if it's getting large
        if (deleteCount % 500 === 0) {
          batch.commit();
          const newBatch = db.batch();
        }
      });
      
      if (deleteCount > 0) {
        await batch.commit();
        console.log(`Deleted ${deleteCount} existing domain mappings`);
      }
    }
    
    // Get all tenants
    const tenantsSnapshot = await db.collection('tenants').get();
    const tenants = [];
    
    tenantsSnapshot.forEach(doc => {
      tenants.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    // Create mappings for each tenant that has a domain
    const domainMappings = [
      { domain: 'sweetflexx.com', tenantName: 'Sweetflexx' },
      { domain: 'keepingcurrentmatters.com', tenantName: 'Keeping Current Matters' }
    ];
    
    for (const mapping of domainMappings) {
      const tenant = tenants.find(t => t.name === mapping.tenantName);
      
      if (tenant) {
        await db.collection('domainMappings').add({
          domain: mapping.domain.toLowerCase(),
          tenantId: tenant.id,
          createdAt: new Date().toISOString()
        });
        
        console.log(`Created domain mapping: ${mapping.domain} -> ${tenant.name} (${tenant.id})`);
      } else {
        console.warn(`Could not find tenant with name ${mapping.tenantName} for domain ${mapping.domain}`);
      }
    }
    
    console.log('Domain mappings created successfully');
    
  } catch (error) {
    console.error('Error creating domain mappings:', error);
    throw error;
  }
}

// Run the initialization
initializeMultiTenantSystem();