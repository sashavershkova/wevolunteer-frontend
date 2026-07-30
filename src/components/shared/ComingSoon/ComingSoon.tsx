import './ComingSoon.css'

type ComingSoonProps = {
  title: string
  description: string
}

function ComingSoon({ title, description }: ComingSoonProps) {
  return (
    <main className="coming-soon-page">
      <h1>{title}</h1>
      <p>{description}</p>
    </main>
  )
}

export default ComingSoon
