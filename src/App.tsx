import { useCallback, useEffect, useRef, useState } from 'react';
import 'style/App.scss';

import { getDevicesCount } from './utilities/webrtc';
import { SignalServer, RTCconf } from './webrtc.config.json';

const socket = new WebSocket(SignalServer);
//creating our RTCPeerConnection object
const configuration: RTCConfiguration = {
  iceServers: [RTCconf],
};
const myConnection = new RTCPeerConnection(configuration);

function App() {
  const myVideo = useRef<HTMLVideoElement>(null!);
  const remoteVideo = useRef<HTMLVideoElement>(null!);

  const [loggedIn, setLoggedIn] = useState(false);
  const [deviceCounter, setDeviceCounter] = useState(0);
  const [streamData, setStreamData] = useState<MediaStream | undefined>(undefined);
  const [username, setUsername] = useState('');
  const [callname, setCallname] = useState('');

  var connectedUser: string;

  useEffect(() => {
    getDevicesCount().then((n) => setDeviceCounter(n));
    navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((stream) => {
      myVideo.current.srcObject = stream;
      setStreamData(stream);
      stream.getTracks().forEach((track) => {
        myConnection.addTrack(track, stream);
      });
    });
    myConnection.addEventListener(
      'track',
      (event) => {
        console.log('Event track triggered', event.streams);
        remoteVideo.current.srcObject = event.streams[0];
      },
      { once: true }
    );
  }, []);

  //handle messages from the server
  socket.onmessage = (message) => {
    var data = JSON.parse(message.data);
    console.log('server : ', message);

    switch (data.type) {
      case 'login':
        onLogin(data.success);
        break;
      case 'offer':
        onOffer(data.offer, data.name);
        break;
      case 'answer':
        onAnswer(data.answer);
        break;
      case 'candidate':
        onCandidate(data.candidate);
        break;
      default:
        break;
    }
  };

  socket.onopen = () => {
    console.log('Socket connected');
  };

  socket.onerror = (err) => {
    console.log('Socket error', err);
  };

  //when a user logs in
  const onLogin = (success: boolean) => {
    if (!success) {
      alert('oops...try a different username');
    } else {
      setLoggedIn(true);
      console.log('Logging in');
      myConnection.onicecandidate = (event) => {
        if (event.candidate) {
          send({
            type: 'candidate',
            candidate: event.candidate,
          });
        }
      };
    }
  };

  //when another user answers to our offer
  const onAnswer = (answer: RTCSessionDescriptionInit) => {
    console.log('Received answer', answer);
    myConnection.setRemoteDescription(new RTCSessionDescription(answer));
  };

  //when we got ice candidate from another user
  const onCandidate = (candidate: RTCIceCandidate) => {
    console.log('Received candidate', candidate);
    myConnection.addIceCandidate(new RTCIceCandidate(candidate));
  };

  //when somebody wants to call us
  const onOffer = (offer: RTCSessionDescriptionInit, name: string) => {
    console.log('Received offer', offer);
    connectedUser = name;
    myConnection.setRemoteDescription(new RTCSessionDescription(offer)).then(() =>
      myConnection.createAnswer().then((answer) => {
        myConnection.setLocalDescription(answer);
        send({
          type: 'answer',
          answer: answer,
        });
      })
    );
  };

  const loginSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    console.log('Called submit login');
    event.preventDefault();
    send({
      type: 'login',
      name: username,
    });
  };

  const send = (message: any) => {
    //attach the other peer username to our messages
    if (connectedUser) {
      message.name = connectedUser;
    }
    console.log('Sending :', message);

    socket.send(JSON.stringify(message));
  };

  const callSubmit = useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      if (!callname) {
        console.log('no callername');
        return;
      }
      console.log('Calling : ', callname);
      myConnection.createOffer().then((offer) => {
        socket.send(JSON.stringify({ type: 'offer', offer: offer, name: callname }));
        myConnection.setLocalDescription(offer);
      });
      event.preventDefault();
    },
    [callname, myConnection, socket]
  );

  return (
    <div className='App row'>
      <p> device count : {deviceCounter}</p>
      <p> Stream : {streamData?.active ? 'active' : 'not active'}</p>
      <p> ID : {streamData?.id ?? undefined}</p>
      {myConnection ? <p> Username : {username}</p> : null}
      <div className='column'>
        <video width='320' height='240' ref={myVideo} autoPlay playsInline muted />
        <video width='320' height='240' ref={remoteVideo} autoPlay playsInline />
      </div>
      <form onSubmit={loginSubmit}>
        <label htmlFor='inputUsername'>Username :</label>

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
      <form onSubmit={callSubmit}>
        <label htmlFor='inputCall'>Call :</label>
        <input
          id='inputCall'
          type='text'
          onChange={(e) => setCallname(e.target.value)}
          minLength={4}
          title='Only letters allowed'
          pattern='[A-Za-z]+'
          required
        />
        <button type='submit'>Call</button>
      </form>
    </div>
  );
}

export default App;
