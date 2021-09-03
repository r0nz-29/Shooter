import React from "react";
import { makeScene } from "./scene";
import "./App.css";

const App = () => {
  const blocker = React.useRef(null);
  const instructions = React.useRef(null);
  React.useEffect(() => {
    makeScene(blocker.current, instructions.current);
  }, []);
  return (
    <div id="blocker" ref={blocker}>
      <div id="instructions" ref={instructions}>
        <p style={{ fontSize: "48px" }}>Click to play</p>
        <p>
          Move: WASD
          <br />
          Fire: Click
          <br />
          Look: MOUSE
        </p>
      </div>
    </div>
  );
};

export default App;
