-- Phase 1: base tables (the original Neon schema was not in the repo; this is inferred
-- from the columns the API routes read/write). Run in the Supabase SQL editor.
create table if not exists users (
  id serial primary key,
  name varchar(100) not null,
  email varchar(100) unique not null,
  clerk_id varchar(50) unique not null,
  created_at timestamp default now()
);

create table if not exists drivers (
  id serial primary key,
  first_name varchar(100) not null,
  last_name varchar(100) not null,
  profile_image_url text,
  car_image_url text,
  car_seats integer not null default 4,
  rating decimal(3,2) default 5.00
);

create table if not exists rides (
  ride_id serial primary key,
  origin_address varchar(255) not null,
  destination_address varchar(255) not null,
  origin_latitude decimal(9,6) not null,
  origin_longitude decimal(9,6) not null,
  destination_latitude decimal(9,6) not null,
  destination_longitude decimal(9,6) not null,
  ride_time integer not null,
  fare_price decimal(10,2) not null,
  payment_status varchar(20) not null,
  driver_id integer references drivers(id),
  user_id varchar(100) not null,
  created_at timestamp default now()
);

-- Sample drivers so the existing "find ride" screen has data (images left null).
insert into drivers (first_name, last_name, car_seats, rating) values
  ('James','Wilson',4,4.80),('David','Brown',4,4.60),
  ('Michael','Johnson',4,4.70),('Robert','Lee',6,4.90)
on conflict do nothing;
