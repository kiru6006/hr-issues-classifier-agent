import math
import re
import hashlib
from typing import List, Dict

class EmbeddingService:
    """Generates 384-dimensional normalized embeddings for semantic similarity and clustering."""

    def __init__(self, dimension: int = 384):
        self.dim = dimension

    def generate_embedding(self, text: str) -> List[float]:
        """Produce a normalized 384-dim semantic feature vector based on hashed n-grams and vocabulary."""
        text_clean = re.sub(r'[^\w\s]', ' ', text.lower()).strip()
        tokens = text_clean.split()
        
        vector = [0.0] * self.dim

        if not tokens:
            return vector

        # Token + bigram semantic hashing with positional weighing
        for i, token in enumerate(tokens):
            weight = 1.0 / (1.0 + 0.05 * math.log(i + 1))
            h = int(hashlib.sha256(token.encode('utf-8')).hexdigest(), 16)
            idx = h % self.dim
            vector[idx] += weight

            # Bigram feature
            if i < len(tokens) - 1:
                bigram = f"{token}_{tokens[i+1]}"
                h_bi = int(hashlib.md5(bigram.encode('utf-8')).hexdigest(), 16)
                idx_bi = h_bi % self.dim
                vector[idx_bi] += (weight * 1.5)

        # L2 normalize
        norm = math.sqrt(sum(v * v for v in vector))
        if norm > 0:
            vector = [round(v / norm, 6) for v in vector]

        return vector

    @staticmethod
    def cosine_similarity(vec1: List[float], vec2: List[float]) -> float:
        """Compute cosine similarity between two vectors."""
        if len(vec1) != len(vec2) or not vec1:
            return 0.0
        
        dot = sum(a * b for a, b in zip(vec1, vec2))
        norm1 = math.sqrt(sum(a * a for a in vec1))
        norm2 = math.sqrt(sum(b * b for b in vec2))

        if norm1 == 0 or norm2 == 0:
            return 0.0

        return max(0.0, min(1.0, dot / (norm1 * norm2)))

embedding_service = EmbeddingService()
