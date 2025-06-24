"""
Tests for table management endpoints.
"""

import pytest
from httpx import AsyncClient


class TestTableEndpoints:
    """Test table management API endpoints."""

    async def test_get_tables_list(self, client: AsyncClient, user_headers: dict):
        """Test getting list of tables."""
        response = await client.get("/tables/", headers=user_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        # Should contain our test tables
        assert "products" in data

    async def test_get_tables_unauthorized(self, client: AsyncClient):
        """Test getting tables without authorization."""
        response = await client.get("/tables/")
        
        assert response.status_code == 401

    async def test_get_table_schema(self, client: AsyncClient, user_headers: dict):
        """Test getting table schema."""
        response = await client.get("/tables/products/schema", headers=user_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "products"
        assert "columns" in data
        assert len(data["columns"]) > 0
        
        # Check for expected columns
        column_names = [col["name"] for col in data["columns"]]
        assert "id" in column_names
        assert "name" in column_names
        assert "price" in column_names
        assert "category" in column_names

    async def test_get_nonexistent_table_schema(self, client: AsyncClient, user_headers: dict):
        """Test getting schema for non-existent table."""
        response = await client.get("/tables/nonexistent/schema", headers=user_headers)
        
        assert response.status_code == 404

    async def test_get_table_data(self, client: AsyncClient, user_headers: dict):
        """Test getting table data."""
        response = await client.get("/tables/products/data", headers=user_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert "columns" in data
        assert "rows" in data
        assert "total_count" in data
        assert data["total_count"] >= 3  # We inserted 3 test records

    async def test_get_table_data_with_pagination(self, client: AsyncClient, user_headers: dict):
        """Test getting table data with pagination."""
        response = await client.get(
            "/tables/products/data?limit=2&offset=1", 
            headers=user_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert len(data["rows"]) <= 2

    async def test_get_table_queries(self, client: AsyncClient, user_headers: dict):
        """Test getting predefined queries for a table."""
        response = await client.get("/tables/products/queries", headers=user_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["table_name"] == "products"
        assert "queries" in data
        assert isinstance(data["queries"], list)

    async def test_execute_table_query(self, client: AsyncClient, user_headers: dict):
        """Test executing a predefined query."""
        # First get available queries
        queries_response = await client.get("/tables/products/queries", headers=user_headers)
        queries_data = queries_response.json()
        
        if queries_data["queries"]:
            query_id = queries_data["queries"][0]["id"]
            
            response = await client.post(
                "/tables/products/query",
                headers=user_headers,
                json={
                    "query_id": query_id,
                    "parameters": {}
                }
            )
            
            assert response.status_code == 200
            data = response.json()
            assert data["query_id"] == query_id
            assert "columns" in data
            assert "rows" in data
            assert "row_count" in data

    async def test_execute_invalid_query(self, client: AsyncClient, user_headers: dict):
        """Test executing an invalid query."""
        response = await client.post(
            "/tables/products/query",
            headers=user_headers,
            json={
                "query_id": "nonexistent_query",
                "parameters": {}
            }
        )
        
        assert response.status_code == 400


class TestQueryService:
    """Test query service functionality."""

    def test_load_queries_from_file(self):
        """Test loading predefined queries from JSON file."""
        from app.services.query_service import query_service
        
        queries = query_service.get_queries_for_table("products")
        assert isinstance(queries, list)
        
        # Should have some predefined queries for products
        if queries:
            query = queries[0]
            assert hasattr(query, 'id')
            assert hasattr(query, 'name')
            assert hasattr(query, 'description')
            assert hasattr(query, 'sql')

    def test_query_parameter_validation(self):
        """Test query parameter validation."""
        from app.services.query_service import query_service
        from app.schemas.query import QueryParameter, ParameterType
        
        # Test integer parameter validation
        int_param = QueryParameter(
            name="limit",
            type=ParameterType.INTEGER,
            description="Limit",
            min=1,
            max=100
        )
        
        # Valid value
        errors = query_service.validate_parameters(
            type('Query', (), {'parameters': [int_param]})(),
            {"limit": 50}
        )
        assert len(errors) == 0
        
        # Invalid value (too high)
        errors = query_service.validate_parameters(
            type('Query', (), {'parameters': [int_param]})(),
            {"limit": 150}
        )
        assert len(errors) > 0
        assert "limit" in errors