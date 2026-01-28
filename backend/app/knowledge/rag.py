import numpy as np
from qdrant_client import QdrantClient
from qdrant_client.http import models

class KnowledgeManager:
    def __init__(self, url="http://localhost:6333"):
        self.client = QdrantClient(url="http://localhost:6333")
        self.base_collection = "plugin_base"
        self._ensure_collection(self.base_collection)

    def _ensure_collection(self, name: str):
        try:
            self.client.get_collection(name)
        except Exception:
            self.client.create_collection(
                collection_name=name,
                vectors_config=models.VectorParams(size=384, distance=models.Distance.COSINE),
            )

    def _get_user_collection(self, user_id: str):
        name = f"user_{user_id}"
        self._ensure_collection(name)
        return name

    def _mock_embedding(self, text: str):
        # Placeholder for actual embedding logic (e.g. SentenceTransformers)
        return np.random.rand(384).tolist()

    async def search(self, query: str, user_id: str):
        user_col = self._get_user_collection(user_id)
        vector = self._mock_embedding(query)
        
        # Search in base knowledge
        base_results = self.client.query_points(
            collection_name=self.base_collection,
            query=vector,
            limit=2
        ).points
        
        # Search in user-specific knowledge
        user_results = self.client.query_points(
            collection_name=user_col,
            query=vector,
            limit=3
        ).points
        
        results = []
        for res in base_results:
            results.append({"title": "Base Knowledge", "content": res.payload.get("content", ""), "source": "plugin"})
        for res in user_results:
            results.append({"title": "User Context", "content": res.payload.get("content", ""), "source": "user"})
            
        return results

    async def add_knowledge(self, content: str, user_id: str, metadata: dict = None):
        user_col = self._get_user_collection(user_id)
        vector = self._mock_embedding(content)
        
        self.client.upsert(
            collection_name=user_col,
            points=[
                models.PointStruct(
                    id=np.random.randint(0, 1000000),
                    vector=vector,
                    payload={"content": content, **(metadata or {})}
                )
            ]
        )

    async def seed_base_knowledge(self):
        docs = [
            {"content": "Storm Engine uses LangGraph for stateful orchestration.", "category": "architecture"},
            {"content": "Agents communicate via a shared state object.", "category": "core"},
            {"content": "The Secretary agent is responsible for ZIP export generation.", "category": "agents"}
        ]
        for doc in docs:
            vector = self._mock_embedding(doc["content"])
            self.client.upsert(
                collection_name=self.base_collection,
                points=[
                    models.PointStruct(
                        id=np.random.randint(0, 1000000),
                        vector=vector,
                        payload=doc
                    )
                ]
            )

knowledge_manager = KnowledgeManager()

import asyncio
asyncio.run(knowledge_manager.seed_base_knowledge())
