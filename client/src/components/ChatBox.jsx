import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import api from '../utils/api';
import { Send } from 'lucide-react';

// Connect to your backend URL (make sure this matches your Node server port!)
const SOCKET_URL = 'http://localhost:5000';

const ChatBox = ({ projectId, currentUser }) => {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const socketRef = useRef();
    const messagesEndRef = useRef(null); // Used to auto-scroll to the bottom

    // 1. Fetch Chat History & Setup Sockets
    useEffect(() => {
        // Fetch old messages from the database
        const fetchHistory = async () => {
            try {
                const response = await api.get(`/messages/${projectId}`);
                setMessages(response.data.data || []);
            } catch (err) {
                console.error("Failed to load chat history", err);
            }
        };
        fetchHistory();

        // Initialize Socket connection
        socketRef.current = io(SOCKET_URL);

        // Tell the server we want to join this specific project's chat room
        socketRef.current.emit('join_project_room', projectId);

        // Listen for incoming live messages
        socketRef.current.on('receive_message', (message) => {
            setMessages((prev) => [...prev, message]);
        });

        // Cleanup when the user leaves the page
        return () => {
            socketRef.current.disconnect();
        };
    }, [projectId]);

    // 2. Auto-scroll to bottom when a new message arrives
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // 3. Send a message
    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        const messageData = {
            projectId: projectId,
            senderId: currentUser._id,
            text: newMessage
        };

        // Emit the message to the socket server
        socketRef.current.emit('send_message', messageData);
        setNewMessage(''); // Clear the input field
    };

    return (
        <div className="flex flex-col h-[500px] bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mt-8">
            {/* Chat Header */}
            <div className="bg-gray-50 border-b border-gray-200 p-4">
                <h3 className="font-bold text-gray-800">Project Workspace Chat</h3>
                <p className="text-xs text-gray-500">Messages are live and secure.</p>
            </div>

            {/* Messages Area */}
            <div className="flex-1 p-4 overflow-y-auto bg-gray-50/50 space-y-4">
                {messages.length === 0 ? (
                    <p className="text-center text-gray-400 mt-10">No messages yet. Say hello!</p>
                ) : (
                    messages.map((msg, index) => {
                        const isMe = msg.sender?._id === currentUser._id;

                        return (
                            <div key={index} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[70%] rounded-2xl px-4 py-2 ${isMe
                                        ? 'bg-blue-600 text-white rounded-br-sm'
                                        : 'bg-white border border-gray-200 text-gray-800 rounded-bl-sm'
                                    }`}>
                                    {!isMe && <p className="text-xs text-gray-500 font-bold mb-1">{msg.sender?.name}</p>}
                                    <p className="text-sm">{msg.text}</p>
                                </div>
                            </div>
                        );
                    })
                )}
                {/* Invisible div to help us auto-scroll */}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-gray-200 flex gap-2">
                <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <button
                    type="submit"
                    disabled={!newMessage.trim()}
                    className="bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 transition-colors disabled:bg-gray-300"
                >
                    <Send className="w-5 h-5 ml-1 mb-1 mt-1 mr-1" />
                </button>
            </form>
        </div>
    );
};

export default ChatBox;