import {
  Edit3,
  ExternalLink,
  Filter,
  Loader2,
  LockKeyhole,
  LogOut,
  Plus,
  RefreshCcw,
  Save,
  Search,
  Star,
  Tag,
  Trash2,
  X,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { createItem, deleteItem, fetchItems, updateItem } from './api'
import type { FormEvent } from 'react'
import type { ItemDraft, ItemFilters, SavedItem } from './types'
import {
  draftFromItem,
  emptyDraft,
  formatSource,
  inputFromDraft,
} from './utils'

const tokenKey = 'webarsiv.accessToken'
const defaultFilters: ItemFilters = {
  search: '',
  category: '',
  source: '',
  favoritesOnly: false,
}

function initialToken(): string {
  return (
    window.sessionStorage.getItem(tokenKey) ??
    window.localStorage.getItem(tokenKey) ??
    ''
  )
}

function App() {
  const [accessToken, setAccessToken] = useState(initialToken)
  const [tokenInput, setTokenInput] = useState('')
  const [rememberToken, setRememberToken] = useState(false)
  const [items, setItems] = useState<SavedItem[]>([])
  const [filters, setFilters] = useState<ItemFilters>(defaultFilters)
  const [categories, setCategories] = useState<string[]>([])
  const [sources, setSources] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<SavedItem | null>(null)
  const [draft, setDraft] = useState<ItemDraft>(emptyDraft)

  const loadItems = useCallback(async () => {
    if (!accessToken) {
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetchItems(accessToken, filters)
      setItems(response.items)
      setCategories(response.filters.categories)
      setSources(response.filters.sources)
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Kayıtlar alınamadı.',
      )
    } finally {
      setLoading(false)
    }
  }, [accessToken, filters])

  useEffect(() => {
    void loadItems()
  }, [loadItems])

  const favoriteCount = useMemo(
    () => items.filter((item) => item.is_favorite).length,
    [items],
  )

  function handleAccessSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const nextToken = tokenInput.trim()
    if (!nextToken) {
      setError('Erişim anahtarı gerekli.')
      return
    }

    window.sessionStorage.setItem(tokenKey, nextToken)
    if (rememberToken) {
      window.localStorage.setItem(tokenKey, nextToken)
    } else {
      window.localStorage.removeItem(tokenKey)
    }

    setAccessToken(nextToken)
    setTokenInput('')
    setError('')
  }

  function clearAccess() {
    window.sessionStorage.removeItem(tokenKey)
    window.localStorage.removeItem(tokenKey)
    setAccessToken('')
    setItems([])
    setFilters(defaultFilters)
  }

  function updateDraft(field: keyof ItemDraft, value: string) {
    setDraft((current) => ({ ...current, [field]: value }))
  }

  function openCreateForm() {
    setEditingItem(null)
    setDraft(emptyDraft())
    setFormOpen(true)
    setError('')
  }

  function openEditForm(item: SavedItem) {
    setEditingItem(item)
    setDraft(draftFromItem(item))
    setFormOpen(true)
    setError('')
  }

  function closeForm() {
    setFormOpen(false)
    setEditingItem(null)
    setDraft(emptyDraft())
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const payload = inputFromDraft(draft, {
      isFavorite: editingItem?.is_favorite,
    })
    if (!payload.title) {
      setError('Başlık gerekli.')
      return
    }

    setSaving(true)
    setError('')

    try {
      if (editingItem) {
        const response = await updateItem(accessToken, editingItem.id, payload)
        setItems((current) =>
          current.map((item) =>
            item.id === response.item.id ? response.item : item,
          ),
        )
      } else {
        const response = await createItem(accessToken, payload)
        setItems((current) => [response.item, ...current])
      }

      await loadItems()
      closeForm()
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : 'Kayıt kaydedilemedi.',
      )
    } finally {
      setSaving(false)
    }
  }

  async function handleFavorite(item: SavedItem) {
    setSaving(true)
    setError('')

    try {
      const response = await updateItem(accessToken, item.id, {
        is_favorite: !item.is_favorite,
      })
      setItems((current) =>
        current.map((currentItem) =>
          currentItem.id === response.item.id ? response.item : currentItem,
        ),
      )
    } catch (favoriteError) {
      setError(
        favoriteError instanceof Error
          ? favoriteError.message
          : 'Favori durumu değiştirilemedi.',
      )
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(item: SavedItem) {
    const confirmed = window.confirm(`"${item.title}" silinsin mi?`)
    if (!confirmed) {
      return
    }

    setSaving(true)
    setError('')

    try {
      await deleteItem(accessToken, item.id)
      setItems((current) =>
        current.filter((currentItem) => currentItem.id !== item.id),
      )
    } catch (deleteError) {
      setError(
        deleteError instanceof Error ? deleteError.message : 'Kayıt silinemedi.',
      )
    } finally {
      setSaving(false)
    }
  }

  if (!accessToken) {
    return (
      <main className="access-shell">
        <form className="access-panel" onSubmit={handleAccessSubmit}>
          <div className="brand-mark">
            <LockKeyhole size={24} aria-hidden="true" />
          </div>
          <h1>Webarşivi</h1>
          <label htmlFor="access-token">Kişisel erişim anahtarı</label>
          <input
            id="access-token"
            type="password"
            value={tokenInput}
            onChange={(event) => setTokenInput(event.target.value)}
            autoComplete="current-password"
          />
          <label className="check-row">
            <input
              type="checkbox"
              checked={rememberToken}
              onChange={(event) => setRememberToken(event.target.checked)}
            />
            Bu cihazda hatırla
          </label>
          {error && <p className="form-error">{error}</p>}
          <button className="primary-button" type="submit">
            <LockKeyhole size={18} aria-hidden="true" />
            Giriş
          </button>
        </form>
      </main>
    )
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <h1>Webarşivi</h1>
          <p>
            {items.length} kayıt · {favoriteCount} favori
          </p>
        </div>
        <div className="topbar-actions">
          <button
            className="icon-button"
            type="button"
            onClick={() => void loadItems()}
            aria-label="Yenile"
            title="Yenile"
          >
            <RefreshCcw size={18} aria-hidden="true" />
          </button>
          <button
            className="icon-button"
            type="button"
            onClick={clearAccess}
            aria-label="Çıkış"
            title="Çıkış"
          >
            <LogOut size={18} aria-hidden="true" />
          </button>
        </div>
      </header>

      <section className="toolbar" aria-label="Filtreler">
        <label className="search-box">
          <Search size={18} aria-hidden="true" />
          <input
            type="search"
            placeholder="Ara"
            value={filters.search}
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                search: event.target.value,
              }))
            }
          />
        </label>

        <label className="select-box">
          <Filter size={16} aria-hidden="true" />
          <select
            value={filters.category}
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                category: event.target.value,
              }))
            }
            aria-label="Kategori"
          >
            <option value="">Tüm kategoriler</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </label>

        <label className="select-box">
          <Filter size={16} aria-hidden="true" />
          <select
            value={filters.source}
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                source: event.target.value,
              }))
            }
            aria-label="Kaynak"
          >
            <option value="">Tüm kaynaklar</option>
            {sources.map((source) => (
              <option key={source} value={source}>
                {formatSource(source)}
              </option>
            ))}
          </select>
        </label>

        <label className="favorite-filter">
          <input
            type="checkbox"
            checked={filters.favoritesOnly}
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                favoritesOnly: event.target.checked,
              }))
            }
          />
          <Star size={17} aria-hidden="true" />
          Sadece favoriler
        </label>

        <button className="primary-button" type="button" onClick={openCreateForm}>
          <Plus size={18} aria-hidden="true" />
          Yeni kayıt
        </button>
      </section>

      {error && (
        <div className="status-message status-error" role="alert">
          {error}
        </div>
      )}

      {loading ? (
        <div className="status-message">
          <Loader2 className="spin" size={20} aria-hidden="true" />
          Yükleniyor
        </div>
      ) : items.length === 0 ? (
        <div className="empty-state">Sonuç yok</div>
      ) : (
        <section className="item-grid" aria-label="Kayıtlar">
          {items.map((item) => (
            <article className="item-card" key={item.id}>
              <div className="item-header">
                <div>
                  <span className="source-badge">{formatSource(item.source)}</span>
                  <h2>{item.title}</h2>
                </div>
                <button
                  className={
                    item.is_favorite
                      ? 'icon-button favorite-active'
                      : 'icon-button'
                  }
                  type="button"
                  onClick={() => void handleFavorite(item)}
                  disabled={saving}
                  aria-label={
                    item.is_favorite ? 'Favoriden çıkar' : 'Favoriye ekle'
                  }
                  title={item.is_favorite ? 'Favoriden çıkar' : 'Favoriye ekle'}
                >
                  <Star size={18} aria-hidden="true" />
                </button>
              </div>

              <p className="summary">{item.summary || item.original_text}</p>

              <div className="meta-row">
                <span>{item.category}</span>
                <span>{new Date(item.created_at).toLocaleDateString('tr-TR')}</span>
              </div>

              {item.tags.length > 0 && (
                <div className="tag-row">
                  {item.tags.map((tag) => (
                    <span className="tag-chip" key={tag}>
                      <Tag size={13} aria-hidden="true" />
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              <div className="item-actions">
                {item.url && (
                  <a
                    className="secondary-button"
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <ExternalLink size={16} aria-hidden="true" />
                    Aç
                  </a>
                )}
                <button
                  className="secondary-button"
                  type="button"
                  onClick={() => openEditForm(item)}
                >
                  <Edit3 size={16} aria-hidden="true" />
                  Düzenle
                </button>
                <button
                  className="danger-button"
                  type="button"
                  onClick={() => void handleDelete(item)}
                  disabled={saving}
                >
                  <Trash2 size={16} aria-hidden="true" />
                  Sil
                </button>
              </div>
            </article>
          ))}
        </section>
      )}

      {formOpen && (
        <div className="modal-backdrop" role="presentation">
          <form className="item-form" onSubmit={(event) => void handleSubmit(event)}>
            <div className="form-header">
              <h2>{editingItem ? 'Kaydı düzenle' : 'Yeni kayıt'}</h2>
              <button
                className="icon-button"
                type="button"
                onClick={closeForm}
                aria-label="Kapat"
                title="Kapat"
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>

            <label>
              Başlık
              <input
                value={draft.title}
                onChange={(event) => updateDraft('title', event.target.value)}
                required
              />
            </label>

            <label>
              Bağlantı
              <input
                value={draft.url}
                onChange={(event) => updateDraft('url', event.target.value)}
                type="url"
                placeholder="https://"
              />
            </label>

            <div className="form-columns">
              <label>
                Kategori
                <input
                  value={draft.category}
                  onChange={(event) =>
                    updateDraft('category', event.target.value)
                  }
                />
              </label>
              <label>
                Kaynak
                <select
                  value={draft.source}
                  onChange={(event) => updateDraft('source', event.target.value)}
                >
                  <option value="web">Web</option>
                  <option value="linkedin">LinkedIn</option>
                  <option value="x">X/Twitter</option>
                  <option value="instagram">Instagram</option>
                  <option value="other">Diğer</option>
                </select>
              </label>
            </div>

            <label>
              Özet
              <textarea
                value={draft.summary}
                onChange={(event) => updateDraft('summary', event.target.value)}
                rows={4}
              />
            </label>

            <label>
              Orijinal metin
              <textarea
                value={draft.original_text}
                onChange={(event) =>
                  updateDraft('original_text', event.target.value)
                }
                rows={5}
              />
            </label>

            <label>
              Kişisel not
              <textarea
                value={draft.personal_note}
                onChange={(event) =>
                  updateDraft('personal_note', event.target.value)
                }
                rows={3}
              />
            </label>

            <label>
              Etiketler
              <input
                value={draft.tags}
                onChange={(event) => updateDraft('tags', event.target.value)}
                placeholder="etiket, etiket"
              />
            </label>

            <div className="form-actions">
              <button className="secondary-button" type="button" onClick={closeForm}>
                Vazgeç
              </button>
              <button className="primary-button" type="submit" disabled={saving}>
                <Save size={18} aria-hidden="true" />
                Kaydet
              </button>
            </div>
          </form>
        </div>
      )}
    </main>
  )
}

export default App
