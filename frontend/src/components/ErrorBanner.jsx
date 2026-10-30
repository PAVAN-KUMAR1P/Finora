import { AlertIcon } from './icons.jsx'

export default function ErrorBanner({ message, onRetry }) {
  return (
    <div className="error error-banner" role="alert">
      <AlertIcon size={18} />
      <span className="error-text">{message}</span>
      {onRetry && <button className="btn ghost sm" onClick={onRetry}>Retry</button>}
    </div>
  )
}
