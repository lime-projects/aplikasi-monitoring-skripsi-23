## install module

> npm install

## menjalankan server

> npm run dev

server berjalan pada url http://localhost:5001

## membuat database
> npx sequelize-cli db:create

## membuat model
> npx sequelize-cli model:generate --name User --attributes firstName:string,lastName:string,fullName:string

## migrasi model ke database
> npx sequelize-cli db:migrate

## rollback migrasi
> npx sequelize-cli db:migrate:undo --name [nama file migrasi pada folder migrations].js
