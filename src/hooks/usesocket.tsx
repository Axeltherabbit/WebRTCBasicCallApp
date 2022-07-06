import { Dispatch, SetStateAction, useReducer } from 'react';
import { SignalServer, RTCconf } from '../webrtc.config.json';

const configuration: RTCConfiguration = {
  iceServers: [RTCconf],
};

export enum ACTION {
  ADD_TRACK = 'add_track',
  SET_REMOTE_VIDEO = 'set_remote_video',
  SET_SOCKET = 'set_socket',
  LOGIN = 'login',
  CALL = 'call',
}

interface SocketState {
  socket: WebSocket;
  myConnection: RTCPeerConnection;
  connectedUser: string;
  remoteVideo: MediaStream | null;
  setLogged: Dispatch<SetStateAction<boolean>>;
}

type SocketAction =
  | { type: ACTION.ADD_TRACK; track: MediaStreamTrack; stream: MediaStream }
  | { type: ACTION.SET_REMOTE_VIDEO; remoteVideo: MediaStream }
  | { type: ACTION.SET_SOCKET }
  | { type: ACTION.LOGIN; name: string }
  | { type: ACTION.CALL; callName: string };

const reducer = (state: SocketState, action: SocketAction) => {
  console.log('Called reducer', state, action);

  const onMessage = (message: any) => {
    var data = JSON.parse(message.data);
    console.log('Server : ', message);

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

  const send = (message: any) => {
    //attach the other peer username to our messages
    if (state.connectedUser) {
      message.name = state.connectedUser;
    }
    console.log('Sending :', message);

    state.socket.send(JSON.stringify(message));
  };

  //when a user logs in
  const onLogin = (success: boolean) => {
    if (!success) {
      alert('oops...try a different username');
    } else {
      console.log('Logging in');
      state.setLogged(true);
      state.myConnection.onicecandidate = (event) => {
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
    state.myConnection.setRemoteDescription(new RTCSessionDescription(answer));
  };

  //when we got ice candidate from another user
  const onCandidate = (candidate: RTCIceCandidate) => {
    console.log('Received candidate', candidate);
    state.myConnection.addIceCandidate(new RTCIceCandidate(candidate));
  };

  //when somebody wants to call us
  const onOffer = (offer: RTCSessionDescriptionInit, name: string) => {
    console.log('Received offer', offer);
    state.connectedUser = name;
    state.myConnection.setRemoteDescription(new RTCSessionDescription(offer)).then(() =>
      state.myConnection.createAnswer().then((answer) => {
        state.myConnection.setLocalDescription(answer);
        send({
          type: 'answer',
          answer: answer,
        });
      })
    );
  };

  switch (action.type) {
    case ACTION.ADD_TRACK: {
      state.myConnection.addTrack(action.track, action.stream);
      return state;
    }
    case ACTION.SET_REMOTE_VIDEO: {
      return { ...state, remoteVideo: action.remoteVideo };
    }
    case ACTION.SET_SOCKET: {
      //handle messages from the server
      state.socket.onmessage = onMessage;

      state.socket.onopen = () => {
        console.log('Socket connected');
      };

      state.socket.onerror = (err) => {
        console.log('Socket error', err);
      };
      return state;
    }
    case ACTION.LOGIN: {
      send({
        type: 'login',
        name: action.name,
      });
      //to improve, the state changed even if the login fails
      return state;
    }

    case ACTION.CALL: {
      state.myConnection.createOffer().then((offer) => {
        send({ type: 'offer', offer: offer, name: action.callName });
        state.myConnection.setLocalDescription(offer);
      });
      return state;
    }

    default: {
      console.log('Error, reducer switch default', state, action);
      return state;
    }
  }
};

export const useSocket = (setLogged: Dispatch<SetStateAction<boolean>>): [SocketState, Dispatch<SocketAction>] => {
  const initialState: SocketState = {
    socket: new WebSocket(SignalServer),
    myConnection: new RTCPeerConnection(configuration),
    connectedUser: '',
    remoteVideo: null,
    setLogged: setLogged,
  };

  return useReducer(reducer, initialState);
};
