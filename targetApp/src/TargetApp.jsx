import React, { useEffect } from "react";
import { record, getRecordConsolePlugin } from "rrweb";

const TargetApp = () => {
  let events = [];

  const originalFetch = window.fetch;
  window.fetch = function (url, config) {
    // Your Fetch interception logic here
    // Type 200 arbitrarily assigned for us to know it's a network request
    const networkEventObj = { type: 200 };

    networkEventObj.data = {
      url: url,
      method: config.method,
      headers: config.headers,
      body: config.body.slice(0, 120),
      type: "FETCH",
      requestMadeAt: Date.now(),
    };
    // arguments captures arguments to original function, see mdn for more details
    const result = originalFetch.apply(this, arguments);

    result
      .then((res) => {
        const currentTime = Date.now();
        networkEventObj.timestamp = currentTime;
        networkEventObj.data.responseReceivedAt = currentTime;
        networkEventObj.data.latency =
          networkEventObj.data.responseReceivedAt -
          networkEventObj.data.requestMadeAt;

        networkEventObj.data.status = res.status;
        // assigning timestamp at this point to ensure network event is pushed to event array in correct order related to other events
        // need to wait till response received to push the object as we need the status of the response
        events.push(networkEventObj);
        return res;
      })
      .catch((error) => {
        console.error("Fetch Error: ", error);
      });

    return result;
  };

  useEffect(() => {
    const stopRecording = record({
      emit(event) {
        events.push(event);
        //
        //   const defaultLog = console.log["__rrweb_original__"]
        //     ? console.log["__rrweb_original__"]
        //     : console.log;
      },
      plugins: [getRecordConsolePlugin()],
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
      <button onClick={() => console.log(networkRequests)}>Log Requests</button>
    </>
  );
};

export default TargetApp;
