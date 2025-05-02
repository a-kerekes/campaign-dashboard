// tenant-diagnostic.js
// This script checks the status of all tenants and their Meta ad account IDs

const admin = require('firebase-admin');

// Initialize with your service account
const serviceAccount = require('./service-account-key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function diagnoseTenants() {
  console.log('Starting tenant diagnostic...');
  
  try {
    // Get all tenants
    const tenantsSnapshot = await db.collection('tenants').get();
    
    if (tenantsSnapshot.empty) {
      console.log('No tenants found in the database.');
      return;
    }
    
    console.log(`Found ${tenantsSnapshot.size} tenants in the database.`);
    console.log('------------------------------');
    
    let tenantsWithoutMetaId = 0;
    
    // Check each tenant
    tenantsSnapshot.forEach(doc => {
      const tenant = doc.data();
      console.log(`Tenant: ${tenant.name} (ID: ${doc.id})`);
      
      if (tenant.metaAdAccountId) {
        console.log(`  ✅ Meta Ad Account ID: ${tenant.metaAdAccountId}`);
      } else {
        console.log(`  ❌ No Meta Ad Account ID associated`);
        tenantsWithoutMetaId++;
      }
      
      console.log(`  Created At: ${tenant.createdAt}`);
      if (tenant.updatedAt) {
        console.log(`  Updated At: ${tenant.updatedAt}`);
      }
      
      console.log('------------------------------');
    });
    
    // Summary
    console.log(`SUMMARY:`);
    console.log(`Total Tenants: ${tenantsSnapshot.size}`);
    console.log(`Tenants with Meta Ad Account ID: ${tenantsSnapshot.size - tenantsWithoutMetaId}`);
    console.log(`Tenants without Meta Ad Account ID: ${tenantsWithoutMetaId}`);
    
    // Check specific tenant if ID is provided
    const specificTenantId = 'u8uMpeEPk17vveD03vL7'; // Your tenant ID from Firebase console
    const tenantDoc = await db.collection('tenants').doc(specificTenantId).get();
    
    if (tenantDoc.exists) {
      console.log('\nSpecific Tenant Check:');
      console.log(`Tenant ID ${specificTenantId}:`);
      const tenantData = tenantDoc.data();
      console.log(`  Name: ${tenantData.name}`);
      
      if (tenantData.metaAdAccountId) {
        console.log(`  ✅ Meta Ad Account ID: ${tenantData.metaAdAccountId}`);
      } else {
        console.log(`  ❌ No Meta Ad Account ID associated`);
        console.log(`  To fix this, run the update-tenant-metaid.js script`);
      }
    } else {
      console.log(`\nTenant with ID ${specificTenantId} not found.`);
    }
    
  } catch (error) {
    console.error('Error diagnosing tenants:', error);
  }
}

// Run the diagnostic
diagnoseTenants();