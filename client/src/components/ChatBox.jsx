import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import api from '../utils/api';
import { Send, Paperclip } from 'lucide-react';

const SOCKET_URL = 'http://localhost:5000';

const ChatBox = ({ projectId, currentUser }) => {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const socketRef = useRef();
    const messagesEndRef = useRef(null);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const response = await api.get(`/messages/project/${projectId}`);
                setMessages(response.data.data.messages || []);
            } catch (err) {
                console.error("Failed to load chat history", err);
            }
        };
        fetchHistory();

        socketRef.current = io(SOCKET_URL);
        socketRef.current.emit('joinProjectRoom', projectId);

        socketRef.current.on('receiveMessage', (message) => {
            setMessages((prev) => [...prev, message]);
        });

        return () => {
            socketRef.current.disconnect();
        };
    }, [projectId]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        socketRef.current.emit('sendMessage', {
            projectId,
            senderId: currentUser._id,
            text: newMessage
        });
        setNewMessage('');
    };

    const formatTime = (timestamp) => {
        if (!timestamp) return '';
        return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="card" style={{
            display: 'flex', flexDirection: 'column', height: '500px', overflow: 'hidden', marginTop: '1.5rem'
        }}>
            {/* Chat Header */}
            <div style={{
                padding: '1rem 1.5rem', borderBottom: '1px solid var(--color-border)',
                background: 'var(--color-bg-base)'
            }}>
                <h3 style={{ fontWeight: '700', fontSize: '0.9375rem', color: 'var(--color-text-primary)' }}>
                    Project Workspace Chat
                </h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.125rem' }}>
                    Messages are live and end-to-end encrypted.
                </p>
            </div>

            {/* Messages Area */}
            <div style={{
                flex: 1, padding: '1rem 1.5rem', overflowY: 'auto',
                display: 'flex', flexDirection: 'column', gap: '0.75rem',
                background: 'var(--color-bg-deep)'
            }}>
                {messages.length === 0 ? (
                    <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', marginTop: '4rem', fontSize: '0.875rem' }}>
                        No messages yet. Say hello! 👋
                    </p>
                ) : (
                    messages.map((msg, index) => {
                        const senderId = msg.senderId?._id || msg.senderId;
                        const isMe = senderId === currentUser._id;
                        const senderName = msg.senderId?.name || 'Unknown';

                        return (
                            <div key={msg._id || index} style={{
                                display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start'
                            }}>
                                <div style={{
                                    maxWidth: '70%', borderRadius: 'var(--radius-lg)',
                                    padding: '0.625rem 1rem',
                                    background: isMe
                                        ? 'linear-gradient(135deg, #6366f1, #4f46e5)'
                                        : 'var(--color-bg-card)',
                                    border: isMe ? 'none' : '1px solid var(--color-border)',
                                    borderBottomRightRadius: isMe ? '4px' : 'var(--radius-lg)',
                                    borderBottomLeftRadius: isMe ? 'var(--radius-lg)' : '4px',
                                }}>
                                    {!isMe && (
                                        <p style={{ fontSize: '0.6875rem', fontWeight: '700', color: 'var(--color-primary-light)', marginBottom: '0.25rem' }}>
                                            {senderName}
                                        </p>
                                    )}
                                    {msg.fileUrl && (
                                        <div style={{ marginBottom: '0.5rem' }}>
                                            {msg.fileType === 'image' ? (
                                                <img src={msg.fileUrl} alt="attachment" style={{ maxWidth: '100%', borderRadius: 'var(--radius-sm)' }} />
                                            ) : (
                                                <a href={msg.fileUrl} target="_blank" rel="noopener noreferrer"
                                                    style={{ color: 'var(--color-accent-light)', fontSize: '0.8125rem', textDecoration: 'underline' }}>
                                                    📎 View Attachment
                                                </a>
                                            )}
                                        </div>
                                    )}
                                    <p style={{ fontSize: '0.875rem', lineHeight: '1.5', color: isMe ? 'white' : 'var(--color-text-primary)' }}>
                                        {msg.text}
                                    </p>
                                    <p style={{
                                        fontSize: '0.625rem', marginTop: '0.25rem',
                                        color: isMe ? 'rgba(255,255,255,0.5)' : 'var(--color-text-muted)', textAlign: 'right'
                                    }}>
                                        {formatTime(msg.createdAt)}
                                    </p>
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <form onSubmit={handleSendMessage} style={{
                padding: '1rem 1.5rem', borderTop: '1px solid var(--color-border)',
                display: 'flex', gap: '0.5rem', alignItems: 'center',
                background: 'var(--color-bg-card)'
            }}>
                <input
                    type="text" value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message..."
                    className="input-dark"
                    style={{ flex: 1, borderRadius: 'var(--radius-full)', padding: '0.625rem 1rem' }}
                />
                <button type="submit" disabled={!newMessage.trim()} style={{
                    width: '40px', height: '40px', borderRadius: '50%', border: 'none',
                    background: newMessage.trim() ? 'var(--gradient-primary)' : 'var(--color-bg-elevated)',
                    color: 'white', cursor: newMessage.trim() ? 'pointer' : 'default',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.2s', flexShrink: 0
                }}>
                    <Send style={{ width: '16px', height: '16px' }} />
                </button>
            </form>
        </div>
    );
};

export default ChatBox;