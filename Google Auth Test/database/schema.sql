create table users(
	id integer generated always as identity primary key,
	username text not null unique,
	passwordHash text not null
);