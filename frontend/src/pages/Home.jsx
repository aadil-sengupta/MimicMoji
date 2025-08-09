
import { useNavigate } from "react-router-dom";
import "../css/Home.css";
import { useWebSocket } from "../WebSocketContext";

function Home() {
  const nav = useNavigate();
  // Access WebSocket context if needed
  const { ws, isConnected } = useWebSocket();

  return (
    <div className="HomePage">
      <h1 className="homepage-title">MimicEmoji</h1>
      <p className="homepage-subtext">Emoji Charade</p>
      <button className="joinroom-btn" onClick={() => nav("/joingame")}>Join Room</button>
      <button className="createroom-btn" onClick={() => nav("/creategame")}>Create Room</button>
      {/* Example: show connection status */}
      {/* <div>{isConnected ? "WebSocket Connected" : "WebSocket Disconnected"}</div> */}
    </div>
  );
}

export default Home;