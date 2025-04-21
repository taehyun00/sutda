
function Header() {
  return(
    <div className="Headermain">
        <h3 className="Headerh3">
            오늘은 📆
        </h3>
        <h1 className="Headerh1">
            {new Date().toDateString()}
        </h1>
    </div>
  )
}

export default Header

