const { db } = require('./src/config/drizzle');
const { sql } = require('drizzle-orm');

async function checkWorkerLocation() {
  try {
    console.log('🔍 Checking worker location...');
    
    const workerId = '72e7e4ca-53c8-4aab-99f2-14e297e667f3';
    
    // Check if worker exists
    const workers = await db.execute(sql`
      SELECT id, "firstName", "lastName" FROM workers WHERE id = ${workerId}
    `);
    
    if (workers.rows.length === 0) {
      console.log('❌ Worker not found in database');
      return;
    }
    
    console.log('✅ Worker found:', workers.rows[0]);
    
    // Check if worker has live location
    const locations = await db.execute(sql`
      SELECT * FROM live_locations WHERE worker_id = ${workerId} ORDER BY created_at DESC LIMIT 1
    `);
    
    if (locations.rows.length === 0) {
      console.log('❌ No live location found for worker');
      console.log('💡 Worker needs to go online and share location');
      return;
    }
    
    const location = locations.rows[0];
    console.log('✅ Live location found:', location);
    
    // Check if location is recent (within 5 minutes)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const locationTime = new Date(location.created_at);
    
    if (locationTime < fiveMinutesAgo) {
      console.log('⚠️ Location is too old (more than 5 minutes)');
      console.log('📍 Location time:', locationTime);
      console.log('⏰ 5 minutes ago:', fiveMinutesAgo);
    } else {
      console.log('✅ Location is recent enough');
    }
    
    // Test the actual query used in job subscriber
    console.log('\n🔍 Testing worker search query...');
    const searchResults = await db.execute(sql`
      SELECT DISTINCT 
        w.id as worker_id,
        w."firstName",
        w."lastName",
        w.phone_number,
        w.experience_years,
        ll.lat,
        ll.lng,
        (
          6371 * acos(
            cos(radians(22.5726)) *
            cos(radians(ll.lat)) *
            cos(radians(ll.lng) - radians(88.3639)) +
            sin(radians(22.5726)) * sin(radians(ll.lat))
          )
        ) as distance
      FROM workers w
      INNER JOIN live_locations ll ON w.id = ll.worker_id
      WHERE (
        6371 * acos(
          cos(radians(22.5726)) *
          cos(radians(ll.lat)) *
          cos(radians(ll.lng) - radians(88.3639)) +
          sin(radians(22.5726)) * sin(radians(ll.lat))
        )
      ) < 20
      AND ll.created_at >= ${fiveMinutesAgo}
      ORDER BY distance ASC
      LIMIT 10
    `);
    
    console.log(`📊 Search query found ${searchResults.rows.length} workers`);
    
    if (searchResults.rows.length > 0) {
      console.log('📋 Workers found:');
      searchResults.rows.forEach((worker, index) => {
        console.log(`  ${index + 1}. ${worker.firstName} ${worker.lastName} - ${worker.distance.toFixed(2)}km away`);
      });
      
      // Check if our specific worker is in the results
      const ourWorker = searchResults.rows.find(w => w.worker_id === workerId);
      if (ourWorker) {
        console.log('✅ Our worker is in the search results!');
      } else {
        console.log('❌ Our worker is NOT in the search results');
      }
    } else {
      console.log('❌ No workers found in search query');
    }
    
  } catch (error) {
    console.error('❌ Error checking worker location:', error);
  }
}

checkWorkerLocation(); 