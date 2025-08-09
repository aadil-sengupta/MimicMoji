import React, { useState } from "react";
import EmojiPicker from "emoji-picker-react";

// Emoji picker (full emoji set)
const EmojiChooser = ({ onSelect }) => {
  const [chosenEmoji, setChosenEmoji] = useState(null);

  const handleEmojiClick = (emojiData) => {
    setChosenEmoji(emojiData.emoji);
    onSelect?.(emojiData.emoji);
  };

  return (
    <div>
      <EmojiPicker
        onEmojiClick={handleEmojiClick}
        width={350}
        height={400}
      />
      {chosenEmoji && (
        <p style={{ fontSize: "1.5rem", marginTop: 8 }}>
          You chose: {chosenEmoji}
        </p>
      )}
    </div>
  );
};

export default EmojiChooser;
