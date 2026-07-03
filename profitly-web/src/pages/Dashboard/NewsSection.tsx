import { useState, useEffect } from 'react'
import { api } from '../../lib/api'
import './NewsSection.css'

interface NewsItem {
  id: string
  title: string
  description: string | null
  url: string
  source: string | null
  imageUrl: string | null
  publishedAt: string | null
}

function timeAgo(iso: string | null): string {
  if (!iso) return ''
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (diff < 60) return 'agora'
  if (diff < 3600) return `${Math.floor(diff / 60)}min atrás`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h atrás`
  return `${Math.floor(diff / 86400)}d atrás`
}

export function NewsSection() {
  const [news, setNews] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get<NewsItem[]>('/api/news?limit=9')
      .then(r => setNews(r.data))
      .catch(() => setNews([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <section className="news-section">
      <div className="news-header">
        <span className="news-header-icon">📰</span>
        <h2 className="news-title">Notícias do Mercado</h2>
      </div>

      {loading ? (
        <div className="news-empty">Carregando notícias...</div>
      ) : news.length === 0 ? (
        <div className="news-empty">Nenhuma notícia disponível no momento.</div>
      ) : (
        <div className="news-grid">
          {news.map(item => (
            <a
              key={item.id}
              className="news-card"
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              {item.imageUrl && (
                <div className="news-card-img-wrap">
                  <img
                    className="news-card-img"
                    src={item.imageUrl}
                    alt=""
                    loading="lazy"
                    onError={e => {
                      e.currentTarget.parentElement!.style.display = 'none'
                    }}
                  />
                </div>
              )}
              <div className="news-card-body">
                <div className="news-card-meta">
                  {item.source && <span className="news-card-source">{item.source}</span>}
                  <span className="news-card-time">{timeAgo(item.publishedAt)}</span>
                </div>
                <p className="news-card-title">{item.title}</p>
                {item.description && (
                  <p className="news-card-desc">{item.description}</p>
                )}
              </div>
            </a>
          ))}
        </div>
      )}
    </section>
  )
}
