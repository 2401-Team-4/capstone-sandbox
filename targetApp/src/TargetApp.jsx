import React, { useEffect } from "react";
import { record, getRecordConsolePlugin } from "rrweb";

const TargetApp = () => {
  let events = [];

  const originalFetch = window.fetch;
  window.fetch = async (...args) => {
    let [resource, config] = args;
    // Type 50 arbitrarily assigned for us to know it's a network event object in the array of event objects
    const networkEventObj = { type: 50 };

    // Request Interceptor
    fetchRequestInterceptor(resource, config, networkEventObj);

    const response = await originalFetch(resource, config);

    // Response Interceptor
    fetchResponseInterceptor(response, networkEventObj);
    events.push(networkEventObj);
    return response;
  };

  const fetchRequestInterceptor = (resource, config, networkEventObj) => {
    //still need to handle if resource is a Request object opposed to URL

    networkEventObj.data = {
      url: resource,
      type: "FETCH",
      requestMadeAt: Date.now(),
      // headers: config.headers
      // body: config.body.slice(0, 120),
    };

    let method;
    if (config === undefined) {
      method = "GET";
    } else {
      method = config.method ? config.method : "GET";
    }
    networkEventObj.data.method = method;
  };

  const fetchResponseInterceptor = (response, networkEventObj) => {
    const currentTime = Date.now();
    // assigning timestamp at this point to ensure network event is pushed to event array in correct order related to other events
    // need to wait till response received to push the object as we need the status of the response
    networkEventObj.timestamp = currentTime;
    networkEventObj.data.responseReceivedAt = currentTime;
    networkEventObj.data.latency =
      networkEventObj.data.responseReceivedAt -
      networkEventObj.data.requestMadeAt;
    networkEventObj.data.status = response.status;
  };

  const stopRecording = record({
    emit(event) {
      events.push(event);

      const defaultLog = console.log["__rrweb_original__"]
        ? console.log["__rrweb_original__"]
        : console.log;
    },
    plugins: [getRecordConsolePlugin()],
  });

  const save = () => {
    const body = JSON.stringify(events);
    console.log(events);
    events = [];
    fetch("http://localhost:3001/record", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body,
    });
  };

  const saveEventsInterval = setInterval(save, 5000);

  // window.addEventListener("beforeunload", (e) => {
  //   stopRecording();
  //   clearInterval(saveEventsInterval);
  //   save();
  //   window.fetch = originalFetch;
  // });

  //This code seems more correct, but alters the event data sent, and misses network requests. Related to async vs sync?
  // const save = async () => {
  //   try {
  //     const body = JSON.stringify(events);
  //     const response = await fetch("http://localhost:3001/record", {
  //       method: "POST",
  //       headers: {
  //         "Content-Type": "application/json",
  //       },
  //       body,
  //     });
  //     // After a successful post to the server, clear the events array
  //     events = [];
  //   } catch (e) {
  //     // If saving is unsuccessful, do not want to wipe events
  //     console.error("Event Save Error: ", e);
  //   }
  // };

  return (
    <>
      <h1 onClick={() => console.log("Hello world clicked")}>Hello world!</h1>
      <h3 onClick={() => console.log("Welcome message clicked")}>
        Welcome to my site!
      </h3>
      <input type="text" onChange={() => console.log("typed in input")}></input>
      <button onClick={() => console.error(new Error())}>
        Click for error
      </button>
      <button
        onClick={() =>
          fetch("http://localhost:3001/random")
            .then((res) => console.log("successful random"))
            .catch((rej) => console.log("failure random"))
        }
      >
        Get Random
      </button>
      <button
        onClick={() =>
          fetch("http://localhost:3001/deleteTest", { method: "DELETE" })
            .then((res) => console.log("successful delete"))
            .catch((rej) => console.log("failure delete"))
        }
      >
        Delete
      </button>
    </>
  );
};

export default TargetApp;
