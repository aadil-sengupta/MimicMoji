import React, { createContext, useContext, useState, useEffect } from 'react';

const UsernameContext = createContext(null);

export const UsernameProvider = ({ children }) => {
  const [username, setUsernameState] = useState('');
  const [isUsernameSet, setIsUsernameSet] = useState(false);

  // Load username from localStorage on mount
  useEffect(() => {
    const savedUsername = localStorage.getItem('mimicmoji_username');
    if (savedUsername) {
      setUsernameState(savedUsername);
      setIsUsernameSet(true);
    }
  }, []);

  const setUsername = (newUsername) => {
    const trimmedUsername = newUsername.trim();
    if (trimmedUsername) {
      setUsernameState(trimmedUsername);
      setIsUsernameSet(true);
      localStorage.setItem('mimicmoji_username', trimmedUsername);
    }
  };

  const clearUsername = () => {
    setUsernameState('');
    setIsUsernameSet(false);
    localStorage.removeItem('mimicmoji_username');
  };

  const generateRandomUsername = () => {
    const adjectives = ['Happy', 'Silly', 'Clever', 'Brave', 'Funny', 'Cool', 'Smart', 'Swift'];
    const animals = ['Panda', 'Tiger', 'Eagle', 'Dolphin', 'Fox', 'Wolf', 'Bear', 'Lion'];
    const randomAdjective = adjectives[Math.floor(Math.random() * adjectives.length)];
    const randomAnimal = animals[Math.floor(Math.random() * animals.length)];
    const randomNumber = Math.floor(Math.random() * 100);
    
    return `${randomAdjective}${randomAnimal}${randomNumber}`;
  };

  const setRandomUsername = () => {
    const randomUsername = generateRandomUsername();
    setUsername(randomUsername);
    return randomUsername;
  };

  return (
    <UsernameContext.Provider value={{
      username,
      isUsernameSet,
      setUsername,
      clearUsername,
      generateRandomUsername,
      setRandomUsername
    }}>
      {children}
    </UsernameContext.Provider>
  );
};

export const useUsername = () => {
  const context = useContext(UsernameContext);
  if (!context) {
    throw new Error('useUsername must be used within a UsernameProvider');
  }
  return context;
};
