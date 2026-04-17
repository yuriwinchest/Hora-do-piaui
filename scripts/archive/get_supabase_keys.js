import https from 'https';
import dotenv from 'dotenv';
dotenv.config();

const projectRef = 'mkfkiefwltdepgheynco';
const accessToken = 'sbp_d91e4d6a24b6a5b4093ddb76331dc4ec1b6fbf32';

const options = {
  hostname: 'api.supabase.com',
  path: `/v1/projects/${projectRef}/api-keys`,
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  }
};

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log(data);
  });
});

req.on('error', (e) => {
  console.error(e);
});

req.end();
