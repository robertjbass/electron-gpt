import { useEffect } from 'react'

const App = (): JSX.Element => {
  useEffect(() => {
    ;(async () => {
      // @ts-ignore
      const value = await window.api.prompt()
      console.log(value)
    })()
  }, [])
  return <div className="text-xl">Hello World</div>
}

export default App
