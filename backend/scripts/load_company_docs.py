#!/usr/bin/env python3
"""
Load company documents script.

This script chunks text files, generates embeddings, and inserts them into the
company_memory_chunks table for RAG functionality.

Usage:
    python scripts/load_company_docs.py <file_path> [--title "Document Title"] [--source "source_id"] [--chunk-size 500]

Example:
    python scripts/load_company_docs.py docs/company_handbook.txt --title "Company Handbook" --source "handbook_v2"
"""
import argparse
import asyncio
import logging
import sys
from pathlib import Path
from typing import List, Dict, Any
from uuid import uuid4

# Add backend to path
sys.path.append(str(Path(__file__).parent.parent))

from app.core.config import get_settings
from app.db.database import get_db_session
from app.db.models import CompanyMemoryChunk
from app.llm.ollamaClient import get_ollama_client

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

settings = get_settings()


def chunk_text(text: str, chunk_size: int = 500, overlap: int = 50) -> List[str]:
    """
    Split text into overlapping chunks for better context retention.
    
    Args:
        text: Input text to chunk
        chunk_size: Target size of each chunk in characters
        overlap: Number of characters to overlap between chunks
        
    Returns:
        List of text chunks
    """
    if len(text) <= chunk_size:
        return [text]
    
    chunks = []
    start = 0
    
    while start < len(text):
        end = start + chunk_size
        
        # If we're not at the end, try to break at a sentence or word boundary
        if end < len(text):
            # Look for sentence endings within the last 100 characters
            for i in range(end, max(end - 100, start), -1):
                if text[i] in '.!?':
                    end = i + 1
                    break
            else:
                # No sentence boundary found, look for word boundary
                for i in range(end, max(end - 50, start), -1):
                    if text[i].isspace():
                        end = i
                        break
        
        chunk = text[start:end].strip()
        if chunk:
            chunks.append(chunk)
        
        # Move start position with overlap
        start = end - overlap
        if start >= len(text):
            break
    
    return chunks


async def load_document(
    file_path: str,
    title: str,
    source: str,
    source_type: str = "document",
    chunk_size: int = 500,
    metadata: Dict[str, Any] = None
) -> int:
    """
    Load a document into the company memory chunks table.
    
    Args:
        file_path: Path to the text file
        title: Document title
        source: Source identifier for citations
        source_type: Type of source (document, policy, faq, etc.)
        chunk_size: Size of text chunks
        metadata: Additional metadata
        
    Returns:
        Number of chunks created
    """
    # Read the file
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
    except Exception as e:
        logger.error(f"Failed to read file {file_path}: {e}")
        return 0
    
    if not content.strip():
        logger.warning(f"File {file_path} is empty")
        return 0
    
    # Chunk the text
    chunks = chunk_text(content, chunk_size)
    logger.info(f"Created {len(chunks)} chunks from {file_path}")
    
    # Get Ollama client for embeddings
    ollama_client = get_ollama_client()
    
    # Process chunks in batches to avoid overwhelming the system
    batch_size = 10
    total_inserted = 0
    
    for i in range(0, len(chunks), batch_size):
        batch_chunks = chunks[i:i + batch_size]
        logger.info(f"Processing batch {i//batch_size + 1}/{(len(chunks) + batch_size - 1)//batch_size}")
        
        try:
            # Generate embeddings for the batch
            embed_response = await ollama_client.embed(settings.EMBED_MODEL, batch_chunks)
            
            if 'embeddings' not in embed_response:
                logger.error(f"Failed to get embeddings for batch starting at {i}")
                continue
                
            embeddings = embed_response['embeddings']
            
            if len(embeddings) != len(batch_chunks):
                logger.warning(f"Embedding count mismatch: {len(embeddings)} vs {len(batch_chunks)}")
                continue
            
            # Insert chunks into database
            async with get_db_session() as session:
                for j, (chunk_text, embedding) in enumerate(zip(batch_chunks, embeddings)):
                    chunk_metadata = metadata.copy() if metadata else {}
                    chunk_metadata.update({
                        "file_path": file_path,
                        "chunk_size": len(chunk_text),
                        "batch_index": i + j
                    })
                    
                    memory_chunk = CompanyMemoryChunk(
                        id=uuid4(),
                        title=f"{title} (Chunk {i + j + 1})",
                        source=source,
                        source_type=source_type,
                        text=chunk_text,
                        embedding=embedding,
                        chunk_index=i + j,
                        meta_data=str(chunk_metadata) if chunk_metadata else None
                    )
                    
                    session.add(memory_chunk)
                
                await session.commit()
                total_inserted += len(batch_chunks)
                logger.info(f"Inserted {len(batch_chunks)} chunks")
        
        except Exception as e:
            logger.error(f"Failed to process batch starting at {i}: {e}")
            continue
    
    logger.info(f"Successfully loaded {total_inserted} chunks from {file_path}")
    return total_inserted


async def main():
    """Main function to parse arguments and load documents."""
    parser = argparse.ArgumentParser(description="Load company documents for RAG")
    parser.add_argument("file_path", help="Path to the text file to load")
    parser.add_argument("--title", required=True, help="Document title")
    parser.add_argument("--source", required=True, help="Source identifier for citations")
    parser.add_argument("--source-type", default="document", 
                       choices=["document", "policy", "faq", "manual", "guide"],
                       help="Type of source document")
    parser.add_argument("--chunk-size", type=int, default=500, 
                       help="Size of text chunks (default: 500)")
    parser.add_argument("--metadata", help="Additional metadata as JSON string")
    
    args = parser.parse_args()
    
    # Validate file path
    file_path = Path(args.file_path)
    if not file_path.exists():
        logger.error(f"File not found: {file_path}")
        sys.exit(1)
    
    if not file_path.is_file():
        logger.error(f"Path is not a file: {file_path}")
        sys.exit(1)
    
    # Parse metadata if provided
    metadata = {}
    if args.metadata:
        try:
            import json
            metadata = json.loads(args.metadata)
        except json.JSONDecodeError as e:
            logger.error(f"Invalid metadata JSON: {e}")
            sys.exit(1)
    
    # Load the document
    try:
        chunk_count = await load_document(
            file_path=str(file_path),
            title=args.title,
            source=args.source,
            source_type=args.source_type,
            chunk_size=args.chunk_size,
            metadata=metadata
        )
        
        if chunk_count > 0:
            logger.info(f"✅ Successfully loaded document with {chunk_count} chunks")
            print(f"Document loaded successfully: {chunk_count} chunks created")
        else:
            logger.error("❌ Failed to load document")
            sys.exit(1)
            
    except Exception as e:
        logger.error(f"❌ Error loading document: {e}")
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())