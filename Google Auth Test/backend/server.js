const { OAuth2Client } = require('google-auth-library');
require('dotenv').config();

const googleClient = new OAuth2Client();
const googleWebClientId = process.env.GOOGLE_WEB_CLIENT_ID;
//ensure web client ID is in .env and recieved
if (!googleWebClientId){
  throw new Error('GOOGLE_WEB_CLIENT_ID is missing from .env');
}

const express = require('express');
const argon2 = require('argon2');
const { Pool } = require('pg');

const app = express();
const PORT = 3000;

const pool = new Pool();

app.use(express.json());

app.get('/', (req, res) => {
  res.send('Jelly backend is running!');
});

app.post('/auth/google', async (req, res) => {
  const { idToken } = req.body ?? {};

  if (!idToken) {
    return res.status(400).json({ error: 'Google ID token is required.' });
  }

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: googleWebClientId,
    });
    const { sub: gsub, name, email } = ticket.getPayload();
    const username = name || email

    const result = await pool.query(
      `INSERT INTO googleUsers (gsub, username, email)
       VALUES ($1, $2, $3)
       ON CONFLICT (gsub)
       DO UPDATE SET
         username = EXCLUDED.username,
         email = EXCLUDED.email
       RETURNING id, gsub, username, email`,
      [gsub, username, email]
    );

    return res.json(result.rows[0]);
  }
  catch (error) {
    console.error('Unable to authenticate with Google:', error);
    return res.status(401).json({ error: 'Unable to authenticate with Google.' });
  }
});
/**
app.post('/signup', async (req, res) => {
  const { username, password } = req.body ?? {};

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required.' });
  }

  try {
    const passwordHash = await argon2.hash(password);
    const result = await pool.query(
      `INSERT INTO googleUsers (username, passwordHash)
       VALUES ($1, $2)
       RETURNING id, username`,
      [username, passwordHash]
    );

    return res.status(201).json(result.rows[0]);
  } 
  catch (error) {
    console.error({
      code: error.code,
      constraint: error.constraint,
      detail: error.detail,
    });

    if (error.code === '23505') {
      return res.status(409).json({error: "That username is already taken"});
    }

    return res.status(500).json({ error: 'Unable to create user.' });
  }
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body ?? {};

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required.' });
  }

  try {
    const result = await pool.query(
      `SELECT id, username, passwordHash AS "passwordHash"
       FROM googleUsers
       WHERE username = $1`,
      [username]
    );

    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    const passwordMatches = await argon2.verify(user.passwordHash, password);

    if (!passwordMatches) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    return res.json({ id: user.id, username: user.username });
  }
  catch (error) {
    console.error('Unable to log in:', error);
    return res.status(500).json({ error: 'Unable to log in.' });
  }
});
*/
app.listen(PORT, () => {
  console.log(`Jelly backend running at http://localhost:${PORT}`);
});
