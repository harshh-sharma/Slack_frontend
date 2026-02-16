import { useState } from "react";
import { useAuth } from "../context/authContext";
import API from "../axios/axiosInstance";

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    const res = await API.post("/user/login", { email, password });

    login(
      res.data.data.user,
      res.data.data.token
    );
  };

  return (
    <div>
      <input onChange={(e)=>setEmail(e.target.value)} placeholder="Email" />
      <input type="password" onChange={(e)=>setPassword(e.target.value)} placeholder="Password"/>
      <button onClick={handleLogin}>Login</button>
    </div>
  );
}
