import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.daily(
  "snapshot daily stats",
  { hourUTC: 0, minuteUTC: 0 },
  internal.statsSnapshot.snapshotDailyStats
);

export default crons;
