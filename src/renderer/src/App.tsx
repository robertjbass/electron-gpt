import { useState, useEffect } from 'react'

const App = (): JSX.Element => {
  const [dockerVersion, setDockerVersion] = useState<string>('')
  const [error, setError] = useState<string>('')
  const [dockerRunning, setDockerRunning] = useState<boolean>(false)

  const checkDocker = async () => {
    console.log('check docker installed')
    const { docker, error } = await window.api.checkDocker()
    setDockerVersion(docker)
    setError(error)
    return { docker, error }
  }

  const checkDockerRunning = async () => {
    console.log('check docker running')
    const { error, running } = await window.api.checkDockerIsRunning()
    setDockerRunning(running)
    setError(error)
    return { error, running }
  }

  const startDocker = async () => {
    console.log('starting docker')
    const { error, running } = await window.api.startDocker()
    await checkDockerRunning()
    return { error, running }
  }

  useEffect(() => {
    checkDocker()
    checkDockerRunning()
    startDocker()
  }, [])

  return (
    <>
      {error && <div className="text-xl">{error}</div>}
      {dockerVersion && <div className="text-xl">{dockerVersion}</div>}
      {dockerVersion && <div className="text-xl">{dockerRunning ? 'running' : 'not running'}</div>}
    </>
  )
}

export default App
