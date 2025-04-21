import '../App.css';
import {useState} from "react"

function Editer({onCreate}) {


 const [content, setContent] = useState("");

 const onChangeContent = (e) => {
     setContent(e.target.value);
 }
 
 const onSubmit = () => {
     onCreate(content);
     setContent("");
 }

  return(
    <div className='editmain'>
        <input type="text" placeholder="새로운 Todo..." value={content} onChange={onChangeContent}></input>
        <button onClick={onSubmit}>추가</button>
    </div>
  )
}

export default Editer
