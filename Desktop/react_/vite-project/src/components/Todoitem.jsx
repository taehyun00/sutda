
import '../App.css'
const Todoitem = ({id, isDone, content, date, onUpdate, onDelete}) =>{
  const onClickDeleteButon =()=>{
    onDelete(id);
  }

  const onChangeCheckbox = () => {
    onUpdate(id)
}
    return(
      <div className="Item">
        <input type="checkbox" className='Iteminput' checked={isDone} onChange={onChangeCheckbox}></input>
        <div>{content}</div>
        <div className='itemdate'>{new Date(date).toLocaleDateString()}</div>
        <button className='Itembutton' onClick={onClickDeleteButon}>삭제</button>
    
      </div>
    )
  }
  
  export default Todoitem
  