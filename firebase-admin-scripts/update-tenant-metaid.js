// update-tenant-metaid.js
// Run this script using Node.js to update your tenant with a Meta ad account ID

const admin = require('firebase-admin');

// Initialize with your service account
// This should be in the same directory as this script
const serviceAccount = require('./service-account-key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function updateTenantWithMetaAdAccountId() {
  try {
    // You can replace this with your specific tenant ID from Firebase
    const tenantId = 'u8uMpeEPk17vveD03vL7';
    
    // Replace this with your actual Meta ad account ID
    // It typically starts with 'act_' followed by a number
    const metaAdAccountId = 'act_123456789';
    
    console.log(`Updating tenant ${tenantId} with Meta ad account ID ${metaAdAccountId}...`);
    
    // Reference to the tenant document
    const tenantRef = db.collection('tenants').doc(tenantId);
    
    // First check if the tenant exists
    const tenantDoc = await tenantRef.get();
    
    if (!tenantDoc.exists) {
      console.error(`Tenant with ID ${tenantId} does not exist`);
      return;
    }
    
    // Update the tenant with the Meta ad account ID
    await tenantRef.update({
      metaAdAccountId: metaAdAccountId,
      updatedAt: new Date().toISOString()
    });
    
    console.log(`Successfully updated tenant ${tenantId} with Meta ad account ID ${metaAdAccountId}`);
    
    // Verify the update
    const updatedTenantDoc = await tenantRef.get();
    console.log('Updated tenant data:', updatedTenantDoc.data());
    
  } catch (error) {
    console.error('Error updating tenant:', error);
  }
}

// Run the update function
updateTenantWithMetaAdAccountId();