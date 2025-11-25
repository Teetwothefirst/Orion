import { useState } from 'react'
import { Button } from "@/components/ui/button"
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
    <div className="">
       <Button >Click me to download the App</Button>
    </div>
     
    </>
  )
}

export default App
