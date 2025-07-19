import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './TypingTester.css';

const TypingTester = () => {
  const [paragraph, setParagraph] = useState('');
  const [input, setInput] = useState('');
  const [startTime, setStartTime] = useState(null);
  const [result, setResult] = useState(null);
  const [difficulty, setDifficulty] = useState('easy');
  const [history, setHistory] = useState([]);
  const [timerMode, setTimerMode] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const inputRef = useRef();

  useEffect(() => {
    fetchParagraph();
    inputRef.current?.focus();
  }, [difficulty]);

  useEffect(() => {
    if (timerMode && startTime && countdown > 0) {
      const interval = setInterval(() => setCountdown(c => c - 1), 1000);
      if (countdown === 1) calculateSpeed();
      return () => clearInterval(interval);
    }
  }, [timerMode, startTime, countdown]);

  useEffect(() => {
    if (result) setHistory(prev => [...prev, result]);
  }, [result]);

  const fetchParagraph = async () => {
    try {
      const res = await axios.get(`https://typing-speed-tester.onrender.com/get-paragraph?difficulty=${difficulty}`);
      setParagraph(res.data.paragraph.trim());
      setInput('');
      setResult(null);
      setStartTime(null);
      setCountdown(60);
    } catch (err) {
      console.error("Error fetching paragraph:", err);
    }
  };

  const handleKeyDown = (e) => {
    if (!startTime) setStartTime(Date.now());
    if (timerMode && countdown <= 0) return;

    if (e.key === 'Backspace') {
      setInput((prev) => prev.slice(0, -1));
    } else if (e.key.length === 1) {
      setInput((prev) => prev + e.key);
    }
  };

  const calculateSpeed = async () => {
    if (!startTime) return alert("Start typing first!");

    const elapsed = timerMode ? 60 - countdown : (Date.now() - startTime) / 1000;

    try {
      const res = await axios.post('https://typing-speed-tester.onrender.com/check-speed', {
        typed: input,
        original: paragraph,
        time: elapsed
      });
      setResult(res.data);
    } catch (err) {
      console.error("Error calculating speed:", err);
    }
  };

  return (
    <div className="container-fluid typing-layout">
      <div className="row vh-100">
        <div className="col-md-4 bg-white border-end p-4 d-flex flex-column justify-content-center shadow-sm">
          <h3 className="mb-4 text-dark fw-bold">⚡ Daily Challenges</h3>
          <ul className="list-group challenge-list">
            <li className="list-group-item">🔥 Type 50 WPM with 90% accuracy</li>
            <li className="list-group-item">💡 Complete 3 paragraphs</li>
            <li className="list-group-item">⏱ Beat your best time</li>
            <li className="list-group-item">🏆 Finish a hard paragraph in 60s</li>
          </ul>

          <div className="mt-4">
            <h5 className="text-dark">📊 Your History</h5>
            <ul className="list-group mt-2">
              {history.map((item, index) => (
                <li key={index} className="list-group-item small">
                  📝 WPM: {item.wpm}, 🎯 Accuracy: {item.accuracy}%, ⏱ Time: {item.time}s
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="col-md-8 p-5 d-flex flex-column justify-content-center typing-section bg-light">
          <h2 className="glowing-title text-center mb-4">Typing Speed Test</h2>

          <div className="difficulty-timer-container mb-3">
            <label>
              Difficulty : 
              <select
                value={difficulty}
                onChange={e => setDifficulty(e.target.value)}
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </label>

            <label>
              <input
                type="checkbox"
                checked={timerMode}
                onChange={e => {
                  setTimerMode(e.target.checked);
                  setCountdown(60);
                  setStartTime(null);
                  setInput('');
                  setResult(null);
                }}
              />
              Timer Mode (60s)
            </label>

            {timerMode && (
              <span><strong>Time Left:</strong> {countdown}s</span>
            )}
          </div>

          <div
            className="content-box mb-3"
            tabIndex="0"
            onKeyDown={handleKeyDown}
            ref={inputRef}
          >
            {paragraph.split('').map((char, index) => {
              let className = 'untyped';
              if (index < input.length) {
                className = input[index] === char ? 'correct' : 'incorrect';
              } else if (index === input.length) {
                className = 'current';
              }
              return (
                <span key={index} className={className}>
                  {char}
                </span>
              );
            })}
          </div>

          <div className="button-row">
            <button className="btn btn-outline-primary" onClick={calculateSpeed}>
              Check Speed
            </button>
            <button className="btn btn-outline-secondary" onClick={fetchParagraph}>
              Reset
            </button>
          </div>

          {result && (
            <div className="result-box mt-4">
              <div className="result-item">
                <span className="icon">🚀</span>
                <div className="label">WPM</div>
                <div className="value">{result.wpm}</div>
              </div>
              <div className="result-item">
                <span className="icon">🎯</span>
                <div className="label">Accuracy</div>
                <div className="value">{result.accuracy}%</div>
              </div>
              <div className="result-item">
                <span className="icon">⏱</span>
                <div className="label">Time</div>
                <div className="value">{result.time}s</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TypingTester;