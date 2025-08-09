import React, { useState } from 'react';
import { useUsername } from './UsernameContext';

const UsernameSetup = ({ onUsernameSet }) => {
  const { username, setUsername, setRandomUsername, isUsernameSet } = useUsername();
  const [inputValue, setInputValue] = useState(username);
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmedValue = inputValue.trim();
    
    if (!trimmedValue) {
      setError('Please enter a username');
      return;
    }
    
    if (trimmedValue.length < 2) {
      setError('Username must be at least 2 characters');
      return;
    }
    
    if (trimmedValue.length > 20) {
      setError('Username must be less than 20 characters');
      return;
    }
    
    setUsername(trimmedValue);
    setError('');
    onUsernameSet && onUsernameSet(trimmedValue);
  };

  const handleRandomUsername = () => {
    const randomUsername = setRandomUsername();
    setInputValue(randomUsername);
    setError('');
    onUsernameSet && onUsernameSet(randomUsername);
  };

  if (isUsernameSet && !onUsernameSet) {
    return null; // Don't show if username is already set and no callback provided
  }

  return (
    <div className="username-setup">
      <div className="username-setup-container">
        <h2 className="username-title">Choose Your Username</h2>
        <p className="username-description">
          This will be your display name in the game
        </p>
        
        <form onSubmit={handleSubmit} className="username-form">
          <div className="username-input-group">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Enter your username..."
              className="username-input"
              maxLength="20"
              autoFocus
            />
            <button type="submit" className="username-submit">
              Set Username
            </button>
          </div>
          
          {error && (
            <div className="username-error">
              {error}
            </div>
          )}
        </form>
        
        <div className="username-options">
          <button
            type="button"
            onClick={handleRandomUsername}
            className="username-random"
          >
            🎲 Generate Random Username
          </button>
        </div>
        
        {isUsernameSet && (
          <div className="username-current">
            Current username: <strong>{username}</strong>
          </div>
        )}
      </div>
      
      <style jsx>{`
        .username-setup {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }
        
        .username-setup-container {
          background: white;
          padding: 2rem;
          border-radius: 12px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
          max-width: 400px;
          width: 90%;
        }
        
        .username-title {
          margin: 0 0 0.5rem 0;
          color: #333;
          text-align: center;
        }
        
        .username-description {
          color: #666;
          text-align: center;
          margin-bottom: 1.5rem;
        }
        
        .username-form {
          margin-bottom: 1rem;
        }
        
        .username-input-group {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 0.5rem;
        }
        
        .username-input {
          flex: 1;
          padding: 0.75rem;
          border: 2px solid #ddd;
          border-radius: 6px;
          font-size: 1rem;
        }
        
        .username-input:focus {
          outline: none;
          border-color: #007bff;
        }
        
        .username-submit {
          padding: 0.75rem 1.5rem;
          background: #007bff;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 1rem;
        }
        
        .username-submit:hover {
          background: #0056b3;
        }
        
        .username-error {
          color: #dc3545;
          font-size: 0.875rem;
          margin-top: 0.5rem;
        }
        
        .username-options {
          text-align: center;
          margin-bottom: 1rem;
        }
        
        .username-random {
          background: #6c757d;
          color: white;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.875rem;
        }
        
        .username-random:hover {
          background: #545b62;
        }
        
        .username-current {
          text-align: center;
          color: #28a745;
          font-size: 0.875rem;
        }
      `}</style>
    </div>
  );
};

export default UsernameSetup;
