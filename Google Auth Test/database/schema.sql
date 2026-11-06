create table googleUsers(
	id integer generated always as identity primary key,
	gSub text not null unique,
	username text not null,
	email text not null
);

create table sessions (
	id integer generated always as identity primary key,
	user_id integer NOT NULL REFERENCES googleusers(id) ON DELETE CASCADE,
    created_at timestamptz NOT NULL DEFAULT now(),
    expires_at timestamptz NOT NULL,
    revoked_at timestamptz
);

CREATE TABLE access_tokens (
    id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    session_id integer NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    token_hash text NOT NULL UNIQUE,
    created_at timestamptz NOT NULL DEFAULT now(),
    expires_at timestamptz NOT NULL
);

CREATE TABLE refresh_tokens (
    id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    session_id integer NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    token_hash text NOT NULL UNIQUE,
    created_at timestamptz NOT NULL DEFAULT now(),
    expires_at timestamptz NOT NULL,
    used_at timestamptz
);

CREATE TABLE userInfo (
    id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id integer NOT NULL UNIQUE REFERENCES googleUsers(id) ON DELETE CASCADE,
    username text NOT NULL UNIQUE,
    avatar_color text NOT NULL
);

create index access_tokens_session_id_idx
on access_tokens (session_id);

create index refresh_tokens_session_id_idx
on refresh_tokens (session_id);
