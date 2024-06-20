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
    <div className="container">
      <h2 className="my-4 text-center">Set Details</h2>
      <div className="controls mb-4">
        <div className="control-group mb-3">
          <label className="form-label">
            Background Color:
            <input
              type="color"
              className="form-control form-control-color"
              value={backgroundColor}
              onChange={(e) => setBackgroundColor(e.target.value)}
            />
          </label>
        </div>
        <div className="control-group mb-3">
          <label className="form-label">
            Bold Text:
            <input
              type="checkbox"
              className="form-check-input"
              checked={boldText}
              onChange={() => setBoldText(!boldText)}
            />
          </label>
        </div>
        <div className="control-group mb-3">
          <label className="form-label">
            Album Cover Size:
            <input
              type="range"
              className="form-range"
              min="50"
              max="200"
              value={coverSize}
              onChange={(e) => setCoverSize(e.target.value)}
            />
          </label>
        </div>
        <div className="control-group mb-3">
          <label className="form-label">
            Text Size:
            <input
              type="range"
              className="form-range"
              min="10"
              max="30"
              value={textSize}
              onChange={(e) => setTextSize(e.target.value)}
            />
          </label>
        </div>
        <div className="control-group mb-3">
          <label className="form-label">
            Title:
            <input
              type="text"
              className="form-control"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter title for the setlist"
            />
          </label>
          {!isTitleValid && <p className="text-danger">Title cannot be blank or just whitespace</p>}
        </div>
        <div className="control-group mb-3">
          <label className="form-label">
            Title Color:
            <input
              type="color"
              className="form-control form-control-color"
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
          <div key={index} className="track mb-3">
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
      <div className="d-flex justify-content-center mt-4">
        <button className="btn btn-secondary me-2" onClick={saveAsText}>Save as Text</button>
        <button className="btn btn-secondary" onClick={saveAsImage}>Save as Image</button>
      </div>
    </div>
  );
}

export default SetDetails;