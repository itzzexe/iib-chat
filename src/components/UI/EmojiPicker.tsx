import React, { useState } from 'react';

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
}

const emojiCategories = {
  'Smileys': ['😀', '😃', '😄', '😁', '😊', '😇', '🙂', '🙃', '😉', '😍', '🥰', '😘', '😗', '☺️', '😚', '😙', '🥲', '😋'],
  'Gestures': ['👍', '👎', '👏', '🙌', '👐', '🤝', '🤜', '🤛', '✊', '👊', '🤞', '✌️', '🤟', '🤘', '👌', '🤌', '🤏'],
  'Objects': ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💯', '💢', '💨', '💫', '💦', '💨', '🕳️'],
  'Symbols': ['✅', '❌', '⭐', '🌟', '💯', '🔥', '💪', '👑', '🎉', '🎊', '🎈', '🎁', '🏆', '🥇', '🥈', '🥉']
};

export default function EmojiPicker({ onEmojiSelect }: EmojiPickerProps) {
  const [activeCategory, setActiveCategory] = useState('Smileys');

  return (
    <div className="bg-white dark:bg-secondary-800 border border-secondary-200 dark:border-secondary-700 rounded-lg shadow-lg p-4 w-80">
      {/* Category tabs */}
      <div className="flex gap-1 mb-3 border-b border-secondary-200 dark:border-secondary-700">
        {Object.keys(emojiCategories).map(category => (
          <button
            key={category}
            onClick={() => setActiveCategory(category)}
            className={`px-3 py-2 text-sm font-medium rounded-t-lg transition-colors ${
              activeCategory === category
                ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400'
                : 'text-secondary-600 dark:text-secondary-400 hover:text-secondary-900 dark:hover:text-secondary-200'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Emoji grid */}
      <div className="grid grid-cols-8 gap-1 max-h-48 overflow-y-auto">
        {emojiCategories[activeCategory as keyof typeof emojiCategories].map((emoji, index) => (
          <button
            key={index}
            onClick={() => onEmojiSelect(emoji)}
            className="p-2 text-lg hover:bg-secondary-100 dark:hover:bg-secondary-700 rounded-lg transition-colors"
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
}