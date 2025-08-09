
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import "../css/Home.css";
import { useWebSocket } from "../WebSocketContext";
import { useUsername } from "../UsernameContext";

function Home() {
  console.log('Home component rendering...');
  
  const nav = useNavigate();
  const { ws, isConnected } = useWebSocket();
  const { username, setUsername, setRandomUsername, isUsernameSet } = useUsername();
  
  const [showUsernameEdit, setShowUsernameEdit] = useState(false);
  const [tempUsername, setTempUsername] = useState(username || '');
  const [roomCode, setRoomCode] = useState('');
  const [showRoomCodeInput, setShowRoomCodeInput] = useState(false);

  // Debug logging
  useEffect(() => {
    console.log('Home component mounted');
    console.log('Username:', username);
    console.log('IsConnected:', isConnected);
  }, [username, isConnected]);

  // Update tempUsername when username changes from context
  useEffect(() => {
    setTempUsername(username || '');
  }, [username]);

  const handleUsernameChange = () => {
    if (tempUsername.trim() && tempUsername.trim() !== username) {
      setUsername(tempUsername.trim());
    }
    setShowUsernameEdit(false);
  };

  const handleRandomUsername = () => {
    const newUsername = setRandomUsername();
    setTempUsername(newUsername);
    setShowUsernameEdit(false);
  };

  const handleEditClick = () => {
    setTempUsername(username);
    setShowUsernameEdit(true);
  };

  const handleCancelEdit = () => {
    setTempUsername(username);
    setShowUsernameEdit(false);
  };

  const handleJoinRoom = () => {
    if (!roomCode.trim()) {
      alert('Please enter a room code');
      return;
    }
    
    if (!isConnected) {
      alert('Not connected to server. Please wait and try again.');
      return;
    }

    // Navigate to join room page with the room code
    nav(`/room?roomCode=${roomCode.trim().toUpperCase()}`);
  };

  const handleRoomCodeKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleJoinRoom();
    }
  };

  const toggleRoomCodeInput = () => {
    setShowRoomCodeInput(!showRoomCodeInput);
    setRoomCode('');
  };

  // Debug function to check button state
  const isJoinButtonDisabled = !roomCode.trim();
  
  console.log('Room code:', roomCode);
  console.log('Room code trimmed:', roomCode.trim());
  console.log('Is connected:', isConnected);
  console.log('Join button disabled:', isJoinButtonDisabled);

  return (
    <div className="HomePage">
      <h1 className="homepage-title">MimicEmoji</h1>
      <p className="homepage-subtext">Emoji Charade</p>
      
      {/* Fun Username Section */}
      <div className="username-section">
        <div className="username-display">
          <span className="username-label">Playing as:</span>
          {!showUsernameEdit ? (
            <div className="username-info">
              <span className="username-value">🎭 {username || 'Anonymous'}</span>
              <button className="username-edit-btn" onClick={handleEditClick}>
                ✏️
              </button>
            </div>
          ) : (
            <div className="username-edit">
              <input
                type="text"
                value={tempUsername}
                onChange={(e) => setTempUsername(e.target.value)}
                className="username-input"
                placeholder="Enter your username..."
                maxLength="20"
                autoFocus
                onKeyPress={(e) => e.key === 'Enter' && handleUsernameChange()}
              />
              <div className="username-buttons">
                <button className="username-save-btn" onClick={handleUsernameChange}>
                  ✅
                </button>
                <button className="username-cancel-btn" onClick={handleCancelEdit}>
                  ❌
                </button>
              </div>
            </div>
          )}
        </div>
        
        <button className="random-username-btn" onClick={handleRandomUsername}>
          🎲 Surprise Me!
        </button>
      </div>

      {/* Connection Status */}
      <div className="connection-status">
        <span className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`}>
          {isConnected ? '🟢 Ready to Play!' : '🔴 Connecting...'}
        </span>
      </div>

      {/* Room Code Section */}
      <div className="room-code-section">
        <div className="room-code-header">
          <h3 className="room-code-title">Have a Room Code?</h3>
          <button 
            className="room-code-toggle-btn" 
            onClick={toggleRoomCodeInput}
          >
            {showRoomCodeInput ? '❌ Cancel' : '🔗 Enter Code'}
          </button>
        </div>
        
        {showRoomCodeInput && (
          <div className="room-code-input-section">
            <div className="room-code-input-container">
              <input
                type="text"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                onKeyPress={handleRoomCodeKeyPress}
                className="room-code-input"
                placeholder="Enter room code (e.g., ABC123DEF)"
                maxLength="9"
                autoFocus
              />
              <button 
                className="join-with-code-btn" 
                onClick={handleJoinRoom}
                disabled={isJoinButtonDisabled}
              >
                🚀 Join Room
              </button>
            </div>
            <p className="room-code-hint">
              Room codes are 9 characters long (letters and numbers)
            </p>
          </div>
        )}
      </div>

      <button className="createroom-btn" onClick={() => nav("/room")}>Create Room</button>
    </div>
  );
}

export default Home;