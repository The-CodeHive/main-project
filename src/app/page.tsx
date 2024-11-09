"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./Home.module.css"; // import your CSS


export default function Home() {
  const [roomId, setRoomId] = useState("");
  const [username, setUsername] = useState("");
  const router = useRouter();

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (roomId && username) {
      router.push(`/room/${roomId}?username=${username}`);
    }
  };

  const generateRoomId = () => {
    const newRoomId = Math.random().toString(36).substring(2, 10);
    setRoomId(newRoomId);
  };

  return (
    <>
      <div className={`${styles.container} ${styles.vt323regular} ${styles.selectionWraper}`}>
        <div className={styles.formWrapper}>
          <h1 className={`${styles.title} ${styles.jacquardaBastarda}`}>
            Join a Coding Room
          </h1>
          <form onSubmit={handleJoinRoom}>
            <div className={styles.formGroup}>
              <label htmlFor="roomId">Room ID</label>
              <input
                type="text"
                id="roomId"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                placeholder="Enter Room ID"
                required
                className={styles.input}
              />
              <p className={styles.generateText} onClick={generateRoomId}>
                Generate Room ID
              </p>
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="username">Username</label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                required
                className={styles.input}
              />
            </div>
            <button type="submit" id="joinButton" className={styles.button}>
              Join Room
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
