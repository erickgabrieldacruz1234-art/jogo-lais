import React, { useState, useEffect } from "react";
import { audio } from "../game/audioManager";

export default function DialogueOverlay({ dialogueLines, onFinish }) {
  const [lineIndex, setLineIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(true);

  const currentLine = dialogueLines[lineIndex] || null;

  useEffect(() => {
    if (!currentLine) return;

    let charIdx = 0;
    setIsTyping(true);
    setDisplayedText("");

    const fullText = currentLine.text;
    const interval = setInterval(() => {
      charIdx++;
      setDisplayedText(fullText.slice(0, charIdx));
      if (charIdx % 3 === 0) {
        audio.playSfx("dialogue_letter");
      }
      if (charIdx >= fullText.length) {
        clearInterval(interval);
        setIsTyping(false);
      }
    }, 25);

    return () => clearInterval(interval);
  }, [lineIndex, currentLine]);

  // Handle advance
  const handleAdvance = () => {
    if (isTyping) {
      // Skip typing instantly
      setDisplayedText(currentLine.text);
      setIsTyping(false);
    } else {
      if (lineIndex + 1 < dialogueLines.length) {
        setLineIndex((prev) => prev + 1);
      } else {
        onFinish();
      }
    }
  };

  useEffect(() => {
    const onKey = (e) => {
      if (e.code === "Space" || e.code === "Enter" || e.code === "KeyE") {
        e.preventDefault();
        handleAdvance();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isTyping, lineIndex, dialogueLines]);

  if (!currentLine) return null;

  return (
    <div className={"dialogue-overlay" + (currentLine.speaker ? "" : " narrator")} onClick={handleAdvance}>
      {currentLine.portrait && (
        <img
          src={currentLine.portrait}
          alt={currentLine.speaker}
          className="dialogue-portrait"
        />
      )}
      <div className="dialogue-content">
        <div>
          {currentLine.speaker && <h4 className="dialogue-speaker">{currentLine.speaker}</h4>}
          <p className="dialogue-text">{displayedText}</p>
        </div>
        <div className="dialogue-hint">
          {isTyping ? "…" : "▼"}
        </div>
      </div>
    </div>
  );
}
