import { useEffect, useRef, useState } from 'react';
import 'style/App.scss';
import { LocalVideo } from './components/LocalVideo/LocalVideo';

import { getDevicesCount } from './utilities/webrtc';

function App() {
  const myVideo = useRef<HTMLVideoElement>(null!);
  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((stream) => {
      myVideo.current.srcObject = stream;
    });
  }, []);

  return (
    <div className='App row'>
      <p> device count : {}</p>
      <div className='column'>
        <LocalVideo ref={myVideo} />
      </div>
    </div>
  );
}

export default App;
