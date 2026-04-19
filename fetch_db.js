const https = require('https');

const projectId = 'maviinvi';
const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/Fabric/embroidery/kurta_collections`;

https.get(url, (res) => {
  let body = '';
  res.on('data', chunk => {
    body += chunk;
  });
  res.on('end', () => {
    try {
      const data = JSON.parse(body);
      console.log(JSON.stringify(data, null, 2));
    } catch(e) {
      console.log('Error parsing JSON:', e);
      console.log(body);
    }
  });
}).on('error', err => {
  console.log('Request error:', err);
});
