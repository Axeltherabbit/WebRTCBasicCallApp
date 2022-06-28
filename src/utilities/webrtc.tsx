export const getDevicesCount = async (): Promise<number> => {
  let cameraCount = 0;

  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    devices.map((device) => {
      if (device.kind != 'videoinput') {
        return;
      }

      cameraCount = cameraCount + 1;
    });
  } catch (err) {
    // Handle Error
  }
  return cameraCount ?? 0;
};

export const getDisplayStream = async () => {
  return navigator.mediaDevices.getDisplayMedia();
};

export const SetUpConnection = (name: string) => {
  var connectedUser: string, myConnection: RTCPeerConnection;
  var connection = new WebSocket('ws://localhost:9090');

  //handle messages from the server
  connection.onmessage = (message) => {
    console.log('Got message', message.data);
    var data = JSON.parse(message.data);
    console.log(message);

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

  //when a user logs in
  const onLogin = (success: boolean) => {
    if (success === false) {
      alert('oops...try a different username');
    } else {
      //creating our RTCPeerConnection object
      var configuration: RTCConfiguration = {
        iceServers: [{ urls: 'stun.l.google.com:19302' }],
      };
      const myConnection = new RTCPeerConnection(configuration);

      console.log('RTCPeerConnection object was created');
      console.log(myConnection);

      //setup ice handling
      //when the browser finds an ice candidate we send it to another peer
      myConnection.onicecandidate = function (event) {
        if (event.candidate) {
          send({
            type: 'candidate',
            candidate: event.candidate,
          });
        }
      };
    }
  };

  connection.onopen = () => {
    console.log('Connected');
  };

  connection.onerror = (err) => {
    console.log('Got error', err);
  };

  //when somebody wants to call us
  const onOffer = (offer: RTCSessionDescriptionInit, name: string) => {
    connectedUser = name;
    myConnection.setRemoteDescription(new RTCSessionDescription(offer));
    myConnection.createAnswer().then(
      function (answer) {
        myConnection.setLocalDescription(answer);
        send({
          type: 'answer',
          answer: answer,
        });
      },
      function (error) {
        alert('oops...error');
      }
    );
  };

  //when another user answers to our offer
  const onAnswer = (answer: RTCSessionDescriptionInit) => {
    myConnection.setRemoteDescription(new RTCSessionDescription(answer));
  };

  //when we got ice candidate from another user
  const onCandidate = (candidate: RTCIceCandidate) => {
    myConnection.addIceCandidate(new RTCIceCandidate(candidate));
  };

  // Alias for sending messages in JSON format
  const send = (
    message: {
      type: string;
      candidate?: RTCIceCandidate;
      name?: string;
      answer?: RTCSessionDescriptionInit;
    },
    connectedUser?: string
  ) => {
    if (connectedUser) {
      message.name = connectedUser;
    }

    connection.send(JSON.stringify(message));
  };

  return connection;
};
