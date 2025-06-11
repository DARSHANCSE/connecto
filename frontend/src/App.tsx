import { useEffect, useState } from "react";
import "./App.css";
import { Route, BrowserRouter, Routes } from "react-router-dom";
import { Sender } from "./components/Sender";
import { Receiver } from "./components/Receiver";
import { HomePage } from "./components/HomePage";
import { Chat } from "./components/Chat";
import { Login } from "./components/Login";
import Register from "./components/Register";
import { jwtDecode } from "jwt-decode";
function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userId, setuserId] = useState(null);
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      if (token) {
        const decode = jwtDecode(token);
        // @ts-ignore
        setuserId(decode.id);
      }
      setIsLoggedIn(true);

    }
  });
  return (
    <BrowserRouter>
      <Routes>
        {isLoggedIn && (
          <>
            <Route path="/" element={<HomePage />} />
            <Route path="/sender" element={<Sender />} />
            <Route path="/receiver" element={<Receiver />} />
            <Route path="/chat" element={<Chat userId={userId} />} />
          </>
        )}
        <Route
          path="/register"
          element={<Register setIsLoggedIn={setIsLoggedIn} />}
        />
        <Route path="/*" element={<Login setIsLoggedIn={setIsLoggedIn} />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
