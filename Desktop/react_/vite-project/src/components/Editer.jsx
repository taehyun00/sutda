import '../App.css';
import {useState,useRef} from "react"

function Editer({onCreate}) {


 const [content, setContent] = useState("");
 const inputRef = useRef();

 const onChangeContent = (e) => {
     setContent(e.target.value);
 }
 
 const onSubmit = () => {
  if (content.trim() === "") {
    inputRef.current.focus();
    return;
  }
    onCreate(content);
     setContent("");
     inputRef.current.focus();
 }

 const onKeyDown = (e) => {
  if (e.key === "Enter") {
    onSubmit();
  }
}

  return(
    <div className='editmain'>
        <input type="text" placeholder="새로운 Todo..." value={content} onChange={onChangeContent} ref={inputRef} onKeyDown={onKeyDown}></input>
        <button onClick={onSubmit}>추가</button>
    </div>
  )
}

export default Editer
