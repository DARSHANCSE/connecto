import { useState } from 'react'; 
import { Navigate } from 'react-router-dom';

export const HomePage = () => {
  const [selectedMode, setSelectedMode] = useState<'sender' | 'receiver' | null>(null);



  if (selectedMode === 'receiver') {
    return <Navigate to="/receiver" />;
  }

  if (selectedMode === 'sender') {
    return <Navigate to="/sender" />;
  }

  return (
    <div className="min-h-screen w-screen bg-gradient-to-br from-gray-900 to-black text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-center bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-500">
          Welcome to TechConnect
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div 
            onClick={() => setSelectedMode('sender')}
            className="bg-gray-800 p-6 rounded-lg cursor-pointer hover:bg-gray-700 transition-all duration-300 transform hover:scale-105"
          >
            <h2 className="text-2xl font-semibold mb-4 text-blue-400">Start Video Call</h2>
            <p className="text-gray-300">Initiate a new video call as a sender</p>
          </div>

          <div 
            onClick={() => setSelectedMode('receiver')}
            className="bg-gray-800 p-6 rounded-lg cursor-pointer hover:bg-gray-700 transition-all duration-300 transform hover:scale-105"
          >
            <h2 className="text-2xl font-semibold mb-4 text-purple-400">Join Video Call</h2>
            <p className="text-gray-300">Join an existing video call as a receiver</p>
          </div>
        </div>
      </div>
    </div>
  );
}; 