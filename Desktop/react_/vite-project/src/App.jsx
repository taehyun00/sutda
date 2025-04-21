
import './App.css'
import Header from "./components/Header";
import Editor from "./components/Editer";
import Lists from "./components/Lists";

import {useRef , useState } from "react"

function App() {

  const mockData = [
    {
      id : 0,
      isDone: false,
      content: "React 공부하기",
      date: new Date().getTime(),
    },
    {
      id : 1,
      isDone: false,
      content: "Next.js 공부하기",
      date: new Date().getTime(),
    },
    {
      id : 2,
      isDone: false,
      content: "Node.js 공부하기",
      date: new Date().getTime(),
    },
  ];
  
  const [todos, SetTodos] = useState(mockData);
   
  const idRef = useRef(3);
  
  const onCreate = (content) => {
    const Newtodo = {
      id: idRef.current++,
      isDone : false,
      content : content,
      date: new Date().getTime(),
    };

    SetTodos([Newtodo, ...todos])
    

  }

  const onDelete = (targetID) => {
    SetTodos(
      todos.filter((todo) => todo.id!==targetID)
    )
  }

  const onUpdate = (targetId) => {
    SetTodos(
      todos.map((todo) => todo.id ===targetId ? {...todo, isDone: !todo.isDone} : todo)
    )}
  return <>
  <Header />
  <Editor onCreate={onCreate} />
  <Lists todos={todos} onUpdate={onUpdate} onDelete = {onDelete}/>
  </>
}

export default App
