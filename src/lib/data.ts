import { cache } from "react";
import { connection } from "next/server";
import { readCatalogue } from "./backend";
import { INITIAL_MOVIES, INITIAL_SHOWTIMES } from "./mock-data";

// Only public catalogue reads fall back. Accounts and reservations fail closed.
export async function readPublicCatalogue(catalogueCache = false) {
  try {
    return { ...await readCatalogue(catalogueCache), mode: "database" as const };
  } catch {
    return {
      movies: INITIAL_MOVIES,
      showtimes: INITIAL_SHOWTIMES,
      mode: "demo" as const,
    };
  }
}

export const getCatalogue = cache(async () => {
  // CHECK 02 — SSR on details/booking: inventory must be fresh per request.
  await connection();
  return readPublicCatalogue();
});
export async function getMovies() {
  return (await getCatalogue()).movies;
}
export async function getMovieById(id: string) {
  return (await getMovies()).find((movie) => movie.id === id);
}
export async function getShowtimesByMovieId(id: string) {
  return (await getCatalogue()).showtimes.filter(
    (showtime) => showtime.movieId === id,
  );
}
export async function getShowtimeById(id: string) {
  return (await getCatalogue()).showtimes.find(
    (showtime) => showtime.id === id,
  );
}
