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
    const googleName = name || '';
    const googleEmail = email || '';

    const result = await pool.query(
      `INSERT INTO googleUsers (gsub, username, email)
       VALUES ($1, $2, $3)
       ON CONFLICT (gsub)
       DO UPDATE SET
         username = EXCLUDED.username,
         email = EXCLUDED.email
       RETURNING id, gsub, username, email`,
      [gsub, googleName, googleEmail]
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

//protected (sessionAuthHandler) get me request => provides userID and profile.
app.get('/me', sessionAuthHandler, async (req, res) => {
  res.set('Cache-Control', 'no-store');

  try {
    const result = await pool.query(
      `SELECT
        googleUsers.id,
        userInfo.username,
        userInfo.avatar_color,
        CASE
          WHEN BTRIM(googleUsers.username) = BTRIM(googleUsers.email)
            THEN NULL
          ELSE NULLIF(BTRIM(googleUsers.username), '')
        END AS google_name,
        NULLIF(BTRIM(googleUsers.email), '') AS google_email
      FROM googleUsers
      LEFT JOIN userInfo ON userInfo.user_id = googleUsers.id
      WHERE googleUsers.id = $1`,
      [req.userId]
    );

    const user = result.rows[0];

    if (!user) {
      return res.status(404).json({ error: 'Unable to find your account.' });
    }

    const missingGoogleFields = [];

    if (!user.google_name) {
      missingGoogleFields.push('Google account name');
    }

    if (!user.google_email) {
      missingGoogleFields.push('Google email');
    }

    if (missingGoogleFields.length > 0) {
      console.warn(
        `Missing Google profile data for user ${req.userId}: ${missingGoogleFields.join(', ')}`
      );
    }

    //return user_is, username, and avatar color
    return res.status(200).json({
      user: {
        id: user.id,
        username: user.username,
        avatarColor: user.avatar_color,
        googleName: user.google_name,
        googleEmail: user.google_email,
        missingGoogleFields,
      },
    });
  }
  catch (error) {
    console.error('Unable to load account:', error.message);
    return res.status(500).json({ error: 'Unable to load your account.' });
  }
});

app.post('/me/profile', sessionAuthHandler, async (req, res) => {
  res.set('Cache-Control', 'no-store');

  //trim username before storing
  const username = typeof req.body?.username === 'string'
    ? req.body.username.trim()
    : '';

  //ensure trimmed username is valid (chars, nums, underscores)
  if (!/^[A-Za-z0-9_]{2,20}$/.test(username)) {
    //error
    return res.status(400).json({
      code: 'INVALID_USERNAME',
      error: 'Username must be 2–20 characters using only letters, numbers, and underscores.',
    });
  }

  try {
    //create + insert profile row with username, default avatar color
    //tied and searched via user_id
    const result = await pool.query(
      `INSERT INTO userInfo (user_id, username, avatar_color)
       VALUES ($1, $2, $3)
       RETURNING username, avatar_color`,
      [req.userId, username, '#D8C2FF']
    );

    const profile = result.rows[0];

    //return user object with profile data
    return res.status(201).json({
      user: {
        id: req.userId,
        username: profile.username,
        avatarColor: profile.avatar_color,
      },
    });
  }
  //error handler
  catch (error) {
    if (error.code === '23505') {
      //usernames must be unique
      if (error.constraint === 'userinfo_username_key') {
        return res.status(409).json({
          code: 'USERNAME_TAKEN',
          error: 'That username is already taken.',
        });
      }

      //profile already exists?
      return res.status(409).json({
        code: 'PROFILE_EXISTS',
        error: 'A profile already exists for this account.',
      });
    }

    console.error('Unable to create profile:', error.message);
    return res.status(500).json({ error: 'Unable to save your profile.' });
  }
});

app.put('/me/profile', sessionAuthHandler, async (req, res) => {
  res.set('Cache-Control', 'no-store');

  const username = typeof req.body?.username === 'string'
    ? req.body.username.trim()
    : '';
  const avatarColor = typeof req.body?.avatarColor === 'string'
    ? req.body.avatarColor.trim().toUpperCase()
    : '';

  if (!/^[A-Za-z0-9_]{2,20}$/.test(username)) {
    return res.status(400).json({
      code: 'INVALID_USERNAME',
      error: 'Username must be 2–20 characters using only letters, numbers, and underscores.',
    });
  }

  if (!/^#[0-9A-F]{6}$/.test(avatarColor)) {
    return res.status(400).json({
      code: 'INVALID_AVATAR_COLOR',
      error: 'Avatar color must be a six-digit hex color.',
    });
  }

  try {
    const result = await pool.query(
      `UPDATE userInfo
       SET username = $1, avatar_color = $2
       WHERE user_id = $3
       RETURNING username, avatar_color`,
      [username, avatarColor, req.userId]
    );

    const profile = result.rows[0];

    if (!profile) {
      return res.status(404).json({ error: 'Unable to find your profile.' });
    }

    return res.status(200).json({
      profile: {
        username: profile.username,
        avatarColor: profile.avatar_color,
      },
    });
  }
  catch (error) {
    if (
      error.code === '23505' &&
      error.constraint === 'userinfo_username_key'
    ) {
      return res.status(409).json({
        code: 'USERNAME_TAKEN',
        error: 'That username is already taken.',
      });
    }

    console.error('Unable to update profile:', error.message);
    return res.status(500).json({ error: 'Unable to save your profile.' });
  }
});

//refresh session
app.post('/auth/refresh', refreshSessionHandler);

//revoke the session identified by a verified refresh token
app.post('/revokeSession', revokeSessionHandler);

app.listen(PORT, () => {
  console.log(`Jelly backend running at http://localhost:${PORT}`);
});
