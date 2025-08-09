import {BrowserRouter as Router, Route, Routes} from "react-router-dom";
import Home from "./pages/Home"
import Join_Room from "./pages/Join_Room"
import CreateRoom from "./pages/CreateRoom"

import GameRoom from "./pages/GameRoom";


const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/joingame" element={<Join_Room />} />
        <Route path="/room/:id" element={<GameRoom />} />
        <Route path="/creategame" element={<CreateRoom/>} />
      </Routes>
    </Router>
  )
}

export default App