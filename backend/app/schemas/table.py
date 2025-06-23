from pydantic import BaseModel
from typing import List, Any, Optional

class ColumnInfo(BaseModel):
    name: str
    type: str
    nullable: bool
    primary_key: bool = False

class TableInfo(BaseModel):
    name: str
    columns: List[ColumnInfo]

class TableData(BaseModel):
    columns: List[str]
    rows: List[List[Any]]
    total_count: int

class DataFilter(BaseModel):
    column: str
    operator: str  # eq, ne, gt, lt, like, etc.
    value: Any