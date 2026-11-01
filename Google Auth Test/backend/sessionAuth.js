const crypto = require('node:crypto');

module.exports = function createSessionAuth(pool) {
  //helper functions to create and hash tokens
  function generateToken() {
    return crypto.randomBytes(32).toString('hex');
  }

  function hashToken(token) {
    return crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');
  }

  //generate a jelly user session
  async function createSession(userId) {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const sessionResult = await client.query(
        `INSERT INTO sessions (user_id, expires_at)
         VALUES ($1, now() + interval '30 days')
         RETURNING id, expires_at`,
        [userId]
      );

      const session = sessionResult.rows[0];

      const accessToken = generateToken();
      const refreshToken = generateToken();

      const accessResult = await client.query(
        `INSERT INTO access_tokens
           (session_id, token_hash, expires_at)
         VALUES ($1, $2, now() + interval '15 minutes')
         RETURNING expires_at`,
        [session.id, hashToken(accessToken)]
      );

      await client.query(
        `INSERT INTO refresh_tokens
           (session_id, token_hash, expires_at)
         VALUES ($1, $2, $3)`,
        [
          session.id,
          hashToken(refreshToken),
          session.expires_at,
        ]
      );

      await client.query('COMMIT');

      return {
        accessToken,
        refreshToken,
        accessTokenExpiresAt: accessResult.rows[0].expires_at,
        sessionExpiresAt: session.expires_at,
      };
    }
    catch (error) {
      try {
        await client.query('ROLLBACK');
      }
      catch (rollbackError) {
        console.error('Session rollback failed:', rollbackError.message);
      }

      throw error;
    }
    finally {
      client.release();
    }
  }

  async function sessionAuthHandler(req, res, next) {
    //deconstruct the Auth header
    const authorization = req.get('Authorization') || '';
    //token should be exactly 64 chars hexa
    const match = /^Bearer ([a-f0-9]{64})$/i.exec(authorization);

    if (!match) {
      return res.status(401).json({
        error: 'An access token is required.',
      });
    }

    const token = match[1];

    //look for the hashed token in database
    try {
      const result = await pool.query(
        `SELECT
            sessions.id AS session_id,
            sessions.user_id
        FROM access_tokens
        JOIN sessions
            ON access_tokens.session_id = sessions.id
        WHERE access_tokens.token_hash = $1
            AND access_tokens.expires_at > now()
            AND sessions.expires_at > now()
            AND sessions.revoked_at IS NULL`,
        [hashToken(token)]
      );

      //couldn't find row OR invalid token (expired)
      if (result.rows.length === 0) {
        return res.status(401).json({
          error: 'Your session or access token is invalid or expired.',
        });
      }

      //copy retrieved IDs from database into requested object
      req.userId = result.rows[0].user_id;
      req.sessionId = result.rows[0].session_id;

      //authentication complete => next handler
      next();
    }
    catch (error) {
      console.error('Session verification failed:', error.message);

      return res.status(500).json({
        error: 'Unable to verify your session.',
      });
    }
  }

  async function refreshSessionHandler(req, res) {
    res.set('Cache-Control', 'no-store');

    //make sure refresh token format recieved is correct
    const { refreshToken } = req.body || {};
    if (
      typeof refreshToken !== 'string' ||
      !/^[a-f0-9]{64}$/.test(refreshToken)
    ) {
      return res.status(400).json({
        error: 'A valid refresh token is required.',
      });
    }

    let client;

    try {
      //set up client connection -> begin transaction
      client = await pool.connect();
      await client.query('BEGIN');

      /**tries to find the hashed refresh token -> returns:
        refresh_token_id,
        r.session_id,
        r.used_at,
        r.expires_at AS refresh_expires_at,
        s.expires_at AS session_expires_at,
        s.revoked_at
      */
      const result = await client.query(
        `SELECT
          r.id AS refresh_token_id,
          r.session_id,
          r.used_at,
          r.expires_at AS refresh_expires_at,
          s.expires_at AS session_expires_at,
          s.revoked_at
        FROM refresh_tokens AS r
        JOIN sessions AS s ON r.session_id = s.id
        WHERE r.token_hash = $1
        FOR UPDATE OF s, r`,
        [hashToken(refreshToken)]
      );

      const stored = result.rows[0];

      //if refresh token wasn't found, session revoked or expired -> sign in again
      if (
        !stored ||
        stored.revoked_at !== null ||
        new Date(stored.session_expires_at).getTime() <= Date.now()
      ) {
        //reverse db transaction
        await client.query('ROLLBACK');

        return res.status(401).json({
          error: 'Please sign in again.',
        });
      }

      //is refresh token somehow already used (we don't know how) -> sign in again
      if (stored.used_at !== null) {
        await client.query(
          `UPDATE sessions
          SET revoked_at = now()
          WHERE id = $1`,
          [stored.session_id]
        );

        //now session is revoked -> force sign in again
        await client.query('COMMIT');

        return res.status(401).json({
          error: 'Please sign in again.',
        });
      }

      //if refresh token is expired -> sign in again
      if (
        new Date(stored.refresh_expires_at).getTime() <= Date.now()
      ) {
        await client.query('ROLLBACK');

        return res.status(401).json({
          error: 'Please sign in again.',
        });
      }

      //refresh token is valid -> generate new tokens 
      const accessToken = generateToken();
      const newRefreshToken = generateToken();

      //update current refresh token to be used
      await client.query(
        `UPDATE refresh_tokens
        SET used_at = now()
        WHERE id = $1`,
        [stored.refresh_token_id]
      );

      //insert access token + refresh token into db
      const accessResult = await client.query(
        `INSERT INTO access_tokens
          (session_id, token_hash, expires_at)
        VALUES (
          $1,
          $2,
          LEAST(
            clock_timestamp() + interval '15 minutes',
            $3::timestamptz
          )
        )
        RETURNING expires_at`,
        [
          stored.session_id,
          hashToken(accessToken),
          stored.session_expires_at,
        ]
      );
      await client.query(
        `INSERT INTO refresh_tokens
          (session_id, token_hash, expires_at)
        VALUES ($1, $2, $3)`,
        [
          stored.session_id,
          hashToken(newRefreshToken),
          stored.session_expires_at,
        ]
      );

      await client.query('COMMIT');

      //return the tokens to the front end
      return res.status(200).json({
        accessToken,
        refreshToken: newRefreshToken,
        //accessTokenExpiresAt: accessResult.rows[0].expires_at,
        //sessionExpiresAt: stored.session_expires_at,
      });
    } 
    //catch client/rollback errors
    catch (error) {
      if (client) {
        try {
          await client.query('ROLLBACK');
        } catch (rollbackError) {
          console.error('Refresh rollback failed:', rollbackError.message);
        }
      }

      //unable to refresh msg
      console.error('Unable to refresh session:', error.message);
      return res.status(500).json({
        error: 'Unable to refresh your session.',
      });
    } 
    //release pool connection
    finally {
      if (client) {
        client.release();
      }
    }
  }

  async function revokeSessionHandler(req, res) {
    res.set('Cache-Control', 'no-store');

    //validate refresh token
    const { refreshToken } = req.body || {};
    if (
      typeof refreshToken !== 'string' ||
      !/^[a-f0-9]{64}$/.test(refreshToken)
    ) {
      return res.status(400).json({
        error: 'A valid refresh token is required.',
      });
    }

    try {
      //find hashes refresh token, find its session, update session revoked
      const result = await pool.query(
        `UPDATE sessions AS s
        --COALSCE return first value given to it that isn't null
        SET revoked_at = COALESCE(s.revoked_at, now())
        FROM refresh_tokens AS r
        WHERE r.session_id = s.id
          AND r.token_hash = $1
        RETURNING s.id`,
        [hashToken(refreshToken)]
      );

      //unable to find hashed refresh token -> invalid refresh token
      if (result.rows.length === 0) {
        return res.status(401).json({
          error: 'The refresh token is invalid.',
        });
      }

      return res.status(204).send();
    }
    catch (error) {
      console.error('Unable to revoke session:', error.message);
      return res.status(500).json({
        error: 'Unable to revoke your session.',
      });
    }
  }

  return {
    createSession,
    sessionAuthHandler,
    refreshSessionHandler,
    revokeSessionHandler,
  };
};
