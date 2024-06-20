import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import html2canvas from 'html2canvas';
import './SetDetails.css';

function SetDetails() {
  const location = useLocation();
  const setDetails = location.state?.setDetails || [];

  const [backgroundColor, setBackgroundColor] = useState('#ffffff');
  const [boldText, setBoldText] = useState(false);
  const [coverSize, setCoverSize] = useState(100);
  const [title, setTitle] = useState('');
  const [titleColor, setTitleColor] = useState('#000000');
  const [textSize, setTextSize] = useState(20);
  const [isTitleValid, setIsTitleValid] = useState(true);
  const setDetailsRef = useRef(null);

  useEffect(() => {
    const handleImageLoad = () => {
      if (setDetailsRef.current) {
        const images = setDetailsRef.current.getElementsByTagName('img');
        for (const img of images) {
          img.onload = () => {
            img.style.display = 'inline-block';
          };
        }
      }
    };
    handleImageLoad();
  }, [setDetails]);

  const saveAsText = () => {
    const textContent = setDetails.map((track, index) => {
      return `${index + 1}. ${track.artist} - ${track.name} (${track.timestamp})`;
    }).join('\n');
    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'setlist.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const saveAsImage = () => {
    if (!title.trim()) {
      setIsTitleValid(false);
      return;
    }
    setIsTitleValid(true);
    const setDetailsElement = document.getElementById('set-details');
    const images = setDetailsElement.getElementsByTagName('img');
    const promises = [];
    for (const img of images) {
      if (!img.complete) {
        promises.push(new Promise((resolve) => {
          img.onload = resolve;
        }));
      }
    }
    Promise.all(promises).then(() => {
      html2canvas(setDetailsElement).then(canvas => {
        const imgData = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = imgData;
        link.download = 'setlist.png';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      });
    });
  };

  return (
    <div>
      <h2>Set Details</h2>
      <div className="controls">
        <div className="control-group">
          <label>
            Background Color:
            <input
              type="color"
              value={backgroundColor}
              onChange={(e) => setBackgroundColor(e.target.value)}
            />
          </label>
        </div>
        <div className="control-group">
          <label>
            Bold Text:
            <input
              type="checkbox"
              checked={boldText}
              onChange={() => setBoldText(!boldText)}
            />
          </label>
        </div>
        <div className="control-group">
          <label>
            Album Cover Size:
            <input
              type="range"
              min="50"
              max="200"
              value={coverSize}
              onChange={(e) => setCoverSize(e.target.value)}
            />
          </label>
        </div>
        <div className="control-group">
          <label>
            Text Size:
            <input
              type="range"
              min="10"
              max="30"
              value={textSize}
              onChange={(e) => setTextSize(e.target.value)}
            />
          </label>
        </div>
        <div className="control-group">
          <label>
            Title:
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter title for the setlist"
            />
          </label>
          {!isTitleValid && <p style={{ color: 'red' }}>Title cannot be blank or just whitespace</p>}
        </div>
        <div className="control-group">
          <label>
            Title Color:
            <input
              type="color"
              value={titleColor}
              onChange={(e) => setTitleColor(e.target.value)}
            />
          </label>
        </div>
      </div>
      <div
        id="set-details"
        ref={setDetailsRef}
        style={{
          backgroundColor: backgroundColor,
          fontWeight: boldText ? 'bold' : 'normal',
          padding: '10px',
          fontSize: `${textSize}px`,
          lineHeight: '1.5'
        }}
      >
        {title && <h1 style={{ textAlign: 'center', color: titleColor }}>{title}</h1>}
        {setDetails.map((track, index) => (
          <div key={index} className="track" style={{ marginBottom: '10px' }}>
            <img
              src={track.album_cover}
              alt={`${track.name} cover`}
              style={{ width: `${coverSize}px`, height: `${coverSize}px`, display: 'none' }}
            />
            <p style={{ margin: '5px 0' }}>
              {index + 1}. {track.artist} - {track.name} ({track.timestamp})
            </p>
          </div>
        ))}
      </div>
      <button onClick={saveAsText}>Save as Text</button>
      <button onClick={saveAsImage}>Save as Image</button>
    </div>
  );
}

export default SetDetails;
