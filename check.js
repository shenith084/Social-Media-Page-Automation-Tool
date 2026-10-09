const { Client } = require('pg'); 
const client = new Client({ connectionString: 'postgresql://pixzora:pixzora_pass@localhost:5432/pixzoradb' }); 
client.connect().then(() => client.query("SELECT id, status, blocked_reason FROM queue_items ORDER BY updated_at DESC LIMIT 3;")).then(res => { console.log(res.rows); client.end(); }).catch(console.error);
