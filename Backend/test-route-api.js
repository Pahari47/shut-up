const axios = require('axios');

const OPENROUTESERVICE_API_KEY = '5b3ce3597851110001cf62481ff50d5207c04a54bed84f87a78c203f';

async function testRouteAPI() {
  try {
    console.log('🗺️ Testing OpenRouteService API with correct format...');
    
    // Test coordinates (Kolkata area) - use more distant points
    const origin = [22.5726, 88.3639]; // [lat, lng]
    const destination = [22.5826, 88.3839]; // [lat, lng] - more distant
    
    console.log('Origin:', origin);
    console.log('Destination:', destination);
    
    // Use the correct format - just format: 'geojson' is sufficient
    const requestBody = {
      coordinates: [
        [origin[1], origin[0]], // [lng, lat]
        [destination[1], destination[0]] // [lng, lat]
      ],
      format: 'geojson'
    };
    
    console.log('Request body:', JSON.stringify(requestBody, null, 2));
    
    const response = await axios.post(
      'https://api.openrouteservice.org/v2/directions/driving-car',
      requestBody,
      {
        headers: {
          'Authorization': OPENROUTESERVICE_API_KEY,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      }
    );
    
    console.log('✅ API Response received');
    console.log('Status:', response.status);
    
    const data = response.data;
    console.log('Features count:', data.features?.length || 0);
    
    if (data && data.features && data.features[0] && data.features[0].geometry) {
      const routeCoords = data.features[0].geometry.coordinates.map((coord) => [coord[1], coord[0]]);
      console.log('Route coordinates count:', routeCoords.length);
      console.log('First 3 coordinates:', routeCoords.slice(0, 3));
      console.log('Last 3 coordinates:', routeCoords.slice(-3));
      
      // Check if route is not just a straight line
      if (routeCoords.length > 2) {
        console.log('✅ Route follows roads (multiple waypoints)');
      } else {
        console.log('⚠️ Route appears to be straight line');
      }
    } else {
      console.log('❌ No route data found in response');
      console.log('Full response:', JSON.stringify(data, null, 2));
    }
    
  } catch (error) {
    console.error('❌ API test failed:', error.response?.data || error.message);
    console.error('Error status:', error.response?.status);
    if (error.response?.data) {
      console.error('Error details:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testRouteAPI(); 