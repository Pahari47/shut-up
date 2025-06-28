const axios = require('axios');

async function addWorkerSpecializations() {
  try {
    console.log('🔧 Adding specializations to workers...');
    
    // First, get all workers
    const workersResponse = await axios.get('http://localhost:5000/api/v1/workers');
    const workers = workersResponse.data.data;
    
    if (workers.length === 0) {
      console.log('❌ No workers found. Please create workers first.');
      return;
    }
    
    console.log(`📋 Found ${workers.length} workers`);
    
    // Add specializations to each worker
    for (const worker of workers) {
      const specializations = [
        {
          workerId: worker.id,
          category: "plumber",
          subCategory: "pipe_repair",
          proficiency: 4,
          isPrimary: true
        },
        {
          workerId: worker.id,
          category: "electrician", 
          subCategory: "wiring",
          proficiency: 3,
          isPrimary: false
        },
        {
          workerId: worker.id,
          category: "general",
          subCategory: "handyman",
          proficiency: 2,
          isPrimary: false
        }
      ];
      
      for (const spec of specializations) {
        try {
          await axios.post('http://localhost:5000/api/v1/specializations', spec);
          console.log(`✅ Added ${spec.category} specialization to worker ${worker.firstName}`);
        } catch (error) {
          console.log(`⚠️ Failed to add ${spec.category} to worker ${worker.firstName}:`, error.response?.data?.error || error.message);
        }
      }
    }
    
    console.log('🎉 Specializations added successfully!');
    
  } catch (error) {
    console.error('❌ Error adding specializations:', error.response?.data || error.message);
  }
}

addWorkerSpecializations(); 