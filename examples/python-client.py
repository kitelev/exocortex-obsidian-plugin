#!/usr/bin/env python3
"""
Exocortex REST API Client for Python
Example client for AI agents to interact with Exocortex Obsidian plugin
"""

import json
import time
import requests
from typing import Dict, List, Any, Optional


class ExocortexClient:
    """Client for interacting with Exocortex REST API"""
    
    def __init__(self, host: str = "localhost", port: int = 27124, api_key: str = None):
        """
        Initialize the Exocortex client
        
        Args:
            host: API server host
            port: API server port
            api_key: API authentication key
        """
        self.base_url = f"http://{host}:{port}/api"
        self.api_key = api_key
        self.headers = {
            "X-API-Key": api_key,
            "Content-Type": "application/json"
        }
    
    def health_check(self) -> Dict[str, Any]:
        """Check API health status"""
        response = requests.get(f"{self.base_url}/health", headers=self.headers)
        response.raise_for_status()
        return response.json()
    
    def sparql_query(self, query: str) -> Dict[str, Any]:
        """
        Execute a SPARQL query
        
        Args:
            query: SPARQL query string
            
        Returns:
            Query results
        """
        payload = {"query": query}
        response = requests.post(f"{self.base_url}/sparql", 
                                 json=payload, 
                                 headers=self.headers)
        response.raise_for_status()
        return response.json()
    
    def nlp_query(self, query: str) -> Dict[str, Any]:
        """
        Execute a natural language query
        
        Args:
            query: Natural language question
            
        Returns:
            Query results
        """
        payload = {"q": query}
        response = requests.post(f"{self.base_url}/nlp", 
                                 json=payload, 
                                 headers=self.headers)
        response.raise_for_status()
        return response.json()
    
    def search_assets(self, keyword: str = None, asset_class: str = None, 
                     limit: int = 20) -> Dict[str, Any]:
        """
        Search for assets in the knowledge base
        
        Args:
            keyword: Search keyword
            asset_class: Filter by asset class
            limit: Maximum results
            
        Returns:
            List of matching assets
        """
        params = {}
        if keyword:
            params["q"] = keyword
        if asset_class:
            params["class"] = asset_class
        params["limit"] = limit
        
        response = requests.get(f"{self.base_url}/assets", 
                               params=params, 
                               headers=self.headers)
        response.raise_for_status()
        return response.json()
    
    def create_asset(self, name: str, asset_class: str, 
                    properties: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Create a new asset
        
        Args:
            name: Asset name
            asset_class: Asset class
            properties: Additional properties
            
        Returns:
            Created asset information
        """
        payload = {
            "name": name,
            "class": asset_class,
            "properties": properties or {}
        }
        response = requests.post(f"{self.base_url}/assets/create", 
                                json=payload, 
                                headers=self.headers)
        response.raise_for_status()
        return response.json()
    
    def get_graph_triples(self, subject: str = None, predicate: str = None, 
                         object: str = None, limit: int = 100) -> Dict[str, Any]:
        """
        Get RDF triples from the graph
        
        Args:
            subject: Filter by subject
            predicate: Filter by predicate
            object: Filter by object
            limit: Maximum results
            
        Returns:
            Matching triples
        """
        params = {"limit": limit}
        if subject:
            params["s"] = subject
        if predicate:
            params["p"] = predicate
        if object:
            params["o"] = object
        
        response = requests.get(f"{self.base_url}/graph", 
                               params=params, 
                               headers=self.headers)
        response.raise_for_status()
        return response.json()
    
    def add_triple(self, subject: str, predicate: str, object: str) -> Dict[str, Any]:
        """
        Add a triple to the graph
        
        Args:
            subject: Triple subject
            predicate: Triple predicate
            object: Triple object
            
        Returns:
            Success status
        """
        payload = {
            "operation": "add",
            "subject": subject,
            "predicate": predicate,
            "object": object
        }
        response = requests.post(f"{self.base_url}/graph", 
                                json=payload, 
                                headers=self.headers)
        response.raise_for_status()
        return response.json()
    
    def ontologize_relations(self, asset_path: str) -> Dict[str, Any]:
        """
        Ontologize relations for an asset
        
        Args:
            asset_path: Path to asset file
            
        Returns:
            Created relations
        """
        payload = {"assetPath": asset_path}
        response = requests.post(f"{self.base_url}/relations/ontologize", 
                                json=payload, 
                                headers=self.headers)
        response.raise_for_status()
        return response.json()
    
    def set_focus(self, context: str, filters: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Set ExoFocus context
        
        Args:
            context: Context name
            filters: Context filters
            
        Returns:
            Focus configuration
        """
        payload = {
            "context": context,
            "filters": filters or {}
        }
        response = requests.post(f"{self.base_url}/focus", 
                                json=payload, 
                                headers=self.headers)
        response.raise_for_status()
        return response.json()
    
    def get_focus(self) -> Dict[str, Any]:
        """Get current ExoFocus context"""
        response = requests.get(f"{self.base_url}/focus", headers=self.headers)
        response.raise_for_status()
        return response.json()
    
    def search_vault(self, query: str) -> Dict[str, Any]:
        """
        Search vault content
        
        Args:
            query: Search query
            
        Returns:
            Search results
        """
        params = {"q": query}
        response = requests.get(f"{self.base_url}/vault/search", 
                               params=params, 
                               headers=self.headers)
        response.raise_for_status()
        return response.json()
    
    def list_vault_files(self) -> Dict[str, Any]:
        """List all vault files"""
        response = requests.get(f"{self.base_url}/vault/files", headers=self.headers)
        response.raise_for_status()
        return response.json()


def main():
    """Example usage of the Exocortex client"""
    
    # Initialize client with your API key
    client = ExocortexClient(api_key="your-api-key-here")
    
    # Check health
    print("Health check:")
    health = client.health_check()
    print(json.dumps(health, indent=2))
    
    # Example: Search for tasks
    print("\nSearching for tasks:")
    tasks_query = """
    SELECT ?task ?label WHERE {
        ?task a ems__Task .
        ?task exo__Asset_label ?label
    } LIMIT 10
    """
    results = client.sparql_query(tasks_query)
    print(f"Found {results['count']} tasks")
    
    # Example: Natural language query
    print("\nNatural language query:")
    nlp_result = client.nlp_query("What are my tasks for today?")
    print(json.dumps(nlp_result, indent=2))
    
    # Example: Search assets
    print("\nSearching assets:")
    assets = client.search_assets(keyword="project", limit=5)
    print(f"Found {assets['count']} assets")
    
    # Example: Create new asset
    print("\nCreating new asset:")
    new_asset = client.create_asset(
        name="Test Task",
        asset_class="ems__Task",
        properties={
            "ems__Task_status": "pending",
            "ems__Task_priority": "high"
        }
    )
    print(f"Created asset: {new_asset['uid']}")


if __name__ == "__main__":
    main()