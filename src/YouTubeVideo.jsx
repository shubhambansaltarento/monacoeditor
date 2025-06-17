import React, { useRef, useState } from 'react';
import YouTube from 'react-youtube';

const YouTubePlayer = () => {
  const playerRef = useRef(null);
  const [videoId, setVideoId] = useState('dQw4w9WgXcQ'); // Example video ID
  const [startTime, setStartTime] = useState(60); // 3 minutes in seconds
  const [endTime, setEndTime] = useState(240); // 4 minutes in seconds
  
  const opts = {
    height: '390',
    width: '640',
    playerVars: {
      autoplay: 1,
      start: startTime, // Start time in seconds
      end: endTime,     // End time in seconds
      controls: 1,
      modestbranding: 1,
    },
  };

  const onReady = (event) => {
    playerRef.current = event.target;
    console.log('Player is ready');
  };

  const onStateChange = (event) => {
    // YouTube Player States: -1 (unstarted), 0 (ended), 1 (playing), 2 (paused), 3 (buffering), 5 (cued)
    if (event.data === 0) { // Video ended
      console.log('Video segment finished');
      // You can add custom logic here when the segment ends
    }
  };

  const playSegment = (start, end) => {
    if (playerRef.current) {
      playerRef.current.seekTo(start);
      playerRef.current.playVideo();
      
      // Optional: Stop at end time (YouTube's end parameter doesn't always work reliably)
      setTimeout(() => {
        if (playerRef.current) {
          playerRef.current.pauseVideo();
        }
      }, (end - start) * 1000);
    }
  };

  const handleCustomSegment = () => {
    const start = parseInt(document.getElementById('startTime').value) || 0;
    const end = parseInt(document.getElementById('endTime').value) || 30;
    playSegment(start, end);
  };

  return (
    <div>
      <h2>YouTube Player with Time Range</h2>
      
      <YouTube
        videoId={videoId}
        opts={opts}
        onReady={onReady}
        onStateChange={onStateChange}
      />
      
      <div style={{ marginTop: '20px' }}>
        <h3>Play Custom Segment</h3>
        <div>
          <label>
            Start Time (seconds): 
            <input 
              id="startTime" 
              type="number" 
              defaultValue={startTime}
              style={{ marginLeft: '10px', marginRight: '20px' }}
            />
          </label>
          <label>
            End Time (seconds): 
            <input 
              id="endTime" 
              type="number" 
              defaultValue={endTime}
              style={{ marginLeft: '10px', marginRight: '20px' }}
            />
          </label>
          <button onClick={handleCustomSegment}>
            Play Segment
          </button>
        </div>
        
        <div style={{ marginTop: '10px' }}>
          <button onClick={() => playSegment(180, 240)}>
            Play 3-4 min segment
          </button>
          <button onClick={() => playSegment(300, 360)} style={{ marginLeft: '10px' }}>
            Play 5-6 min segment
          </button>
        </div>
      </div>
      
      <div style={{ marginTop: '20px' }}>
        <h3>Change Video</h3>
        <input 
          type="text" 
          placeholder="Enter YouTube Video ID"
          onChange={(e) => setVideoId(e.target.value)}
          style={{ marginRight: '10px' }}
        />
        <small>Example: dQw4w9WgXcQ</small>
      </div>
    </div>
  );
};

export default YouTubePlayer;