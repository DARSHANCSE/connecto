import { useEffect, useState } from 'react';
import axios from 'axios';
export const Chat = ({ userId }) => {
    const [groups, setGroups] = useState([]);
    const [selectedGroup, setSelectedGroup] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [socket, setSocket] = useState<WebSocket | null>(null);
    const [input, setInput] = useState('');

    useEffect(() => {
        if (!userId) {
            setError("User ID is required");
            setIsLoading(false);
            return;
        }

        axios.get(`http://192.168.137.81:6969/getgroups/${userId}`)
            .then((res) => {
                setGroups(res.data);
                setIsLoading(false);
            })
            .catch((err) => {
                setError(`Failed to fetch groups: ${err}`);
                setIsLoading(false);
            });
    }, [userId]);

    useEffect(() => {
        if (!selectedGroup) return;

        const ws = new WebSocket("ws://192.168.137.81:6969");
        setSocket(ws);

        ws.onopen = () => {
            ws.send(JSON.stringify({
                type: "identify",
                userId,
                groupId: selectedGroup.id,
                medium: "websocket"
            }));
        };

        ws.onmessage = (event) => {
            const message = JSON.parse(event.data);
            if (message.type === 'chat') {
                setMessages((prevMessages) => [...prevMessages, message]);
            }
        };

        ws.onerror = (error) => {
            console.error("WebSocket error:", error);
            setError(`WebSocket error`);
        };

        ws.onclose = () => {
            console.log("WebSocket connection closed");
        };

        // Dummy welcome message
        setMessages([
            { id: 1, content: "Welcome to the chat!", sender: { name: "System" } }
        ]);

        return () => {
            ws.close();
        };
    }, [selectedGroup]);

    const sendMessage = () => {
        if (!input.trim() || !socket || socket.readyState !== WebSocket.OPEN) return;

        const msg = {
            type: 'chat',
            from: userId,
            to: selectedGroup?.id,
            medium: 'websocket',
            content: input,
            id: Date.now(),
            sender: { name: userId }
        };

        socket.send(JSON.stringify(msg));
        setMessages((prevMessages) => [...prevMessages, msg]);
        setInput('');
    };

    if (isLoading) return <div>Loading...</div>;
    if (error) return <div>{error}</div>;

    if (!selectedGroup) {
        return (
            <div style={{ padding: '1rem' }}>
                <h2>Select a Group</h2>
                <ul>
                    {groups.map((group) => (
                        <li key={group.id}>
                            <button onClick={() => setSelectedGroup(group)}>
                                {group.name}
                            </button>
                        </li>
                    ))}
                </ul>
            </div>
        );
    }

    return (
        <div style={{ padding: '1rem' }}>
            <h1>Chat with {selectedGroup.name}</h1>
            <ul style={{ listStyle: 'none', padding: 0 }}>
                {messages.map((message) => (
                    <li key={message.id}>
                        <strong>{message.sender.name}:</strong> {message.content}
                    </li>
                ))}
            </ul>

            <div style={{ marginTop: '1rem' }}>
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type your message"
                    style={{ width: '80%', padding: '0.5rem' }}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') sendMessage();
                    }}
                />
                <button
                    onClick={sendMessage}
                    style={{ padding: '0.5rem 1rem', marginLeft: '0.5rem' }}
                >
                    Send
                </button>
            </div>
        </div>
    );
};
