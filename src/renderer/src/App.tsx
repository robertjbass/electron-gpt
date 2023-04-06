import { useState, useEffect } from 'react'

const App = (): JSX.Element => {
  const [dockerVersion, setDockerVersion] = useState<string>('')
  const [error, setError] = useState<string>('')
  const [dockerRunning, setDockerRunning] = useState<boolean>(false)

  const checkDocker = async () => {
    console.log('check docker installed')
    const { docker, error } = await window.api.checkDocker()
    return { docker, error }
  }

  const checkDockerRunning = async () => {
    console.log('check docker running')
    const { error, running } = await window.api.checkDockerIsRunning()
    setDockerRunning(running)
    setError(error)
    return { error, running }
  }

  useEffect(() => {
    checkDocker()
      .then(({ docker, error }) => {
        if (error) {
          setError(error)
        } else {
          setDockerVersion(docker)
          checkDockerRunning()
            .then(({ error, running }) => {
              if (error) {
                setError(error)
              } else {
                setDockerRunning(running)
              }
            })
            .catch((err) => console.error(err))
        }
      })
      .catch((err) => console.error(err))
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
