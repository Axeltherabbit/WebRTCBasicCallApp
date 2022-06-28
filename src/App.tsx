import { useEffect, useRef, useState } from 'react';
import 'style/App.scss';
import { LocalVideo } from './components/LocalVideo/LocalVideo';

import { getDevicesCount, SetUpConnection } from './utilities/webrtc';

function App() {
  const myVideo = useRef<HTMLVideoElement>(null!);
  const [deviceCounter, setDeviceCounter] = useState(0);
  const [streamData, setStreamData] = useState<MediaStream | undefined>(undefined);
  const [username, setUsername] = useState('');
  const [connection, setConnection] = useState<WebSocket>();

  useEffect(() => {
    getDevicesCount().then((n) => setDeviceCounter(n));
    navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((stream) => {
      myVideo.current.srcObject = stream;
      setStreamData(stream);
    });
  }, []);

  const login = (event) => {
    event.preventDefault();
    setConnection(SetUpConnection(username));
  };

  return (
    <div className='App row'>
      <p> device count : {deviceCounter}</p>
      <p> Stream : {streamData?.active ? 'active' : 'not active'}</p>
      <p> ID : {streamData?.id ?? undefined}</p>
      {connection ? <p> Username : {username}</p> : null}
      <div className='column'>
        <LocalVideo videoRef={myVideo} />
      </div>
      <label htmlFor='inputUsername'>Username :</label>
      <form onSubmit={login}>
        <input
          id='inputUsername'
          type='text'
          onChange={(e) => setUsername(e.target.value)}
          minLength={4}
          title='Only letters allowed'
          pattern='[A-Za-z]+'
          required
        />
        <button type='submit'>Connect</button>
      </form>
    </div>
  );
}

export default App;
