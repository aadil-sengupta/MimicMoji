import React, { useState } from 'react';

const RoomCodeInput = ({ inputRoomName }) => {
  const [roomCode, setRoomCode] = useState('');

  const handleSubmit = (event) => {
    event.preventDefault();
    if (roomCode.trim()) {
      inputRoomName(roomCode.trim().toUpperCase());
      setRoomCode('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="room-code-form">
      <input
        type="text"
        value={roomCode}
        onChange={(e) => setRoomCode(e.target.value)}
        placeholder="Enter room code (e.g., ABC123)"
        className="room-code-input"
        maxLength="8"
      />
      <button 
        type="submit" 
        className="submit-btn"
        disabled={!roomCode.trim()}
      >
        Join Game
      </button>
    </form>
  );
};

export default RoomCodeInput;