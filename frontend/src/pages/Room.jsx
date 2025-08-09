import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useWebSocket } from '../WebSocketContext';
import { useUsername } from '../UsernameContext';
import '../css/Room.css';

const Room = () => {
  const navigate = useNavigate();
  const { id: roomIdFromParams } = useParams();
  const [searchParams] = useSearchParams();
  const roomCodeFromQuery = searchParams.get('roomCode');
  
  const { addEventListener, sendMessage, isConnected } = useWebSocket();
  const { username } = useUsername();
  
  // Determine if we're joining or creating
  const roomIdToJoin = roomIdFromParams || roomCodeFromQuery;
  const isJoining = !!roomIdToJoin;
  
  // Room state
  const [roomData, setRoomData] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [shareableLink, setShareableLink] = useState('');
  
  // Game state
  const [gameStarted, setGameStarted] = useState(false);
  const [currentRole, setCurrentRole] = useState(null); // 'actor' or 'guesser'
  const [currentEmoji, setCurrentEmoji] = useState('');
  const [currentTurn, setCurrentTurn] = useState('');
  const [guessInput, setGuessInput] = useState('');
  const [guessResult, setGuessResult] = useState(null);
  const [gameMessages, setGameMessages] = useState([]);
  
  const charadesEmojis = [
  // Actions / Verbs
  "🏃‍♂️", "🕺", "🧘", "🛏️", "🍽️", "🧼", "📖", "🧹", "🚶", "🏊",

  // Emotions / Reactions
  "😂", "😢", "😡", "😱", "😴", "🤔", "😍", "🤢", "🤯", "😇",

  // People / Professions
  "👮", "👨‍🍳", "👨‍⚕️", "👨‍🏫", "🕵️", "👨‍🎤", "👩‍🚀", "🤹", "🧙", "🧛",

  // Entertainment / Media
  "🎤", "🎸", "🎮", "🎧", "🎥", "📺", "🎭", "📚", "🎨", "🎲",

  // Objects
  "📱", "📷", "🪑", "🛏️", "🚪", "🧴", "🧸", "🎒", "🕰️", "🔑",

  // Places / Nature
  "🏠", "🏫", "🏥", "🏖️", "🌋", "🌲", "🗻", "🌧️", "🌞", "🌪️",

  // Animals
  "🐶", "🐱", "🐍", "🐘", "🐒", "🦁", "🐴", "🐧", "🐟", "🐔",

  // Transportation
  "🚗", "🚕", "🚌", "🚑", "🚀", "🛸", "🛶", "🚲", "✈️", "🚁"
];


  // Room settings (for creating new room)
  const [roomSettings, setRoomSettings] = useState({
    roomName: `${username}'s Room`,
    maxPlayers: 4,
    totalRounds: 3,
    roundTime: 60
  });

  // WebSocket event listeners
  useEffect(() => {
    if (!addEventListener) return;

    const unsubscribers = [];

    // Listen for room creation
    unsubscribers.push(
      addEventListener('room_created', (data) => {
        console.log('Room created:', data);
        setRoomData(data);
        setParticipants(data.participants?.map(name => ({ id: name, name })) || []);
        
        // Generate shareable link
        if (data.room_id) {
          const link = `${window.location.origin}/room/${data.room_id}`;
          setShareableLink(link);
        }
        
        setIsLoading(false);
      })
    );

    // Listen for joining room
    unsubscribers.push(
      addEventListener('joined_room', (data) => {
        console.log('Joined room:', data);
        setRoomData(data);
        setParticipants(data.participants?.map(name => ({ id: name, name })) || []);
        
        // Generate shareable link
        if (data.room_id) {
          const link = `${window.location.origin}/room/${data.room_id}`;
          setShareableLink(link);
        }
        
        setIsLoading(false);
      })
    );

    // Listen for participants updates
    unsubscribers.push(
      addEventListener('participants_updated', (data) => {
        console.log('Participants updated in Room:', data);
        console.log('Current participants:', data.participants);
        console.log('Action:', data.action, 'Username:', data.username);
        
        setParticipants(data.participants?.map(name => ({ id: name, name })) || []);
        
        if (data.action === 'user_joined') {
          console.log(`✅ ${data.username} joined the room`);
          // Optional: Show a toast notification
        } else if (data.action === 'user_left') {
          console.log(`❌ ${data.username} left the room`);
          // Optional: Show a toast notification
        }
      })
    );

    // Listen for errors
    unsubscribers.push(
      addEventListener('error', (data) => {
        setError(data.message || 'An error occurred');
        setIsLoading(false);
      })
    );

    // Listen for game started
    unsubscribers.push(
      addEventListener('game_started', (data) => {
        console.log('Game started:', data);
        setGameStarted(true);
        setCurrentRole(data.role);
        setCurrentTurn(data.current_turn);
        setGuessResult(null);
        setGuessInput('');
        setGameMessages([]);
        
        if (data.role === 'actor' && data.emoji) {
          setCurrentEmoji(data.emoji);
        }
      })
    );

    // Listen for guess results
    unsubscribers.push(
      addEventListener('guess_result', (data) => {
        console.log('Guess result:', data);
        setGuessResult(data);
        
        // Clear input if guess was correct
        if (data.correct) {
          setGuessInput('');
        }
      })
    );

    // Listen for guess submissions from other players
    unsubscribers.push(
      addEventListener('guess_submitted', (data) => {
        console.log('Guess submitted:', data);
        
        // Add message to game messages
        const newMessage = {
          id: Date.now(),
          username: data.username,
          guess: data.guess,
          correct: data.correct,
          message: data.message,
          timestamp: new Date().toLocaleTimeString()
        };
        
        setGameMessages(prev => [...prev, newMessage]);
        
        // If someone guessed correctly, we might want to show it prominently
        if (data.correct) {
          setGuessResult({
            correct: true,
            message: `🎉 ${data.username} guessed correctly!`,
            winner: data.username
          });
        }
      })
    );

    // Cleanup all listeners
    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, [addEventListener]);

  // Create or join room when component mounts
  useEffect(() => {
    if (isConnected && !roomData) {
      if (isJoining) {
        handleJoinRoom();
      } else {
        handleCreateRoom();
      }
    }
  }, [isConnected, isJoining]);

  const handleCreateRoom = () => {
    if (!isConnected) {
      setError('Not connected to server. Please try again.');
      return;
    }

    setIsLoading(true);
    setError('');
    
    console.log('Creating new room...');
    sendMessage({
      type: 'create_room',
      room_name: roomSettings.roomName,
      max_players: roomSettings.maxPlayers,
      total_rounds: roomSettings.totalRounds,
      round_time: roomSettings.roundTime
    });
  };

  const handleJoinRoom = () => {
    if (!isConnected) {
      setError('Not connected to server. Please try again.');
      return;
    }

    if (!roomIdToJoin) {
      setError('No room ID provided.');
      return;
    }

    setIsLoading(true);
    setError('');
    
    console.log('Joining room:', roomIdToJoin);
    sendMessage({
      type: 'join_room',
      room_id: roomIdToJoin
    });
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareableLink);
      alert('Room link copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy link:', err);
      // Fallback method
      const textArea = document.createElement('textarea');
      textArea.value = shareableLink;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      alert('Room link copied to clipboard!');
    }
  };

  const handleStartGame = () => {
    if (participants.length < 2) {
      setError('Need at least 2 players to start the game');
      return;
    }

    if (!isConnected) {
      setError('Not connected to server. Please try again.');
      return;
    }

    setError('');
    console.log('Starting game...');
    sendMessage({
      type: 'start_game'
    });
  };

  const handleBackToHome = () => {
    navigate('/');
  };

  const handleSubmitGuess = () => {
    if (!guessInput.trim()) {
      setGuessResult({
        correct: false,
        error: true,
        message: '⚠️ Please enter an emoji guess!'
      });
      return;
    }

    if (!isConnected) {
      setGuessResult({
        correct: false,
        error: true,
        message: '🔌 Not connected to server!'
      });
      return;
    }

    console.log('Submitting guess:', guessInput);
    sendMessage({
      type: 'submit_guess',
      guess: guessInput.trim()
    });
  };

  const handleGuessInputChange = (e) => {
    const value = e.target.value;
    // Allow only one character/emoji (some emojis are 2 characters)
    if (value.length <= 2) {
      setGuessInput(value);
      // Clear any previous guess result when user starts typing again
      if (guessResult && !guessResult.correct) {
        setGuessResult(null);
      }
    }
  };

  const handleEmojiSelect = (emoji) => {
    if (guessResult?.correct) return; // Don't allow selection if already correct
    
    setGuessInput(emoji);
    // Clear any previous guess result when user selects a new emoji
    if (guessResult && !guessResult.correct) {
      setGuessResult(null);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSubmitGuess();
    }
  };

  if (!isConnected) {
    return (
      <div className="create-room-container">
        <div className="create-room-header">
          <h1 className="create-room-title">🔌 Connecting...</h1>
          <p className="create-room-subtitle">Please wait while we connect to the server</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="create-room-container">
        <div className="create-room-header">
          <h1 className="create-room-title">
            {isJoining ? '🔗 Joining Room...' : '🎮 Creating Room...'}
          </h1>
          <p className="create-room-subtitle">
            {isJoining ? `Joining room ${roomIdToJoin}...` : 'Setting up your new game room...'}
          </p>
        </div>
        <div className="loading-spinner" style={{ margin: '2rem auto' }}></div>
      </div>
    );
  }

  return (
    <div className="create-room-container">

      {error && (
        <div className="error-message">
          <span className="error-icon">⚠️</span>
          <span className="error-text">{error}</span>
        </div>
      )}

      <div className="room-layout">
        {/* Left Sidebar - Participants (hidden when game starts) */}
        {!gameStarted && (
          <div className="room-sidebar">
            <div className="participants-section">
              <div className="participants-header">
                <h3 className="summary-title">Players</h3>
                <span className="participants-count">
                  {participants.length}/{roomSettings.maxPlayers}
                </span>
              </div>
              <div className="participants-list">
                {participants.map((participant, index) => (
                  <div key={participant.id || index} className="participant-card">
                    <div className="participant-info">
                      <span className="participant-name">🎭 {participant.name}</span>
                      {participant.name === username && <span className="host-badge">HOST</span>}
                    </div>
                    <div className="participant-status">
                      <span className="status-indicator connected">🟢</span>
                    </div>
                  </div>
                ))}
                
                {/* Empty slots */}
                {Array(roomSettings.maxPlayers - participants.length).fill(null).map((_, index) => (
                  <div key={`empty-${index}`} className="participant-card empty-slot">
                    <div className="participant-info">
                      <span className="participant-name">Waiting for player...</span>
                    </div>
                    <div className="participant-status">
                      <span className="status-indicator waiting">⏳</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Center - Video Conference / Game Area */}
        <div className={`room-main ${gameStarted ? 'game-active' : ''}`}>
          {!gameStarted ? (
            <div className="video-conference-section">
              <h3 className="summary-title">Video Conference</h3>
              <div className="video-iframe-container">
                {/* Placeholder for video conferencing iframe */}
                <div className="video-placeholder">
                  <div className="video-placeholder-content">
                    <span className="video-icon">📹</span>
                    <p className="video-text">Video conferencing will appear here</p>
                    <p className="video-subtext">Integration coming soon...</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="game-area">
              {currentRole === 'actor' ? (
                <div className="actor-view">
                  <div className="game-header">
                    <h2 className="game-title">🎭 Your Turn to Act!</h2>
                    <p className="game-subtitle">Act out this emoji for others to guess</p>
                  </div>
                  <div className="emoji-display">
                    <div className="emoji-card">
                      <span className="emoji-large">{currentEmoji}</span>
                    </div>
                    <p className="emoji-instruction">Act out this emoji without speaking!</p>
                  </div>
                </div>
              ) : (
                <div className="guesser-view">
                  <div className="game-header">
                    <h2 className="game-title">🕵️ Time to Guess!</h2>
                    <p className="game-subtitle">{currentTurn} is acting out an emoji</p>
                  </div>
                  <div className="guessing-area">
                    <div className="current-actor">
                      <span className="actor-indicator">🎭</span>
                      <span className="actor-name">{currentTurn}</span>
                      <span className="acting-text">is acting...</span>
                    </div>
                    
                    {/* Guess Result Display */}
                    {guessResult && (
                      <div className={`guess-result ${guessResult.correct ? 'correct' : 'incorrect'}`}>
                        <span className="result-message">{guessResult.message}</span>
                        {guessResult.hint && (
                          <span className="result-hint">{guessResult.hint}</span>
                        )}
                      </div>
                    )}
                    
                    <div className="guess-input-area">
                      <div className="emoji-guess-container">
                        <div className="emoji-input-wrapper">
                          <div className="selected-emoji-display">
                            {guessInput ? (
                              <span className="selected-emoji">{guessInput}</span>
                            ) : (
                              <span className="emoji-placeholder">🤔</span>
                            )}
                          </div>
                          <div className="input-label">
                            {guessResult?.correct ? 'Correct!' : guessInput ? 'Selected Emoji' : 'Select an Emoji'}
                          </div>
                        </div>
                        <button 
                          className="guess-submit-button"
                          onClick={handleSubmitGuess}
                          disabled={!guessInput.trim() || guessResult?.correct}
                        >
                          {guessResult?.correct ? '🎉 Correct!' : '✨ Submit'}
                        </button>
                      </div>
                      <div className="guess-hint">
                        {guessResult?.correct ? 
                          'Great job! Waiting for next round...' : 
                          'Select the emoji you think is being acted out'
                        }
                      </div>
                      
                      {/* Emoji Selection Grid */}
                      {!guessResult?.correct && (
                        <div className="emoji-selection-grid">
                          <h4 className="selection-title">Choose an Emoji:</h4>
                          <div className="emoji-grid">
                            {charadesEmojis.map((emoji, index) => (
                              <button
                                key={index}
                                className={`emoji-option ${guessInput === emoji ? 'selected' : ''}`}
                                onClick={() => handleEmojiSelect(emoji)}
                                disabled={guessResult?.correct}
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Game Messages/Activity Feed */}
                    {gameMessages.length > 0 && (
                      <div className="game-messages">
                        <h4 className="messages-title">Recent Guesses</h4>
                        <div className="messages-list">
                          {gameMessages.slice(-5).map((message) => (
                            <div key={message.id} className={`message-item ${message.correct ? 'correct-guess' : 'incorrect-guess'}`}>
                              <span className="message-user">{message.username}</span>
                              <span className="message-guess">{message.guess}</span>
                              <span className={`message-status ${message.correct ? 'correct' : 'incorrect'}`}>
                                {message.correct ? '✅' : '❌'}
                              </span>
                              <span className="message-time">{message.timestamp}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Sidebar - Game Options (hidden when game starts) */}
        {!gameStarted && (
          <div className="room-options">
            <div className="game-options-section">
              {/* Room Information */}
              {roomData && (
                <div className="room-info-card">
                  <h3 className="summary-title">Room Details</h3>
                  <div className="room-info-item">
                    <span className="room-info-label">Room ID:</span>
                    <span className="room-info-value">{roomData.room_id}</span>
                  </div>
                  <div className="room-info-item">
                    <span className="room-info-label">Room Name:</span>
                    <span className="room-info-value">{roomSettings.roomName}</span>
                  </div>
                  <div className="room-info-item">
                    <span className="room-info-label">Max Players:</span>
                    <span className="room-info-value">{roomSettings.maxPlayers}</span>
                  </div>
                  <div className="room-info-item">
                    <span className="room-info-label">Total Rounds:</span>
                    <span className="room-info-value">{roomSettings.totalRounds}</span>
                  </div>
                </div>
              )}

              {/* Share Room */}
              {shareableLink && (
                <div className="share-card">
                  <h3 className="summary-title">Invite Players</h3>
                  <div className="share-input-container">
                    <input 
                      type="text" 
                      value={shareableLink} 
                      readOnly 
                      className="share-input"
                    />
                    <button onClick={copyLink} className="share-button">
                      📋 Copy
                    </button>
                  </div>
                </div>
              )}

              {/* Game Controls */}
              <div className="game-controls-card">
                <h3 className="summary-title">Game Controls</h3>
                {participants.length >= 2 ? (
                  <button 
                    onClick={handleStartGame} 
                    className="start-game-button"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <span className="loading-spinner"></span>
                        Starting...
                      </>
                    ) : (
                      <>
                        <span>🚀</span>
                        Start Game
                      </>
                    )}
                  </button>
                ) : (
                  <div className="waiting-notice">
                    <p>Waiting for more players...</p>
                    <p className="form-hint">Share the room link to invite friends!</p>
                  </div>
                )}
                
                <button onClick={handleBackToHome} className="back-button">
                  🏠 Back to Home
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Room;
