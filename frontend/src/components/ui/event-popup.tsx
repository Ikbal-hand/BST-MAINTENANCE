import { useEffect, useRef, type SyntheticEvent } from 'react'
import { AlertCircle, CheckCircle2, HelpCircle, LoaderCircle, X } from 'lucide-react'

export type EventPopupType = 'loading' | 'error' | 'success' | 'confirm'

export interface EventPopupProps {
  open: boolean
  type: EventPopupType
  title: string
  description?: string
  onClose?: () => void
  onConfirm?: () => void
  confirmLabel?: string
  confirmDisabled?: boolean
  cancelLabel?: string
  cancelDisabled?: boolean
  closeLabel?: string
  dismissible?: boolean
}

const popupMeta = {
  loading: { icon: LoaderCircle, className: 'is-loading', role: 'status' as const },
  error: { icon: AlertCircle, className: 'is-error', role: 'alertdialog' as const },
  success: { icon: CheckCircle2, className: 'is-success', role: 'dialog' as const },
  confirm: { icon: HelpCircle, className: 'is-confirm', role: 'alertdialog' as const },
}

export function EventPopup({
  open,
  type,
  title,
  description,
  onClose,
  onConfirm,
  confirmLabel = 'Lanjutkan',
  confirmDisabled = false,
  cancelLabel = 'Batal',
  cancelDisabled = false,
  closeLabel = 'Tutup',
  dismissible = type !== 'loading',
}: EventPopupProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const meta = popupMeta[type]
  const Icon = meta.icon
  const isConfirm = type === 'confirm'

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  function handleCancel(event: SyntheticEvent<HTMLDialogElement>) {
    event.preventDefault()
    if (dismissible) onClose?.()
  }

  return (
    <dialog
      ref={dialogRef}
      className={`event-popup ${meta.className}`}
      aria-labelledby="event-popup-title"
      aria-describedby={description ? 'event-popup-description' : undefined}
      aria-modal="true"
      onCancel={handleCancel}
      onClose={onClose}
    >
      <div className="event-popup-content">
        {dismissible && !isConfirm && (
          <button className="event-popup-close" type="button" onClick={onClose} aria-label={closeLabel}>
            <X size={18} />
          </button>
        )}
        <div className="event-popup-icon" aria-hidden="true">
          <Icon size={22} className={type === 'loading' ? 'event-popup-spinner' : undefined} />
        </div>
        <h2 id="event-popup-title">{title}</h2>
        {description && <p id="event-popup-description">{description}</p>}
        {isConfirm ? (
          <div className="event-popup-actions">
            <button className="event-popup-button is-secondary" type="button" onClick={onClose} disabled={cancelDisabled}>
              {cancelLabel}
            </button>
            <button className="event-popup-button is-primary" type="button" onClick={onConfirm} disabled={confirmDisabled}>
              {confirmLabel}
            </button>
          </div>
        ) : type !== 'loading' ? (
          <button className="event-popup-button is-primary event-popup-dismiss" type="button" onClick={onClose}>
            {closeLabel}
          </button>
        ) : null}
      </div>
    </dialog>
  )
}
