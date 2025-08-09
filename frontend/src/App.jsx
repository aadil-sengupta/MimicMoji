import {BrowserRouter as Router, Route, Routes} from "react-router-dom";
import Home from "./pages/Home"
import Room from "./pages/Room"
import GameRoom from "./pages/GameRoom";
import AppProviders from "./AppProviders";


const App = () => {
  return (
    <AppProviders>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/room" element={<Room />} />
          <Route path="/room/:id" element={<Room />} />
          <Route path="/game" element={<GameRoom />} />
        </Routes>
      </Router>
    </AppProviders>
  )
}

export default App