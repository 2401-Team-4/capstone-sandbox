import React, { useEffect } from "react";
import { record, getRecordConsolePlugin } from "rrweb";

const TargetApp = () => {
  let events = [];

  const originalFetch = window.fetch;
  window.fetch = async (url, config) => {
    // Request Interceptor
    // Type 200 arbitrarily assigned for us to know it's a network request
    const networkEventObj = { type: 200 };
    networkEventObj.data = {
      url: url,
      method: config ? config.method : "GET",
      // headers: config.headers
      // body: config.body.slice(0, 120),
      type: "FETCH",
      requestMadeAt: Date.now(),
    };

    const response = await originalFetch(url, config);

    // Response Interceptor
    const currentTime = Date.now();
    networkEventObj.timestamp = currentTime;
    networkEventObj.data.responseReceivedAt = currentTime;
    networkEventObj.data.latency =
      networkEventObj.data.responseReceivedAt -
      networkEventObj.data.requestMadeAt;
    networkEventObj.data.status = response.status;

    events.push(networkEventObj);

    if (!response.ok) {
      return Promise.reject(response);
    }

    return response;
    // result
    //   .then((res) => {
    //     console.log("got in then");
    //     if (!res.ok) {
    //       console.log("res is not okay");
    //     }

    //     networkEventObj.data.status = res.status;
    //     // assigning timestamp at this point to ensure network event is pushed to event array in correct order related to other events
    //     // need to wait till response received to push the object as we need the status of the response
    //     events.push(networkEventObj);
    //     // may be redundant, seems can get to the .then handler without the return statement
    //     return res;
    //   })
    //   // .catch(() => {});
    //   .catch((error) => {
    //     console.error("Fetch Error: ", error);
    //     const currentTime = Date.now();
    //     networkEventObj.timestamp = currentTime;
    //     networkEventObj.data.responseReceivedAt = currentTime;
    //     networkEventObj.data.latency =
    //       networkEventObj.data.responseReceivedAt -
    //       networkEventObj.data.requestMadeAt;

    //     networkEventObj.data.status = "ERROR";
    //     console.log("got right before push");
    //     console.log(networkEventObj);
    //     events.push(networkEventObj);
    //   });

    // return result;
  };

  useEffect(() => {
    const stopRecording = record({
      emit(event) {
        events.push(event);

        // const defaultLog = console.log["__rrweb_original__"]
        //   ? console.log["__rrweb_original__"]
        //   : console.log;
      },
      plugins: [
        getRecordConsolePlugin({
          stringifyOptions: { stringLengthLimit: 250 },
        }),
      ],
    });

    const saveEventsInterval = setInterval(save, 10000);

    const handleBeforeUnload = () => {
      stopRecording();
      save();
      clearInterval(saveEventsInterval);
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    // Cleanup on unmount
    // may be unnecessary to explicitly stop recording and clear interval
    // but could be good to ensure no memory leak
    return () => {
      handleBeforeUnload();
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  const save = () => {
    const body = JSON.stringify({ events });
    events = [];
    fetch("http://localhost:3001/record", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body,
    });
  };

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
