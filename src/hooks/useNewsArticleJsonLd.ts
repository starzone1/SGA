import { useEffect } from 'react';
import { Article } from '../types';
import { getNewsArticleJsonLd, updateJsonLd } from '../utils/seo';

/**
 * Custom React Hook that dynamically injects and updates Google Search Central
 * compliant Schema.org 'NewsArticle' JSON-LD structured data into document.head
 * when an article is viewed.
 *
 * @param article The Article object being viewed, or null
 */
export function useNewsArticleJsonLd(article: Article | null | undefined): void {
  useEffect(() => {
    if (!article) return;

    try {
      // Generate Google-compliant NewsArticle JSON-LD structured data object
      const newsArticleSchema = getNewsArticleJsonLd(article);

      // Inject or update <script id="sga-jsonld-schema" type="application/ld+json"> in document.head
      updateJsonLd(newsArticleSchema);
    } catch (error) {
      console.error('Error injecting NewsArticle JSON-LD structured data:', error);
    }
  }, [
    article?.id,
    article?.title,
    article?.content,
    article?.excerpt,
    article?.category,
    article?.authorName,
    article?.authorRole,
    article?.coverImage,
    article?.publishedAt,
    article?.createdAt,
    article?.updatedAt,
    article?.slug
  ]);
}

export default useNewsArticleJsonLd;
