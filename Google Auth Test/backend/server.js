const { OAuth2Client } = require('google-auth-library');
require('dotenv').config();

const googleClient = new OAuth2Client();
const googleWebClientId = process.env.GOOGLE_WEB_CLIENT_ID;
//ensure web client ID is in .env and recieved
if (!googleWebClientId){
  throw new Error('GOOGLE_WEB_CLIENT_ID is missing from .env');
}

const express = require('express');
const { Pool } = require('pg');
const createSessionAuth = require('./sessionAuth');

const app = express();
const PORT = 3000;

const pool = new Pool();
const {
  createSession,
  sessionAuthHandler,
  refreshSessionHandler,
  revokeSessionHandler,
} = createSessionAuth(pool);

app.use(express.json());

app.get('/', (req, res) => {
  res.send('Jelly backend is running!');
});

app.post('/auth/google', async (req, res) => {
  console.log('POST /auth/google reached');
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

    //after successful google log in, create user jelly session
    const user = result.rows[0];
    const tokens = await createSession(user.id);

    //instruction to not store return in HTTP caches
    res.set('Cache-Control', 'no-store');

    //return OK + user info and session info
    return res.status(200).json({
      user: {
        id: user.id,
      },
      ...tokens,
    });
  }
  catch (error) {
    console.error('Unable to authenticate with Google:', error);
    return res.status(401).json({ error: 'Unable to authenticate with Google.' });
  }
});

//protected (sessionAuthHandler) get me request => provides userID for rest of requests.
app.get('/me', sessionAuthHandler, (req, res) => {
  res.set('Cache-Control', 'no-store');

  return res.status(200).json({
    user: {
      id: req.userId,
    },
  });
});

//refresh session
app.post('/auth/refresh', refreshSessionHandler);

//revoke the session identified by a verified refresh token
app.post('/revokeSession', revokeSessionHandler);

app.listen(PORT, () => {
  console.log(`Jelly backend running at http://localhost:${PORT}`);
});
