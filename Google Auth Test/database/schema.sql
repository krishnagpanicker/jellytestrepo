create table googleUsers(
	id integer generated always as identity primary key,
	gSub text not null unique,
	username text not null,
	email text not null
);