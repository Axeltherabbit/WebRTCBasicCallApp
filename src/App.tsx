import { fail } from 'assert';
import { ChangeEvent, useEffect, useRef, useState } from 'react';
import 'style/App.scss';
import { VideoStream } from './components/Video/VideoStream';
import { ACTION, useSocket } from './hooks/useSocket';

type Props = { onChange: (e: ChangeEvent<HTMLInputElement>) => void; id: string };
const UsernameInput: React.FC<Props> = ({ onChange, id }) => {
  const MINUSERNAMELENGTH = 4;
  return (
    <input
      id={id}
      type='text'
      onChange={onChange}
      minLength={MINUSERNAMELENGTH}
      title='Only letters allowed'
      pattern='[A-Za-z]+'
      required
    />
  );
};

export const App: React.FC = () => {
  const myVideo = useRef<HTMLVideoElement>(null!);

  const [logged, setLogged] = useState(false);
  const { state, dispatch } = useSocket(setLogged);
  const [username, setUsername] = useState('');
  const [callname, setCallname] = useState('');

  useEffect(() => {
    dispatch({ type: ACTION.SET_SOCKET });

    navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((stream) => {
      myVideo.current.srcObject = stream;
      stream.getTracks().forEach((track) => {
        dispatch({ type: ACTION.ADD_TRACK, track: track, stream: stream });
      });
    });

    state.myConnection.addEventListener(
      'track',
      (event) => {
        console.log('Event track triggered', event.streams);
        dispatch({ type: ACTION.SET_REMOTE_VIDEO, remoteVideo: event.streams[0] });
      },
      { once: true }
    );
  }, []);

  const loginSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    console.log('Called submit login');
    event.preventDefault();
    dispatch({ type: ACTION.LOGIN, name: username });
  };

  const callSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    if (!callname) {
      console.log('no callername');
      return;
    }
    console.log('Calling : ', callname);
    event.preventDefault();
    dispatch({ type: ACTION.CALL, callName: callname });
  };
  return (
    <div className='App row'>
      {state.myConnection ? <p> Username : {username}</p> : null}
      <div className='column'>
        <video width='320' height='240' ref={myVideo} autoPlay playsInline muted />
        <VideoStream width='320' height='240' srcObject={state.remoteVideo} autoPlay playsInline />
      </div>
      <form onSubmit={loginSubmit}>
        <label htmlFor='inputUsername'>Username :</label>
        <UsernameInput id={'inputUsername'} onChange={(e) => setUsername(e.target.value)} />
        <button type='submit'>Connect</button>
      </form>

      {logged ? (
        <form onSubmit={callSubmit}>
          <label htmlFor='inputCall'>Call :</label>
          <UsernameInput id={'inputCall'} onChange={(e) => setCallname(e.target.value)} />
          <button type='submit'>Call</button>
        </form>
      ) : null}
    </div>
  );
};
