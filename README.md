# Flattles Middleware

This is an ExpressJS server acting as a middle-man, or middleware, to the rest of the game. Incoming and outgoing requests, database operations, and other interactions between hardware, software, and database alike are handled by the middleware. This is to ensure issues such as race conditions or duplicate sources of truth are not an issue. This does increase the overall complexity, however the tradeoff of increased complexity for not encountering these issue is one we valued as an overall net positive

## Run The Project

First, clone the repository

Next, navigate to your project directory using `cd [project file location]/flattes-middleware`

Next, run the command `npm install` to install all the necessary dependencies.

Next, start your postgres server

Finally, run the command `npm run dev`. This runs the project, sets up the database, and adds a watcher to the project that way you do not need to restart the project after every change to the server (Note: This NodeJS feature is currently in beta and could be changed/broken at any time)