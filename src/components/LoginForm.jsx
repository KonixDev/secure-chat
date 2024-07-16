"use client";

import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

const LoginForm = ({ onAuthenticate }) => {
  const [masterKey, setMasterKey] = useState("");
  const [nickname, setNickname] = useState("");
  const [roomId, setRoomId] = useState("");

  const handleSubmit = () => {
    if (!masterKey || !nickname || !roomId) {
      return alert("Please fill in all fields");
    }
    onAuthenticate(masterKey, nickname, roomId);
  };

  return (
    <div className="text-center ">
      <h1 className="text-xl mb-4 text-blue-600">
        Enter Master Key and Nickname
      </h1>
      <Input
        className="w-full p-2 mb-2 border border-gray-300 rounded"
        placeholder="Master Key"
        value={masterKey}
        onChange={e => setMasterKey(e.target.value)}
      />
      <Input
        className="w-full p-2 mb-2 border border-gray-300 rounded"
        placeholder="Room Id"
        value={roomId}
        onChange={e => setRoomId(e.target.value)}
      />
      <Input
        className="w-full p-2 mb-2 border border-gray-300 rounded"
        placeholder="Nickname"
        value={nickname}
        onChange={e => setNickname(e.target.value)}
      />
      <Button variant="default" className="w-full p-2" onClick={handleSubmit}>
        Join Chat
      </Button>
    </div>
  );
};

export default LoginForm;
