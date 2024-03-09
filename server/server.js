const express = require("express");
const cors = require("cors");
const e = require("express");
const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

const recordedEvents = [];

app.post("/record", (req, res) => {
  const { events } = req.body;
  // console.log("batch of events:", events);
  // let consolePayloads = events.filter((obj) => obj.data.plugin);
  // if (consolePayloads.length > 0) {
  //   consolePayloads.forEach((consolePayload) => {
  //     console.log("Payload: ", consolePayload);
  //   });
  // } else {
  //   console.log("No console payload");
  // }

  // let networkEventPayload = events.filter((obj) => obj.type === 200);
  // if (networkEventPayload.length > 0) {
  //   networkEventPayload.forEach((event) => {
  //     console.log("Network event: ", event);
  //   });
  // } else {
  //   console.log("No network event payload");
  // }

  recordedEvents.push({ events });
  res.sendStatus(200);
});

app.get("/getRecordedEvents", (req, res) => {
  res.json(recordedEvents);
});

app.get("/random", (req, res) => {
  res.json("aslkdfgnalksgnalksdgnaksl");
});

app.delete("/deleteTest", (req, res) => {
  res.status(305).json("deleted");
});

app.listen(port, () => {
  console.log(`Backend server is running at http://localhost:${port}`);
});
