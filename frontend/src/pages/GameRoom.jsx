import React, { useState, useEffect } from 'react';
import { useWebSocket } from '../WebSocketContext';

const GameRoom = ({ roomData = {}, onLeaveRoom = () => {} }) => {
  const { ws, isConnected, sendMessage } = useWebSocket();
  // =============================================================================
  // WEBSOCKET MESSAGE HANDLING
  // =============================================================================
  
  useEffect(() => {
    if (!ws) return;

    const handleMessage = (event) => {
      const data = JSON.parse(event.data);
      console.log('Received WebSocket message:', data);
      
      switch (data.type) {
        case 'connection_ready':
          // Send username when connection is ready
          sendMessage({
            type: 'user',
            username: username
          });
          break;
          
        case 'room_created':
          console.log('Room created:', data.room_id);
          setPlayers([{ id: username, name: username }]);
          break;
          
        case 'joined_room':
          console.log('Joined room:', data.room_id);
          setPlayers(data.participants.map(name => ({ id: name, name })));
          break;
          
        case 'participants_updated':
          console.log('Participants updated:', data.participants);
          setPlayers(data.participants.map(name => ({ id: name, name })));
          
          if (data.action === 'user_joined') {
            console.log(`${data.username} joined the room`);
          } else if (data.action === 'user_left') {
            console.log(`${data.username} left the room`);
          }
          break;
          
        case 'error':
          setError(data.message);
          break;
          
        default:
          console.log('Unhandled message type:', data.type);
      }
    };

    ws.addEventListener('message', handleMessage);
    
    return () => {
      ws.removeEventListener('message', handleMessage);
    };
  }, [ws, username, sendMessage]);
  if (!roomData.roomId) {
    return (
      <div className="game-room-container">
        <div className="error-message">
          <span className="error-icon">⚠️</span>
          No room data provided. Please create a room first.
          <button 
            className="error-dismiss" 
            onClick={onLeaveRoom}
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }
  
  // Game state
  const [players, setPlayers] = useState([]);
  const [currentRound, setCurrentRound] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [submissions, setSubmissions] = useState([]);
  const [currentSubmission, setCurrentSubmission] = useState('');
  const [shareableLink, setShareableLink] = useState('');
  const [username, setUsername] = useState('Host');
  
  // Loading and error states
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // =============================================================================
  // BACKEND API CALLS - CONNECT THESE TO YOUR BACKEND
  // =============================================================================
  
  // Start game API call
  const startGameAPI = async (roomId) => {
    // TODO: Connect to your backend
    // Example:
    
    const response = await fetch(`${API_BASE_URL}/api/rooms/${roomId}/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || 'Failed to start game');
    }
    return result;
    
    
    // MOCK RESPONSE - Remove this and use real API
   
  };

  // Submit guess API call
  const submitGuessAPI = async (roomId, guess, playerId, roundNumber) => {
    // TODO: Connect to your backend
    // Example:
    
    const response = await fetch(`${API_BASE_URL}/api/rooms/${roomId}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        guess: guess, 
        player_id: playerId, 
        round: roundNumber 
      })
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || 'Failed to submit guess');
    }
    return result;
    
  };

  // Get room status API call
  const getRoomStatusAPI = async (roomId) => {
    // TODO: Connect to your backend
    // Example:
   
    const response = await fetch(`${API_BASE_URL}/api/rooms/${roomId}/status`);
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || 'Failed to get room status');
    }
    return result;
  };

  // =============================================================================
  // INITIALIZATION
  // =============================================================================
  
  useEffect(() => {
    // Create shareable link when component mounts
    if (roomData?.roomCode) {
      const link = `${window.location.origin}/join/${roomData.roomCode}`;
      setShareableLink(link);
    }
    
    // Create or join room when component mounts
    if (isConnected && roomData?.roomId) {
      // If we have a roomId, try to join it
      sendMessage({
        type: 'join_room',
        room_id: roomData.roomId
      });
    } else if (isConnected && !roomData?.roomId) {
      // If no roomId, create a new room
      sendMessage({
        type: 'create_room'
      });
    }
  }, [isConnected, roomData?.roomCode, roomData?.roomId, sendMessage]);

  // =============================================================================
  // GAME LOGIC
  // =============================================================================
  
  const handleStartGame = () => {
    if (players.length < 2) {
      setError('Need at least 2 players to start the game');
      return;
    }

    setIsLoading(true);
    setError('');

    // Send start game message via WebSocket
    sendMessage({
      type: 'start_game'
    });
    
    // For now, start the game locally (you can enhance this with server validation)
    setTimeout(() => {
      setGameStarted(true);
      setCurrentRound(1);
      setSubmissions([]);
      setIsLoading(false);
    }, 1000);
  };

  const handleSubmitGuess = () => {
    if (!currentSubmission.trim()) {
      setError('Please enter a guess before submitting');
      return;
    }

    if (!gameStarted) {
      setError('Game hasn\'t started yet');
      return;
    }

    setIsLoading(true);
    setError('');

    // Send submission via WebSocket
    sendMessage({
      type: 'submit_guess',
      guess: currentSubmission.trim(),
      round: currentRound
    });

    // Add submission to local state immediately
    const newSubmission = {
      id: Date.now().toString(),
      text: currentSubmission.trim(),
      player: username,
      playerId: username
    };
    
    setSubmissions(prev => [...prev, newSubmission]);
    setCurrentSubmission(''); // Clear input
    setIsLoading(false);
  };

  // =============================================================================
  // UTILITY FUNCTIONS
  // =============================================================================
  
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareableLink);
      alert('Shareable link copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy link:', err);
      // Fallback method
      const textArea = document.createElement('textarea');
      textArea.value = shareableLink;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      alert('Shareable link copied to clipboard!');
    }
  };

  // Add demo player for testing
  const addDemoPlayer = () => {
    const demoNames = ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve', 'Frank'];
    const availableNames = demoNames.filter(name => 
      !players.find(p => p.name === name)
    );
    
    if (availableNames.length > 0 && players.length < (roomData?.maxPlayers || 4)) {
      const newPlayer = {
        id: 'demo_' + Date.now(),
        name: availableNames[0]
      };
      setPlayers(prev => [...prev, newPlayer]);
    }
  };

  const handleLeaveRoom = () => {
    if (window.confirm('Are you sure you want to leave the room?')) {
      onLeaveRoom();
    }
  };

  // =============================================================================
  // RENDER GAME ROOM
  // =============================================================================
  
  return (
    <div className="game-room-container">
      {/* Room Header */}
      <div className="room-header">
        <h1 className="room-title">{roomData?.roomName || 'Game Room'}</h1>
        <div className="connection-status">
          <span className={`connection-indicator ${isConnected ? 'connected' : 'disconnected'}`}>
            {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
          </span>
        </div>
        <div className="room-info">
          <div className="room-code-section">
            <span className="room-code-label">Room Code:</span>
            <span className="room-code">{roomData?.roomCode || 'N/A'}</span>
          </div>
          <div className="room-settings">
            <span>Max Players: {roomData?.maxPlayers || 4}</span>
            <span>Total Rounds: {roomData?.totalRounds || 3}</span>
          </div>
        </div>
      </div>

      {/* Shareable Link Section */}
      <div className="share-section">
        <h3 className="share-title">Invite Players to Join</h3>
        <p className="share-description">
          Share this link with friends so they can join your game:
        </p>
        <div className="share-link-container">
          <input 
            type="text" 
            value={shareableLink} 
            readOnly 
            className="share-link-input"
          />
          <button onClick={copyLink} className="copy-link-button">
            Copy Link
          </button>
        </div>
        <div className="demo-section">
          <button 
            onClick={addDemoPlayer} 
            className="demo-player-button"
            disabled={players.length >= (roomData?.maxPlayers || 4)}
          >
            Add Demo Player (for testing)
          </button>
        </div>
      </div>

      {/* Players Section */}
      <div className="players-section">
        <h3 className="players-title">
          Players in Room ({players.length}/{roomData?.maxPlayers || 4})
        </h3>
        <div className="players-list">
          {players.map((player) => (
            <div key={player.id} className="player-card">
              <span className="player-name">{player.name}</span>
              {player.id === 'host' && <span className="host-badge">HOST</span>}
            </div>
          ))}
          
          {/* Empty slots */}
          {Array((roomData?.maxPlayers || 4) - players.length).fill(null).map((_, index) => (
            <div key={`empty-${index}`} className="player-card empty-slot">
              <span className="empty-text">Waiting for player...</span>
            </div>
          ))}
        </div>
      </div>

      {/* Game Section */}
      {!gameStarted ? (
        <div className="waiting-section">
          <h2 className="waiting-title">Ready to Start?</h2>
          <p className="waiting-description">
            Make sure all players have joined using the link above. 
            You need at least 2 players to start the game.
          </p>
          <button 
            onClick={handleStartGame} 
            className="start-game-button"
            disabled={players.length < 2 || isLoading}
          >
            {isLoading ? (
              <>
                <span className="loading-spinner"></span>
                Starting Game...
              </>
            ) : players.length < 2 ? (
              'Need at least 2 players'
            ) : (
              `Start Game (${players.length} players ready)`
            )}
          </button>
        </div>
      ) : (
        <div className="game-section">
          <div className="game-header">
            <h2 className="game-title">
              Round {currentRound} of {roomData?.totalRounds || 3}
            </h2>
            <p className="game-instruction">
              🎭 Enter your emoji guess for the current charade!
            </p>
          </div>

          {/* Submission Form */}
          <div className="submission-section">
            <div className="submission-form">
              <input
                type="text"
                value={currentSubmission}
                onChange={(e) => setCurrentSubmission(e.target.value)}
                placeholder="Enter your emoji guess... (e.g., 🐶🏠 for doghouse)"
                className="submission-input"
                maxLength="100"
                disabled={isLoading}
              />
              <button 
                onClick={handleSubmitGuess} 
                className="submission-button"
                disabled={!currentSubmission.trim() || isLoading}
              >
                {isLoading ? (
                  <>
                    <span className="loading-spinner"></span>
                    Submitting...
                  </>
                ) : (
                  'Submit Guess'
                )}
              </button>
            </div>
          </div>

          {/* Submissions Display */}
          <div className="submissions-section">
            <h3 className="submissions-title">
              Guesses This Round ({submissions.length}):
            </h3>
            {submissions.length === 0 ? (
              <div className="no-submissions">
                <p>No guesses submitted yet...</p>
                <p className="no-submissions-hint">Be the first to make a guess!</p>
              </div>
            ) : (
              <div className="submissions-list">
                {submissions.map((submission) => (
                  <div key={submission.id} className="submission-item">
                    <span className="submission-text">{submission.text}</span>
                    <span className="submission-player">by {submission.player}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="error-message">
          <span className="error-icon">⚠️</span>
          {error}
          <button 
            className="error-dismiss" 
            onClick={() => setError('')}
          >
            ✕
          </button>
        </div>
      )}

      {/* Footer Actions */}
      <div className="room-footer">
        <button onClick={handleLeaveRoom} className="leave-room-button">
          Leave Room
        </button>
      </div>
    </div>
  );
};

export default GameRoom;