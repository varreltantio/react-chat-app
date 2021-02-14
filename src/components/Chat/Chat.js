import React, {useEffect, useState} from "react";
import queryString from "query-string";
import io from "socket.io-client";

import InfoBar from "../InfoBar/InfoBar";
import Messages from "../Messages/Messages";
import Input from "../Input/Input";

import "./Chat.css";

let socket;

const Chat = ({location}) => {
  const [name, setName] = useState("");
  const [room, setRoom] = useState("");
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);

  const ENDPOINT = "localhost:5000";

  useEffect(() => {
    // get url parameter
    const {name, room} = queryString.parse(location.search);

    socket = io(ENDPOINT, { transports: [ "websocket"] });

    setName(name);
    setRoom(room);

    socket.emit("join", {name, room}, (error) => {
      if (error) {
        alert(error);
      }
    });

    return () => {
      // argument must be same with server
      socket.emit("disconnect");

      // end socket
      socket.off();
    }
  }, [ENDPOINT, location.search]);

  useEffect(() => {
    socket.on("message", (message) => {
      // store new message in messages
      setMessages([...messages, message]);
    });
  }, [messages]);

  // function for sending messages
  const sendMessage = (event) => {
    event.preventDefault();

    if (message) {
      socket.emit("sendMessage", message, () => setMessage(""));
    }
  }

  console.log(message, messages);

  return (
    <div className="outerContainer">
      <div className="container">
        <InfoBar room={room} />
        <Messages messages={messages} name={name} />
        <Input message={message} setMessage={setMessage} sendMessage={sendMessage} />
      </div>
    </div>
  )
}

export default Chat;