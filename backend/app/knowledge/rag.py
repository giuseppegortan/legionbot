import numpy as np
from qdrant_client import QdrantClient
from qdrant_client.http import models

from backend.app.core.config import settings

class KnowledgeManager:
    def __init__(self, url=None):
        self.url = url or settings.QDRANT_URL
        self.client = QdrantClient(url=self.url)
        self.base_collection = "plugin_base"
        # We'll defer _ensure_collection until first use or app startup if possible
        # but for now, let's just make it safer by catching connection errors in a separate method

    def _ensure_collection(self, name: str):
        try:
            self.client.get_collection(name)
        except Exception:
            try:
                self.client.create_collection(
                    collection_name=name,
                    vectors_config=models.VectorParams(size=384, distance=models.Distance.COSINE),
                )
            except Exception as e:
                print(f"❌ Could not create Qdrant collection {name}: {e}")

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
        
        try:
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
        except Exception as e:
            print(f"⚠️ Search failed: {e}")
            return []

    async def add_knowledge(self, content: str, user_id: str, metadata: dict = None):
        user_col = self._get_user_collection(user_id)
        vector = self._mock_embedding(content)
        
        try:
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
        except Exception as e:
            print(f"❌ Failed to add knowledge: {e}")

    async def seed_base_knowledge(self):
        self._ensure_collection(self.base_collection)
        docs = [
            {"content": "Storm Engine uses LangGraph for stateful orchestration.", "category": "architecture"},
            {"content": "Agents communicate via a shared state object.", "category": "core"},
            {"content": "The Secretary agent is responsible for ZIP export generation.", "category": "agents"}
        ]
        for doc in docs:
            vector = self._mock_embedding(doc["content"])
            try:
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
            except Exception as e:
                print(f"❌ Failed to seed: {e}")

knowledge_manager = KnowledgeManager()
# REMOVED TOP LEVEL asyncio.run(knowledge_manager.seed_base_knowledge())
