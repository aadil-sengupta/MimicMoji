import React, { useState } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const CreateRoom = ({ onRoomCreated = () => {} }) => {
  // =============================================================================
  // STATE MANAGEMENT
  // =============================================================================
  
  const [roomSettings, setRoomSettings] = useState({
    roomName: '',
  
    roundDuration: 60, // seconds
    totalRounds: 3,
    difficulty: 'medium'
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // =============================================================================
  // API CALLS
  // =============================================================================
  
  // API helper function
  const apiCall = async (endpoint, options = {}) => {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || errorData.message || `HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('API call failed:', error);
      throw error;
    }
  };

  // Create room API call
  const createRoomAPI = async (roomData) => {
    return await apiCall('/api/rooms/create', {
      method: 'POST',
      body: JSON.stringify({
        name: roomData.roomName.trim(),
        
        round_duration: roomData.roundDuration,
        total_rounds: roomData.totalRounds,
        difficulty: roomData.difficulty,
        created_by: 'current-user' // Replace with actual user ID from auth
      })
    });
  };

  // =============================================================================
  // FORM HANDLING
  // =============================================================================
  
  const validateForm = () => {
    if (!roomSettings.roomName.trim()) {
      throw new Error('Room name is required');
    }
    
    if (roomSettings.roomName.trim().length < 3) {
      throw new Error('Room name must be at least 3 characters long');
    }
    
    if (roomSettings.roomName.trim().length > 30) {
      throw new Error('Room name must be less than 30 characters');
    }
    
    
    
    if (roomSettings.totalRounds < 1 || roomSettings.totalRounds > 10) {
      throw new Error('Total rounds must be between 1 and 10');
    }
  };

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Validate form
      validateForm();

      // Create room via API
      const roomData = await createRoomAPI(roomSettings);

      // Prepare room data for GameRoom component
      const gameRoomData = {
        roomId: roomData.id,
        roomCode: roomData.room_code,
        roomName: roomSettings.roomName.trim(),
        roundDuration: roomSettings.roundDuration,
        totalRounds: roomSettings.totalRounds,
      };

      // Pass room data to parent component (App)
      onRoomCreated(gameRoomData);

    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle input changes
  const handleInputChange = (field, value) => {
    setRoomSettings(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (error) {
      setError('');
    }
  };

  // Format time display 
  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    
    if (mins === 0) {
      return `${secs} seconds`;
    } else if (secs === 0) {
      return `${mins} minute${mins > 1 ? 's' : ''}`;
    } else {
      return `${mins}:${secs.toString().padStart(2, '0')} minutes`;
    }
  };

  // =============================================================================
  // RENDER CREATE ROOM FORM
  // =============================================================================
  
  return (
    <div className="create-room-container">
      <div className="create-room-header">
        <h1 className="create-room-title">Create New Game Room</h1>
        <p className="create-room-subtitle">
          🎭 Set up your emoji charades game and invite friends to join!
        </p>
      </div>

      <form onSubmit={handleCreateRoom} className="room-settings-form">
        {/* Room Name */}
        <div className="form-group">
          <label htmlFor="roomName" className="form-label">
            Room Name <span className="required">*</span>
          </label>
          <input
            type="text"
            id="roomName"
            value={roomSettings.roomName}
            onChange={(e) => handleInputChange('roomName', e.target.value)}
            placeholder="Enter a fun room name..."
            className="form-input"
            maxLength="30"
            required
            disabled={isLoading}
          />
          <div className="form-hint">
            Choose a memorable name for your game room:
          </div>
        </div>

        <div className="form-row">

          <div className="form-group">
            <label htmlFor="totalRounds" className="form-label">Total Rounds</label>
            <select
              id="totalRounds"
              value={roomSettings.totalRounds}
              onChange={(e) => handleInputChange('totalRounds', parseInt(e.target.value))}
              className="form-select"
              disabled={isLoading}
            >
              <option value={1}>1 Round</option>
              <option value={2}>2 Rounds</option>
              <option value={3}>3 Rounds</option>
              <option value={4}>4 Rounds</option>
              <option value={5}>5 Rounds</option>
              <option value={7}>7 Rounds</option>
              <option value={10}>10 Rounds</option>
            </select>
          </div>
        </div>

       
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="roundDuration" className="form-label">Round Duration</label>
            <select
              id="roundDuration"
              value={roomSettings.roundDuration}
              onChange={(e) => handleInputChange('roundDuration', parseInt(e.target.value))}
              className="form-select"
              disabled={isLoading}
            >
              <option value={30}>30 seconds</option>
              <option value={45}>45 seconds</option>
              <option value={60}>1 minute</option>
              <option value={90}>1.5 minutes</option>
              <option value={120}>2 minutes</option>
              <option value={180}>3 minutes</option>
            </select>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="error-message">
            <span className="error-icon">⚠️</span>
            <span className="error-text">{error}</span>
          </div>
        )}

        {/* Submit Button */}
        <button 
          type="submit" 
          className="create-room-button"
          disabled={isLoading || !roomSettings.roomName.trim()}
        >
          {isLoading ? (
            <>
              <span className="loading-spinner"></span>
              Creating Room...
            </>
          ) : (
            <>
              <span className="button-icon">🚀</span>
              Create Room & Continue
            </>
          )}
        </button>

        <div className="form-footer">
          <p className="footer-text">
            After creating the room, you'll be taken to the game lobby where you can 
            invite friends and start playing!
          </p>
        </div>
      </form>
    </div>
  );
};

export default CreateRoom;