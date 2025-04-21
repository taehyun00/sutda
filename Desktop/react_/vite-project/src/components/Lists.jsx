import Todoitem from "./Todoitem"
import {useRef , useState } from "react"


const Lists = ({todos, onUpdate, onDelete}) => {
  const [search, SetSearch] = useState("")

    const onChangeSearch = (e) => {
        SetSearch(e.target.value);
    }

    const getFilterData = () =>{
      if(search ==="") return todos;

      return todos.filter((todo)=>{
          return todo.content.includes(search.toLowerCase())
      }
  )}
  const filterdTodos = getFilterData()



  return(
    <div className="List">
    <h4> Todo List 🌱</h4>
    <input placeholder="검색어를 입력하세요"  className="Listinput" value={search} onChange={onChangeSearch}/>
      <div className='todos_wrapper'>
      {filterdTodos.map((todo) => {
        return <Todoitem 
        key ={todo.id} 
        {...todo} 
        onUpdate = {onUpdate}
        onDelete = {onDelete}/>
    })}
      </div>
    </div>
  )

}

export default Lists
