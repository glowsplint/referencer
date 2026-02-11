from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, Field


class ArrowEndpointModel(BaseModel):
    model_config = {"populate_by_name": True}

    editorIndex: int
    from_: int = Field(alias="from")
    to: int
    text: str

    def model_dump(self, **kwargs):
        d = super().model_dump(**kwargs)
        d["from"] = d.pop("from_")
        return d


class HighlightModel(BaseModel):
    model_config = {"populate_by_name": True}

    id: str
    editorIndex: int
    from_: int = Field(alias="from")
    to: int
    text: str
    annotation: str = ""

    def model_dump(self, **kwargs):
        d = super().model_dump(**kwargs)
        d["from"] = d.pop("from_")
        return d


class ArrowModel(BaseModel):
    model_config = {"populate_by_name": True}

    id: str
    from_endpoint: ArrowEndpointModel = Field(alias="from")
    to_endpoint: ArrowEndpointModel = Field(alias="to")

    def model_dump(self, **kwargs):
        d = super().model_dump(**kwargs)
        d["from"] = d.pop("from_endpoint")
        d["to"] = d.pop("to_endpoint")
        return d


class LayerModel(BaseModel):
    id: str
    name: str
    color: str
    visible: bool = True
    highlights: list[HighlightModel] = []
    arrows: list[ArrowModel] = []


class EditorModel(BaseModel):
    index: int
    name: str
    visible: bool = True
    contentJson: Any | None = None


class WorkspaceState(BaseModel):
    workspaceId: str
    layers: list[LayerModel] = []
    editors: list[EditorModel] = []


class ClientMessage(BaseModel):
    type: str
    payload: dict[str, Any] = {}
    requestId: str | None = None


class ServerMessage(BaseModel):
    type: Literal["state", "action", "ack", "error"]
    payload: dict[str, Any] = {}
    sourceClientId: str | None = None
    requestId: str | None = None
