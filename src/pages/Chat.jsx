import { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";
import { useAuth } from "../context/authContext";
import API from "../axios/axiosInstance";

export default function Chat() {
  const { token, logout } = useAuth();

  const socketRef = useRef(null);
  const currentGroupRef = useRef(null);
  const messagesEndRef = useRef(null);

  const [groups, setGroups] = useState([]);
  const [members, setMembers] = useState([]);
  const [currentGroup, setCurrentGroup] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [newGroupName, setNewGroupName] = useState("");
  const [selectedMembers, setSelectedMembers] = useState([]);

  useEffect(() => {
    if (!token) return;

    socketRef.current = io("http://localhost:3000", { auth: { token } });

    socketRef.current.on("connect", () => {
      console.log("Socket connected:", socketRef.current.id);
    });

    socketRef.current.on("receive_message", (msg) => {
      if (msg.groupId === currentGroupRef.current?._id) {
        setMessages((prev) => [...prev, msg]);
      }
    });

    socketRef.current.on("connect_error", (err) => {
      console.log("Socket connection error:", err.message);
    });

    return () => {
      socketRef.current.disconnect();
    };
  }, [token]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = async () => {
    try {
      const res = await API.get("/group/groups");
      setGroups(res.data.data.groups);
    } catch (err) {
      console.log(err);
    }
  };

  const loadMembers = async () => {
    try {
      const res = await API.get("/user/members");
      setMembers(res.data.data);
    } catch (err) {
      console.log(err);
    }
  };

  const createGroup = async () => {
    if (!newGroupName) return;

    try {
      const res = await API.post("/group/create", { name: newGroupName });
      const group = res.data.data.group;

      await Promise.all(
        selectedMembers.map((userId) =>
          API.post(`/group/add/member/${group._id}`, { userId })
        )
      );

      setGroups((prev) => [...prev, group]);
      setNewGroupName("");
      setSelectedMembers([]);
      alert("Group created successfully!");
    } catch (err) {
      console.log(err);
    }
  };

  const joinGroup = async (group) => {
    setCurrentGroup(group);
    currentGroupRef.current = group;

    socketRef.current.emit("join_group", group._id);

    try {
      const res = await API.get(`/message/${group._id}`);
      setMessages(res.data.data.messages);
    } catch (err) {
      console.log(err);
    }
  };

  const sendMessage = async () => {
    if (!text.trim() || !currentGroup) return;

    const payload = { groupId: currentGroup._id, text };

    try {
      socketRef.current.emit("send_message", payload);
      await API.post(`/message/${currentGroup._id}`, { text });
      setText("");
    } catch (err) {
      console.log(err);
    }
  };

  const handleLogout = () => {
    if (socketRef.current) socketRef.current.disconnect();
    logout?.();
    setCurrentGroup(null);
    currentGroupRef.current = null;
    setMessages([]);
    setGroups([]);
    setMembers([]);
    setText("");
    setSelectedMembers([]);
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <div className="w-1/3 bg-white border-r p-6 overflow-y-auto">
        <div className="mb-4">
          <button
            onClick={handleLogout}
            className="bg-red-600 text-white px-4 py-2 rounded w-full"
          >
            Logout
          </button>
        </div>

        <h2 className="text-xl font-bold mb-4">Create Group</h2>
        <input
          className="w-full border p-2 rounded mb-2"
          placeholder="Group Name"
          value={newGroupName}
          onChange={(e) => setNewGroupName(e.target.value)}
        />
        <button
          onClick={loadMembers}
          className="bg-gray-500 text-white px-3 py-1 rounded w-full mb-2"
        >
          Load Members
        </button>

        <div className="space-y-2 mb-3">
          {members.map((m) => (
            <label key={m._id} className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={selectedMembers.includes(m._id)}
                onChange={(e) =>
                  e.target.checked
                    ? setSelectedMembers((prev) => [...prev, m._id])
                    : setSelectedMembers((prev) =>
                        prev.filter((id) => id !== m._id)
                      )
                }
              />
              <span>{m.name}</span>
            </label>
          ))}
        </div>

        <button
          onClick={createGroup}
          className="bg-purple-600 text-white px-4 py-2 rounded w-full mb-6"
        >
          Create Group
        </button>

        <hr className="mb-6" />
        <h2 className="text-xl font-bold mb-4">My Groups</h2>
        <div className="space-y-2">
          {groups.map((g) => (
            <div
              key={g._id}
              onClick={() => joinGroup(g)}
              className={`p-2 rounded cursor-pointer ${
                currentGroup?._id === g._id
                  ? "bg-indigo-200"
                  : "hover:bg-gray-200"
              }`}
            >
              {g.name}
            </div>
          ))}
        </div>
      </div>

      <div className="w-2/3 flex flex-col p-6">
        <h2 className="text-2xl font-bold mb-4">
          {currentGroup ? currentGroup.name : "Select a Group"}
        </h2>
        <div className="flex-1 bg-white rounded shadow p-4 overflow-y-auto mb-4">
          {messages.map((m) => (
            <div key={m._id} className="mb-2 p-2 bg-gray-100 rounded">
              <strong>{m.senderId?.name}:</strong> {m.text}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        {currentGroup && (
          <div className="flex space-x-2">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="flex-1 border p-2 rounded"
              placeholder="Type message..."
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            />
            <button
              onClick={sendMessage}
              className="bg-blue-600 text-white px-4 py-2 rounded"
            >
              Send
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
