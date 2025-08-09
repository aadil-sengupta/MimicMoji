import React from 'react';
import RoomCodeInput from '../Components/Roomcodeinput';

const Join_Room = () => {
  const handleRoomCodeSubmit = (roomCode) => {
    console.log('Joining room:', roomCode);
    // Add your room joining logic here
  };

  return (
    <div className="joinroom-container">
      <h1 className="joinroom-title">Join Room</h1>
      <p className="joinroom-subtitle">
        🎮 Enter a room code to join the game
      </p>
      
      <div className="join-instructions">
        <div className="instructions-title">How to Join</div>
        <div className="instruction-item">
          <span className="instruction-number">1</span>
          Get a room code from your friend
        </div>
        <div className="instruction-item">
          <span className="instruction-number">2</span>
          Enter the code below
        </div>
        <div className="instruction-item">
          <span className="instruction-number">3</span>
          Start playing together!
        </div>
      </div>

      <RoomCodeInput inputRoomName={handleRoomCodeSubmit} />
      
      <button className="back-btn" onClick={() => window.history.back()}>
        ← Back to Home
      </button>
    </div>
  );
};

export default Join_Room;