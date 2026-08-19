import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import api from '../utils/api';
import { Send, Paperclip, X, Loader } from 'lucide-react';

const SOCKET_URL = 'http://localhost:5000';

const ChatBox = ({ projectId, currentUser }) => {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploadingFile, setUploadingFile] = useState(false);
    const socketRef = useRef();
    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);

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

    const handleFileSelect = (e) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedFile(e.target.files[0]);
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() && !selectedFile) return;

        let fileUrl = null;
        let fileType = null;

        if (selectedFile) {
            try {
                setUploadingFile(true);
                const formData = new FormData();
                formData.append('file', selectedFile);

                const uploadRes = await api.post('/messages/upload', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });

                fileUrl = uploadRes.data.data.fileUrl;
                fileType = uploadRes.data.data.fileType;
            } catch (err) {
                console.error("File upload failed:", err);
                alert("Failed to upload file attachment. Please try again.");
                setUploadingFile(false);
                return;
            } finally {
                setUploadingFile(false);
            }
        }

        socketRef.current.emit('sendMessage', {
            projectId,
            senderId: currentUser._id,
            text: newMessage.trim(),
            fileUrl,
            fileType,
        });

        setNewMessage('');
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const formatTime = (timestamp) => {
        if (!timestamp) return '';
        return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="card" style={{
            display: 'flex', flexDirection: 'column', height: '520px', overflow: 'hidden', marginTop: '1.5rem'
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
                    Real-time collaboration & secure file sharing.
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
                        No messages yet. Say hello or share project files! 👋
                    </p>
                ) : (
                    messages.map((msg, index) => {
                        const senderId = msg.senderId?._id || msg.senderId;
                        const isMe = senderId === currentUser._id;
                        const senderName = msg.senderId?.name || 'User';

                        return (
                            <div key={msg._id || index} style={{
                                display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start'
                            }}>
                                <div style={{
                                    maxWidth: '75%', borderRadius: 'var(--radius-lg)',
                                    padding: '0.75rem 1rem',
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
                                            {msg.fileType === 'image' || (typeof msg.fileUrl === 'string' && msg.fileUrl.startsWith('data:image/')) ? (
                                                <img src={msg.fileUrl} alt="attachment" style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: 'var(--radius-sm)', objectFit: 'cover' }} />
                                            ) : (
                                                <a href={msg.fileUrl} target="_blank" rel="noopener noreferrer"
                                                    style={{
                                                        display: 'inline-flex', alignItems: 'center', gap: '6px',
                                                        color: isMe ? '#e0e7ff' : 'var(--color-accent-light)',
                                                        fontSize: '0.8125rem', textDecoration: 'underline',
                                                        wordBreak: 'break-all'
                                                    }}>
                                                    <Paperclip style={{ width: '14px', height: '14px' }} /> View Attachment
                                                </a>
                                            )}
                                        </div>
                                    )}
                                    {msg.text && (
                                        <p style={{ fontSize: '0.875rem', lineHeight: '1.5', color: isMe ? 'white' : 'var(--color-text-primary)', margin: 0 }}>
                                            {msg.text}
                                        </p>
                                    )}
                                    <p style={{
                                        fontSize: '0.625rem', marginTop: '0.375rem',
                                        color: isMe ? 'rgba(255,255,255,0.6)' : 'var(--color-text-muted)', textAlign: 'right', margin: 0
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

            {/* Selected File Badge */}
            {selectedFile && (
                <div style={{
                    padding: '0.5rem 1.5rem', background: 'rgba(99,102,241,0.1)',
                    borderTop: '1px solid rgba(99,102,241,0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    fontSize: '0.75rem', color: 'var(--color-primary-light)'
                }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <Paperclip style={{ width: '14px', height: '14px' }} />
                        Attached: <strong>{selectedFile.name}</strong> ({(selectedFile.size / 1024).toFixed(1)} KB)
                    </span>
                    <button type="button" onClick={() => { setSelectedFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                        style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', display: 'flex' }}>
                        <X style={{ width: '14px', height: '14px' }} />
                    </button>
                </div>
            )}

            {/* Input Area */}
            <form onSubmit={handleSendMessage} style={{
                padding: '0.875rem 1.5rem', borderTop: '1px solid var(--color-border)',
                display: 'flex', gap: '0.5rem', alignItems: 'center',
                background: 'var(--color-bg-card)'
            }}>
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    style={{ display: 'none' }}
                />

                <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    title="Attach a file"
                    disabled={uploadingFile}
                    style={{
                        width: '38px', height: '38px', borderRadius: '50%', border: '1px solid var(--color-border)',
                        background: selectedFile ? 'rgba(99,102,241,0.2)' : 'var(--color-bg-elevated)',
                        color: selectedFile ? 'var(--color-primary-light)' : 'var(--color-text-muted)',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.2s', flexShrink: 0
                    }}
                >
                    <Paperclip style={{ width: '16px', height: '16px' }} />
                </button>

                <input
                    type="text" value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message..."
                    disabled={uploadingFile}
                    className="input-dark"
                    style={{ flex: 1, borderRadius: 'var(--radius-full)', padding: '0.625rem 1rem' }}
                />

                <button type="submit" disabled={uploadingFile || (!newMessage.trim() && !selectedFile)} style={{
                    width: '40px', height: '40px', borderRadius: '50%', border: 'none',
                    background: (newMessage.trim() || selectedFile) ? 'var(--gradient-primary)' : 'var(--color-bg-elevated)',
                    color: 'white', cursor: (newMessage.trim() || selectedFile) ? 'pointer' : 'default',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.2s', flexShrink: 0
                }}>
                    {uploadingFile ? (
                        <Loader style={{ width: '16px', height: '16px', animation: 'spin 1s linear infinite' }} />
                    ) : (
                        <Send style={{ width: '16px', height: '16px' }} />
                    )}
                </button>
            </form>
        </div>
    );
};

export default ChatBox;