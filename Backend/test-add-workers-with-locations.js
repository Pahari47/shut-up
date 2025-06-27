const mysql = require('mysql2/promise');

async function addTestWorkers() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'your_password',
    database: 'hack4bengal'
  });

  try {
    console.log('🔧 Adding test workers with beauty specialization...');

    // Add test workers
    const workers = [
      {
        firstName: 'Priya',
        lastName: 'Sharma',
        email: 'priya.beauty@test.com',
        password: 'test123',
        phoneNumber: '+919876543210',
        dateOfBirth: '1990-05-15',
        gender: 'female',
        experienceYears: 5,
        address: 'Kolkata, West Bengal',
        description: 'Professional beauty specialist with 5 years experience'
      },
      {
        firstName: 'Rahul',
        lastName: 'Verma',
        email: 'rahul.beauty@test.com',
        password: 'test123',
        phoneNumber: '+919876543211',
        dateOfBirth: '1988-08-20',
        gender: 'male',
        experienceYears: 3,
        address: 'Kolkata, West Bengal',
        description: 'Skilled beauty and hair care specialist'
      },
      {
        firstName: 'Anjali',
        lastName: 'Patel',
        email: 'anjali.beauty@test.com',
        password: 'test123',
        phoneNumber: '+919876543212',
        dateOfBirth: '1992-03-10',
        gender: 'female',
        experienceYears: 4,
        address: 'Kolkata, West Bengal',
        description: 'Expert in hair treatments and styling'
      }
    ];

    for (const worker of workers) {
      // Insert worker
      const [workerResult] = await connection.execute(
        'INSERT INTO workers (firstName, lastName, email, password, phoneNumber, dateOfBirth, gender, experienceYears, address, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [worker.firstName, worker.lastName, worker.email, worker.password, worker.phoneNumber, worker.dateOfBirth, worker.gender, worker.experienceYears, worker.address, worker.description]
      );

      const workerId = workerResult.insertId;
      console.log(`✅ Added worker: ${worker.firstName} ${worker.lastName} (ID: ${workerId})`);

      // Add beauty specialization
      await connection.execute(
        'INSERT INTO specializations (workerId, category, subCategory) VALUES (?, ?, ?)',
        [workerId, 'beauty', 'hair_treatment']
      );
      console.log(`✅ Added beauty specialization for ${worker.firstName}`);

      // Add live location (near Kolkata)
      const locations = [
        { lat: 22.5726, lng: 88.3639 }, // Central Kolkata
        { lat: 22.5787, lng: 88.4761 }, // New Town
        { lat: 22.5411, lng: 88.3378 }  // South Kolkata
      ];

      const location = locations[Math.floor(Math.random() * locations.length)];
      await connection.execute(
        'INSERT INTO live_locations (workerId, lat, lng) VALUES (?, ?, ?)',
        [workerId, location.lat, location.lng]
      );
      console.log(`✅ Added live location for ${worker.firstName}: ${location.lat}, ${location.lng}`);
    }

    console.log('🎉 All test workers added successfully!');
    console.log('📋 Test workers available:');
    console.log('  - Priya Sharma (beauty specialist)');
    console.log('  - Rahul Verma (beauty specialist)');
    console.log('  - Anjali Patel (beauty specialist)');

  } catch (error) {
    console.error('❌ Error adding test workers:', error);
  } finally {
    await connection.end();
  }
}

addTestWorkers(); 