"use client"

import { useEffect, useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/router';

export default function Room() {
  const [rooms, setRooms] = useState([]);
  const [newRoomName, setNewRoomName] = useState('');
  const [editRoomId, setEditRoomId] = useState(null);
  const [editRoomName, setEditRoomName] = useState('');
  const router = useRouter(); // ✅ 여기서 useRouter 사용

  const api = 'http://localhost:8080/api/rooms';

  const fetchRooms = async () => {
    try {
      const res = await axios.get(`${api}/list`);
      setRooms(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  const createRoom = async () => {
    if (!newRoomName.trim()) return;
    try {
      await axios.post(`${api}/create`, { name: newRoomName });
      setNewRoomName('');
      fetchRooms();
    } catch (err) {
      console.error(err);
    }
  };

  const deleteRoom = async (id) => {
    try {
      await axios.delete(`${api}/delete/${id}`);
      fetchRooms();
    } catch (err) {
      console.error(err);
    }
  };

  const updateRoom = async (id) => {
    try {
      await axios.put(`${api}/update/`, { id, name: editRoomName });
      setEditRoomId(null);
      setEditRoomName('');
      fetchRooms();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ padding: '1rem' }}>
      <h1>방 목록</h1>

      <div style={{ marginBottom: '1rem' }}>
        <input
          type="text"
          value={newRoomName}
          onChange={(e) => setNewRoomName(e.target.value)}
          placeholder="새 방 이름"
        />
        <button onClick={createRoom}>방 생성</button>
      </div>

      <ul>
        {rooms.map((room) => (
          <li key={room.id}>
            {editRoomId === room.id ? (
              <>
                <p>{room.id}</p>
                <input
                  type="text"
                  value={editRoomName}
                  onChange={(e) => setEditRoomName(e.target.value)}
                />
                <button onClick={() => updateRoom(room.id)}>저장</button>
                <button onClick={() => setEditRoomId(null)}>취소</button>
              </>
            ) : (
              <>
                <strong>{room.name}</strong>
                <button onClick={() => router.push(`/room/${room.id}`)}>입장</button> {/* ✅ 항상 입장 버튼 표시 */}
                <button onClick={() => {
                  setEditRoomId(room.id);
                  setEditRoomName(room.name);
                }}>수정</button>
                <button onClick={() => deleteRoom(room.id)}>삭제</button>
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
