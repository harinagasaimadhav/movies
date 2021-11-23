const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const app = express();

const dbPath = path.join(__dirname, "moviesData.db");
app.use(express.json());

let db = null;

// intialize DB and server
const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () =>
      console.log("Server Running at: http://localhost:3000/")
    );
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

// converting movie table dbObject to response Object
const convertMovieDbObjToResponseObj = (dbObject) => {
  return {
    movieId: dbObject.movie_id,
    directorId: dbObject.director_id,
    movieName: dbObject.movie_name,
    leadActor: dbObject.lead_actor,
  };
};

// converting director table dbObject to response Object
const convertDirectorDbObjToResponseObj = (dbObject1) => {
  return {
    directorId: dbObject1.director_id,
    directorName: dbObject1.director_name,
  };
};

// API's
// get movies list from database
app.get("/movies/", async (request, response) => {
  const getMoviesQuery = `
        SELECT movie_name
        FROM movie;`;
  const movieList = await db.all(getMoviesQuery);
  response.send(
    movieList.map((eachMovie) => ({ movieName: eachMovie.movie_name }))
  );
});

// add movie to Database
app.post("/movies/", async (request, response) => {
  const { directorId, movieName, leadActor } = request.body;
  const addMovieQuery = `
        INSERT INTO movie (director_id, movie_name, lead_actor)
        VALUES (${directorId}, "${movieName}", "${leadActor}");`;
  await db.run(addMovieQuery);
  response.send("Movie Successfully Added");
});

// get movie details
app.get("/movies/:movieId/", async (request, response) => {
  const { movieId } = request.params;
  const getMovieDetailsQuery = `
        SELECT *
        FROM movie
        WHERE movie_id = ${movieId};`;
  const movieDetails = await db.get(getMovieDetailsQuery);
  console.log(movieDetails);
  response.send(convertMovieDbObjToResponseObj(movieDetails));
});

// update movie details
app.put("/movies/:movieId/", async (request, response) => {
  const { movieId } = request.params;
  const { directorId, movieName, leadActor } = request.body;
  const updateDetailsQuery = `
        UPDATE 
            movie 
        SET 
            director_id = ${directorId},
            movie_name = '${movieName}',
            lead_actor = '${leadActor}'
        WHERE 
            movie_id = ${movieId};`;
  await db.run(updateDetailsQuery);
  response.send("Movie Details Updated");
});

//Delete movie details
app.delete("/movies/:movieId/", async (request, response) => {
  const { movieId } = request.params;
  const deleteMovieQuery = `
        DELETE FROM movie
        WHERE movie_id = ${movieId};`;
  await db.run(deleteMovieQuery);
  response.send("Movie Removed");
});

//get list of all directors
app.get("/directors/", async (request, response) => {
  const getAllDirectorsQuery = `
        SELECT *
        FROM director;`;
  const allDirectorsList = await db.all(getAllDirectorsQuery);
  response.send(
    allDirectorsList.map((eachDirector) =>
      convertDirectorDbObjToResponseObj(eachDirector)
    )
  );
});

// get all movies directed by a director
app.get("/directors/:directorId/movies/", async (request, response) => {
  const { directorId } = request.params;
  const getAllMoviesFromDirectorQuery = `
        SELECT movie_name
        FROM movie
        WHERE director_id = ${directorId};`;
  const allMoviesFromDirectorList = await db.all(getAllMoviesFromDirectorQuery);
  response.send(
    allMoviesFromDirectorList.map((eachMovieName) => ({
      movieName: eachMovieName.movie_name,
    }))
  );
});

module.exports = app;
