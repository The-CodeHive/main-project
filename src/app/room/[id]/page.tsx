"use client";

import dynamic from 'next/dynamic';
import { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { Socket } from 'socket.io-client';
import io from 'socket.io-client';

import {
  FiDownload,
  FiUpload,
  // FiMessageSquare,
  FiLogOut,
  // FiFolder,
  // FiFile,
  // FiTrash2,
  // FiPlus,
  FiCopy,
} from 'react-icons/fi';
import Head from 'next/head';
// import styles from './RoomPage.module.css'; // Import the CSS module

// Dynamically import MonacoEditor without SSR
const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

// Define the languages available
const languages = ['javascript', 'python', 'java', 'cpp', 'csharp', 'html', 'css'];

// Define types for messages and file system
type Message = {
  username: string;
  message: string;
};

// type FileItem = {
//   name: string;
//   type: 'file' | 'folder';
//   content?: string; // Only for files
//   children?: FileItem[]; // Only for folders
// };

export default function RoomPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const roomId = params.id as string;
  const username = searchParams.get('username') as string;

  // State variables with explicit types
  const [code, setCode] = useState<string>('// Start coding here');
  const [socket, setSocket] = useState<typeof Socket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState<string>('');
  // const [showChat, setShowChat] = useState<boolean>(true); // Commented out
  const [language, setLanguage] = useState<string>('javascript');
  // const [fileSystem, setFileSystem] = useState<FileItem[]>([
  //   {
  //     name: 'main',
  //     type: 'folder',
  //     children: [
  //       { name: 'index.js', type: 'file', content: '// Main file content' },
  //     ],
  //   },
  // ]);

  // Refs with explicit types
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize socket connection
  useEffect(() => {
    const newSocket: typeof Socket = io('http://localhost:3001');
    setSocket(newSocket);

    newSocket.emit('join-room', { roomId, username });

    newSocket.on('code-update', (updatedCode: string) => {
      setCode(updatedCode);
    });

    newSocket.on('chat-message', (message: Message) => {
      setMessages((prevMessages) => [...prevMessages, message]);
    });

    newSocket.on('chat-history', (history: Message[]) => {
      setMessages(history);
    });

    newSocket.on('user-joined', (joinedUsername: string) => {
      setMessages((prevMessages) => [
        ...prevMessages,
        { username: 'System', message: `${joinedUsername} has joined the room.` },
      ]);
    });

    // newSocket.on('file-system-update', (updatedFileSystem: FileItem[]) => {
    //   setFileSystem(updatedFileSystem);
    // });

    return () => {
      newSocket.disconnect();
    };
  }, [roomId, username]);

  // Auto-scroll chat to the bottom when messages update
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // Handle code changes in the editor
  const handleCodeChange = (value: string | undefined) => {
    setCode(value || '');
    socket?.emit('code-update', { roomId, code: value || '' });
  };

  // Handle sending a new chat message
  const handleSendMessage = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (inputMessage.trim() && socket) {
      socket.emit('chat-message', { roomId, username, message: inputMessage });
      setInputMessage('');
    }
  };

  // Handle saving code to a file
  const handleSaveCode = () => {
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'code_snippet.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Handle loading code from a file
  const handleLoadCode = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setCode(content);
        socket?.emit('code-update', { roomId, code: content });
      };
      reader.readAsText(file);
    }
  };

  // Handle exiting the room
  const handleExitRoom = () => {
    if (socket) {
      socket.emit('leave-room', { roomId, username });
      socket.disconnect();
    }
    router.push('/');
  };

  // Handle changes to the file system
  // const handleFileSystemChange = (newFileSystem: FileItem[]) => {
  //   setFileSystem(newFileSystem);
  //   socket?.emit('file-system-update', { roomId, fileSystem: newFileSystem });
  // };

  // Add a new folder
  // const addFolder = (path: number[]) => {
  //   const newName = prompt('Enter folder name:');
  //   if (newName) {
  //     const newFileSystem = [...fileSystem];
  //     let current = newFileSystem;
  //     for (let i = 0; i < path.length; i++) {
  //       current = current[path[i]].children!;
  //     }
  //     current.push({ name: newName, type: 'folder', children: [] });
  //     handleFileSystemChange(newFileSystem);
  //   }
  // };

  // Add a new file
  // const addFile = (path: number[]) => {
  //   const newName = prompt('Enter file name:');
  //   if (newName) {
  //     const newFileSystem = [...fileSystem];
  //     let current = newFileSystem;
  //     for (let i = 0; i < path.length; i++) {
  //       current = current[path[i]].children!;
  //     }
  //     current.push({ name: newName, type: 'file', content: '' });
  //     handleFileSystemChange(newFileSystem);
  //   }
  // };

  // Delete a file or folder
  // const deleteItem = (path: number[]) => {
  //   const newFileSystem = [...fileSystem];
  //   let current = newFileSystem;
  //   for (let i = 0; i < path.length - 1; i++) {
  //     current = current[path[i]].children!;
  //   }
  //   current.splice(path[path.length - 1], 1);
  //   handleFileSystemChange(newFileSystem);
  // };

  // Render the file system recursively
  // const renderFileSystem = (items: FileItem[], path: number[] = []) => {
  //   return items.map((item, index) => (
  //     <div key={item.name} className="ml-4">
  //       {item.type === 'folder' ? (
  //         <div>
  //           <FiFolder className="inline-block mr-2" /> {item.name}
  //           <button onClick={() => addFolder([...path, index])} className="ml-2">
  //             <FiPlus />
  //           </button>
  //           <button onClick={() => addFile([...path, index])} className="ml-2">
  //             <FiFile />
  //           </button>
  //           <button onClick={() => deleteItem([...path, index])} className="ml-2">
  //             <FiTrash2 />
  //           </button>
  //           {item.children && renderFileSystem(item.children, [...path, index])}
  //         </div>
  //       ) : (
  //         <div>
  //           <FiFile className="inline-block mr-2" /> {item.name}
  //           <button onClick={() => deleteItem([...path, index])} className="ml-2">
  //             <FiTrash2 />
  //           </button>
  //         </div>
  //       )}
  //     </div>
  //   ));
  // };

  // Handle copying the Room ID
  const handleCopyRoomId = () => {
    navigator.clipboard.writeText(roomId);
    alert('Room ID copied to clipboard!');
  };

  return (
    <>
      <Head>
        <title>CodeHive</title>
      </Head>
      <div className="flex h-screen text-white bg-[#1e1e1e]">
        {/* Sidebar */}
        <div className="w-64 bg-[#252526] p-4 flex flex-col justify-between">
          <div>
            <button
              onClick={handleSaveCode}
              className="w-full mb-2 p-2 bg-[#3C3C3C] hover:bg-[#406958] transition-colors flex items-center justify-center rounded"
            >
              <FiDownload className="inline-block mr-2" /> Download File
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full mb-2 p-2 bg-[#3C3C3C] hover:bg-[#565096] transition-colors flex items-center justify-center rounded"
            >
              <FiUpload className="inline-block mr-2" /> Upload File
            </button>
            {/* <button
              onClick={() => setShowChat(!showChat)}
              className="w-full mb-2 p-2 bg-[#3C3C3C] hover:bg-[#505050] transition-colors flex items-center justify-center rounded"
            >
              <FiMessageSquare className="inline-block mr-2" /> {showChat ? 'Hide' : 'Show'} Chat
            </button> */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleLoadCode}
              className="hidden"
              accept=".txt,.js,.py,.html,.css"
            />
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full mb-4 p-2 bg-[#3C3C3C] text-white rounded"
            >
              {languages.map((lang) => (
                <option key={lang} value={lang}>
                  {lang}
                </option>
              ))}
            </select>
            {/* <div className="mt-4">
              <h3 className="text-lg font-semibold mb-2">File System</h3>
              {renderFileSystem(fileSystem)}
            </div> */}
          </div>
          <div className="mt-4">
            <div className="text-sm mb-2">Room ID: {roomId}</div>
            <div className="text-sm">Username: {username}</div>
            <button onClick={handleCopyRoomId} className="w-full mb-2 p-2 bg-[#3C3C3C] hover:bg-[#505050] transition-colors flex items-center justify-center rounded">
              <FiCopy className="inline-block mr-2" /> Copy Room ID
            </button>
            <button
              onClick={handleExitRoom}
              className="w-full mb-2 p-2 bg-[#3C3C3C] hover:bg-[#e8002b] transition-colors flex items-center justify-center rounded"
            >
              <FiLogOut className="inline-block mr-2" /> Exit Room
            </button>
          </div>
        </div>

        {/* Main content */}
        <div className="flex flex-1">
          {/* Code editor */}
          <div className="flex-1">
            <MonacoEditor
              height="100%"
              language={language}
              theme="vs-dark"
              value={code}
              onChange={handleCodeChange}
              options={{
                minimap: { enabled: false },
                fontSize: 16,
              }}
            />
          </div>

          {/* Chat */}
          <div className="w-80 bg-[#252526] p-4 flex flex-col">
            <div ref={chatContainerRef} className="flex-1 overflow-y-auto mb-4">
              {messages.map((msg, index) => (
                <div key={index} className="mb-2">
                  <span className="font-bold">{msg.username}: </span>
                  <span>{msg.message}</span>
                </div>
              ))}
            </div>
            <form onSubmit={handleSendMessage} className="flex">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                className="flex-1 p-2 bg-[#3C3C3C] text-white rounded-l"
                placeholder="Type a message..."
              />
              <button
                type="submit"
                className="ml-2 px-4 py-2 bg-[#0E639C] hover:bg-[#1177BB] transition-colors rounded-r"
              >
                Send
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
