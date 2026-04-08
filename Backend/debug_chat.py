"""Quick debug script to trace [Errno 22] in chat."""
import asyncio
import traceback
import sys

# Ensure we use the same path
sys.path.insert(0, ".")

from config import settings
from services.rag_service_runtime import rag

async def test_chat():
    query = "boyfriend forcing the girlfriend to send inappropriate pictures"
    
    print(f"[debug] Python: {sys.version}")
    print(f"[debug] Event loop: {type(asyncio.get_running_loop()).__name__}")
    print(f"[debug] GROQ_MODEL: {settings.GROQ_MODEL}")
    print(f"[debug] GROQ_API_KEY set: {bool(settings.GROQ_API_KEY)}")
    print()
    
    # Step 1: Test greeting guard
    from services.rag_service import _should_skip_rag
    print(f"[debug] Should skip RAG: {_should_skip_rag(query)}")
    
    # Step 2: Test initialization
    print("[debug] Initializing RAG...")
    try:
        rag.initialize()
        print("[debug] RAG initialized OK")
    except Exception as e:
        print(f"[debug] RAG init failed: {e}")
        traceback.print_exc()
        return
    
    # Step 3: Test vector search
    print("[debug] Testing vector search...")
    try:
        results = rag._vectorstore.similarity_search_with_score(query, k=settings.RAG_TOP_K)
        print(f"[debug] Vector search OK, got {len(results)} results")
        for doc, score in results:
            print(f"  - {doc.metadata.get('source', '?')}: score={score:.4f}")
    except Exception as e:
        print(f"[debug] Vector search FAILED: {e}")
        traceback.print_exc()
        return
    
    # Step 4: Test Groq client creation
    print("[debug] Creating Groq client...")
    try:
        from utils.llm import get_groq_client
        client = get_groq_client()
        print(f"[debug] Groq client OK: {type(client).__name__}")
    except Exception as e:
        print(f"[debug] Groq client FAILED: {e}")
        traceback.print_exc()
        return
    
    # Step 5: Test Groq API call
    print("[debug] Testing Groq API call...")
    try:
        from utils.prompts import CHAT_SYSTEM, CHAT_USER
        from utils.llm import JSON_OBJECT_RESPONSE_FORMAT
        
        context_parts = []
        sources = []
        for doc, score in results:
            src = doc.metadata.get("source", "unknown")
            context_parts.append(f"[Source: {src}]\n{doc.page_content}")
            if src not in sources:
                sources.append(src)
        
        context = "\n\n---\n\n".join(context_parts) if context_parts else "No relevant context found."
        prompt = CHAT_USER.format(query=query, context=context)
        
        print(f"[debug] System prompt length: {len(CHAT_SYSTEM)}")
        print(f"[debug] User prompt length: {len(prompt)}")
        
        response = await client.chat.completions.create(
            model=settings.GROQ_MODEL,
            messages=[
                {"role": "system", "content": CHAT_SYSTEM},
                {"role": "user", "content": prompt},
            ],
            temperature=0.2,
            max_completion_tokens=2000,
            response_format=JSON_OBJECT_RESPONSE_FORMAT,
        )
        
        from utils.llm import extract_response_content
        raw = extract_response_content(response)
        print(f"[debug] Groq API call OK!")
        print(f"[debug] Response preview: {raw[:200]}")
    except Exception as e:
        print(f"[debug] Groq API call FAILED: {type(e).__name__}: {e}")
        traceback.print_exc()
    
    # Step 6: Test the full chat method
    print("\n[debug] Testing full rag.chat()...")
    try:
        result = await rag.chat(query)
        print(f"[debug] Full chat OK!")
        print(f"[debug] Answer preview: {result.get('answer', '')[:200]}")
    except Exception as e:
        print(f"[debug] Full chat FAILED: {type(e).__name__}: {e}")
        traceback.print_exc()


if __name__ == "__main__":
    asyncio.run(test_chat())
