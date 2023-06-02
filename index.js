require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
// Basic Configuration
const port = process.env.PORT || 3000;
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
const { MongoClient } = require('mongodb');
const uri = process.env.MONGO_URI;
const dns = require('dns');
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
async function connect() { 
  try {
    await client.connect();
    console.log('connected to database');

  } catch (err) {
    console.log(err);
  }
}
connect();
const db = client.db('ShortURls');
const collection = db.collection('Shorturls');




app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

app.post('/api/shorturl', async function(req, res) {
  const url = req.body.url;
  //check if url is valid
  const regex = /^(http|https):\/\/[^ "]+$/;
  if (!regex.test(url)) {
    res.json({ error: 'invalid url' });
    return;
  }
  //check if url is valid
  const urlObj = new URL(url);
  dns.lookup(urlObj.hostname, async (err, address, family) => {
    if (err) {
      res.json({ error: 'invalid url' });
      return;
    }
  });
  //check if url is already in the database
  try {
    valid = await collection.findOne({ original_url: url });
    if (valid) {
      res.json({ original_url: url, short_url: valid.short_url });
      return;
    }
  } catch (err) {
    console.log(err);
  }


  //find number of records in the database
  const count = await collection.countDocuments();
   //create a new url record

  try {
    const result = await collection.insertOne({ original_url: url, short_url: count + 1 });
    res.json({ original_url: url, short_url: count + 1 });
  } catch (err) {
    console.log(err);
  }

 
});

//redirect to the original url
app.get('/api/shorturl/:short_url', async function(req, res) {
  const short_url = req.params.short_url;
  try {
    const long_url = await collection.findOne({ short_url: parseInt(short_url) });
    if (long_url) {
      res.redirect(long_url.original_url);
    } else {
      res.json({ error: 'No short URL found for the given input' });
    }
  } catch (err) {
    console.log(err);
  }
});



// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
