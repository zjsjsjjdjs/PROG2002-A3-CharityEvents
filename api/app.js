// Passenger's conventional entry point; API server stays importable by tests.
require("./config");
const mode = process.env.APP_FRONTEND || "legacy";
if (!["legacy", "angular"].includes(mode))
  throw new Error("APP_FRONTEND must be legacy or angular.");
const app =
  mode === "angular"
    ? require("./angular-server").createAngularServer()
    : require("./server");
require("./start")(app);
