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

    // Navigate to game room with room data
    navigate('/game', {
      state: {
        roomData: {
          ...roomData,
          ...roomSettings,
          participants
        }
      }
    });
  };

  const handleBackToHome = () => {
    navigate('/');
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
      <div className="create-room-header">
        <h1 className="create-room-title">
          {isJoining ? '🔗 Joined Room!' : '🎮 Room Created!'}
        </h1>
        <p className="create-room-subtitle">
          {isJoining 
            ? 'Welcome to the room! Share the link below to invite more friends.'
            : 'Share the link below to invite friends to your MimicEmoji game'
          }
        </p>
      </div>

      {error && (
        <div className="error-message">
          <span className="error-icon">⚠️</span>
          <span className="error-text">{error}</span>
        </div>
      )}

      {/* Room Information */}
      {roomData && (
        <div className="game-summary">
          <h3 className="summary-title">Room Details</h3>
          <div className="summary-content">
            <div className="summary-item">
              <span className="summary-label">Room ID:</span>
              <span className="summary-value">{roomData.room_id}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Room Name:</span>
              <span className="summary-value">{roomSettings.roomName}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Max Players:</span>
              <span className="summary-value">{roomSettings.maxPlayers}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Total Rounds:</span>
              <span className="summary-value">{roomSettings.totalRounds}</span>
            </div>
          </div>
        </div>
      )}

      {/* Shareable Link */}
      {shareableLink && (
        <div className="share-section">
          <h3 className="summary-title">Invite Players</h3>
          <div className="share-link-container">
            <input 
              type="text" 
              value={shareableLink} 
              readOnly 
              className="form-input"
              style={{ marginBottom: '1rem' }}
            />
            <button onClick={copyLink} className="create-room-button" style={{ marginTop: 0 }}>
              📋 Copy Room Link
            </button>
          </div>
        </div>
      )}

      {/* Participants List */}
      <div className="participants-section">
        <h3 className="summary-title">
          Players in Room ({participants.length}/{roomSettings.maxPlayers})
        </h3>
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

      {/* Video Conference Section */}
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
          {/* 
          When ready to integrate video conferencing, replace the placeholder with:
          <iframe 
            src="your-video-conference-url" 
            className="video-iframe"
            title="Video Conference"
            allow="camera; microphone; display-capture"
          />
          */}
        </div>
      </div>

      {/* Game Controls */}
      <div className="game-controls">
        {participants.length >= 2 ? (
          <button 
            onClick={handleStartGame} 
            className="create-room-button"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="loading-spinner"></span>
                Starting Game...
              </>
            ) : (
              <>
                <span className="button-icon">🚀</span>
                Start Game ({participants.length} players)
              </>
            )}
          </button>
        ) : (
          <div className="waiting-message">
            <p>Waiting for more players to join...</p>
            <p className="form-hint">Share the room link above to invite friends!</p>
          </div>
        )}
        
        <button 
          onClick={handleBackToHome} 
          className="create-room-button" 
          style={{ 
            background: 'rgba(255, 255, 255, 0.2)', 
            marginTop: '1rem' 
          }}
        >
          🏠 Back to Home
        </button>
      </div>
    </div>
  );
};

export default Room;
