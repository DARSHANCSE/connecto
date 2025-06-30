import { useEffect, useState } from 'react';
import axios from 'axios';

interface Group {
    id: string;
    name: string;
}

interface Message {
    id: number | string;
    content: string;
    fromId: string;
}

interface User {
    id: string;
}

export const Chat = ({ userId }: { userId: string }) => {
    const [groups, setGroups] = useState<Group[]>([]);
    const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [socket, setSocket] = useState<WebSocket | null>(null);
    const [newGroupName, setNewGroupName] = useState('');
    const [isCreatingGroup, setIsCreatingGroup] = useState(false);
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());

    useEffect(() => {
        console.log(userId)
        if (!userId) {
            setError("User ID is required");
            setIsLoading(false);
            return;
        }

        const fetchInitialData = async () => {
            try {
                const [groupsRes, usersRes] = await Promise.all([
                    axios.get(`http://localhost:6969/getgroups/${userId}`),
                    axios.get(`http://localhost:6969/getusers`)
                ]);
                setGroups(groupsRes.data);
                setAllUsers(usersRes.data.filter((user: User) => user.id !== userId));
            } catch (err) {
                setError(`Failed to fetch initial data: ${err}`);
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchInitialData();
    }, [userId]);

    useEffect(() => {
        if (!selectedGroup) return;
        const setMes=async () => {
        const prevmess=await axios.get(`http://localhost:6969/getmessages/${selectedGroup.id}`);
        setMessages(prevmess.data);
        }
        setMes();

        const ws = new WebSocket("ws://localhost:6969");
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

        setMessages([
            { id: 1, fromId: 'System', content: "Welcome to the chat!" }
        ]);

        return () => {
            ws.close();
        };
    }, [selectedGroup]);

    const sendMessage = () => {
        if (!input.trim() || !socket || socket.readyState !== WebSocket.OPEN) return;

        const msg = {
            type: 'chat',
            fromId: userId,
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

    const handleUserSelection = (selectedUserId: string) => {
        setSelectedUserIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(selectedUserId)) {
                newSet.delete(selectedUserId);
            } else {
                newSet.add(selectedUserId);
            }
            return newSet;
        });
    };

    const handleCreateGroup = async () => {
        if (!newGroupName.trim() || !userId || isCreatingGroup) return;
        setIsCreatingGroup(true);
        setError(null);
        try {
            const memberIds = [userId, ...Array.from(selectedUserIds)];
            const response = await axios.post('http://localhost:6969/creategroup', {
                name: newGroupName,
                userIds: memberIds,
            });
            setGroups((prevGroups) => [...prevGroups, response.data]);
            setNewGroupName('');
            setSelectedUserIds(new Set());
        } catch (err) {
            console.error("Failed to create group:", err);
            setError('Failed to create group. Please try again.');
        } finally {
            setIsCreatingGroup(false);
        }
    };

    if (isLoading) return (
        <div className="min-h-screen w-screen bg-gradient-to-br from-gray-900 to-black text-white flex justify-center items-center">
            Loading...
        </div>
    );
    
    if (error) return (
        <div className="min-h-screen w-screen bg-gradient-to-br from-gray-900 to-black text-white flex justify-center items-center">
            <div className="text-red-500">{error}</div>
        </div>
    );

    if (!selectedGroup) {
        return (
            <div className="min-h-screen w-screen bg-gradient-to-br from-gray-900 to-black text-white flex justify-center items-center p-8">
                <div className="w-full max-w-md text-center p-8 bg-gray-800 rounded-lg shadow-2xl">
                    <h2 className="text-3xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">Select a Group</h2>
                    <ul className="list-none p-0 mb-6 max-h-60 overflow-y-auto">
                        {groups.map((group) => (
                            <li key={group.id} className="mb-2">
                                <button
                                    onClick={() => setSelectedGroup(group)}
                                    className="w-full p-3 border-none rounded-lg bg-gray-700 text-white cursor-pointer text-base hover:bg-gray-600 transition-all duration-300 transform hover:scale-105"
                                >
                                    {group.name}
                                </button>
                            </li>
                        ))}
                    </ul>
                    <div className="border-t border-gray-700 pt-6">
                        <h3 className="text-xl font-semibold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">Or Create a New One</h3>
                        <div className="space-y-4">
                            <input
                                type="text"
                                value={newGroupName}
                                onChange={(e) => setNewGroupName(e.target.value)}
                                placeholder="New group name"
                                className="w-full p-3 border border-gray-700 rounded-lg bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                                disabled={isCreatingGroup}
                            />
                            <div>
                                <h4 className="text-lg font-semibold text-left mb-2 text-gray-300">Add Members</h4>
                                <div className="max-h-32 overflow-y-auto border border-gray-700 rounded-lg p-2 bg-gray-900">
                                    {allUsers.length > 0 ? (
                                        allUsers.map(user => (
                                            <div key={user.id} className="flex items-center p-2 rounded-md hover:bg-gray-700">
                                                <input
                                                    type="checkbox"
                                                    id={`user-${user.id}`}
                                                    checked={selectedUserIds.has(user.id)}
                                                    onChange={() => handleUserSelection(user.id)}
                                                    className="w-4 h-4 text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-500 cursor-pointer"
                                                />
                                                <label htmlFor={`user-${user.id}`} className="ml-3 text-sm font-medium text-gray-300 cursor-pointer">
                                                    {user.id}
                                                </label>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-gray-500">No other users found.</p>
                                    )}
                                </div>
                            </div>
                            <button
                                onClick={handleCreateGroup}
                                className="w-full p-3 border-none rounded-lg bg-purple-500 text-white cursor-pointer hover:bg-purple-600 transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed"
                                disabled={isCreatingGroup || !newGroupName.trim()}
                            >
                                {isCreatingGroup ? 'Creating...' : 'Create Group'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen w-screen bg-gradient-to-br from-gray-900 to-black text-white flex justify-center items-center p-4">
            <div className="flex flex-col h-[90vh] w-full max-w-4xl bg-gray-800 rounded-lg overflow-hidden shadow-2xl">
                <div className="flex items-center p-4 bg-gray-900 shadow-md">
                    <button onClick={() => setSelectedGroup(null)} className="bg-transparent border-none text-white text-2xl cursor-pointer mr-4 hover:text-blue-400 transition-colors">&larr;</button>
                    <h1 className="m-0 text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">{selectedGroup.name}</h1>
                </div>
                <ul className="flex-1 list-none p-4 overflow-y-auto space-y-3">
                    {messages.map((message) => (
                        <li key={message.id} className={`flex ${message.fromId === userId ? 'justify-end' : 'justify-start'}`}>
                            <div className={`p-3 rounded-2xl max-w-[70%] ${message.fromId === userId ? 'bg-blue-600' : 'bg-gray-700'}`}>
                                {message.fromId !== userId && <strong className="block text-xs text-gray-400 mb-1">{message.fromId}</strong>}
                                <div>{message.content}</div>
                            </div>
                        </li>
                    ))}
                </ul>
                <div className="flex p-4 bg-gray-900">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Type your message"
                        className="flex-1 p-3 border border-gray-700 rounded-full bg-gray-700 text-white mr-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') sendMessage();
                        }}
                    />
                    <button
                        onClick={sendMessage}
                        className="p-3 border-none rounded-full bg-blue-500 text-white cursor-pointer hover:bg-blue-600 transition-colors"
                    >
                        Send
                    </button>
                </div>
            </div>
        </div>
    );
};
